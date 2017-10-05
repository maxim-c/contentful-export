'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runContentfulExport;

var _createClients = require('contentful-batch-libs/dist/utils/create-clients');

var _createClients2 = _interopRequireDefault(_createClients);

var _dumpErrorBuffer = require('./dump-error-buffer');

var _dumpErrorBuffer2 = _interopRequireDefault(_dumpErrorBuffer);

var _downloadAsset = require('./download-asset');

var _downloadAsset2 = _interopRequireDefault(_downloadAsset);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _getFullSourceSpace = require('contentful-batch-libs/dist/get/get-full-source-space');

var _getFullSourceSpace2 = _interopRequireDefault(_getFullSourceSpace);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _listr = require('listr');

var _listr2 = _interopRequireDefault(_listr);

var _listrUpdateRenderer = require('listr-update-renderer');

var _listrUpdateRenderer2 = _interopRequireDefault(_listrUpdateRenderer);

var _listrVerboseRenderer = require('listr-verbose-renderer');

var _listrVerboseRenderer2 = _interopRequireDefault(_listrVerboseRenderer);

var _lodash = require('lodash');

var _cliTable = require('cli-table2');

var _cliTable2 = _interopRequireDefault(_cliTable);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _bfjNode = require('bfj-node4');

var _bfjNode2 = _interopRequireDefault(_bfjNode);

var _parseOptions = require('./parseOptions');

var _parseOptions2 = _interopRequireDefault(_parseOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var summary = {};

function createListrOptions(options) {
  if (options.useVerboseRenderer) {
    return {
      renderer: _listrVerboseRenderer2.default
    };
  }
  return {
    renderer: _listrUpdateRenderer2.default,
    collapse: false
  };
}

function runContentfulExport(params) {
  summary.startTime = (0, _moment2.default)();

  var options = (0, _parseOptions2.default)(params);

  var listrOptions = createListrOptions(options);

  var tasks = new _listr2.default([{
    title: 'Initialize clients',
    task: function task(ctx) {
      ctx.clients = (0, _createClients2.default)(options);
    }
  }, {
    title: 'Fetching data from space',
    task: function task(ctx) {
      return (0, _getFullSourceSpace2.default)({
        managementClient: ctx.clients.source.management,
        spaceId: ctx.clients.source.spaceId,
        maxAllowedLimit: options.maxAllowedLimit,
        includeDrafts: options.includeDrafts,
        skipContentModel: options.skipContentModel,
        skipContent: options.skipContent,
        skipWebhooks: options.skipWebhooks,
        skipRoles: options.skipRoles,
        listrOptions
      });
    }
  }, {
    title: 'Download assets',
    task: function task(ctx) {
      var successCount = 0;
      var warningCount = 0;
      var errorCount = 0;

      _npmlog2.default.info('export', `Downloading ${ctx.data.assets.length} assets`);

      return _bluebird2.default.map(ctx.data.assets, function (asset) {
        if (!asset.fields.file) {
          _npmlog2.default.warn('-> asset has no file(s)', JSON.stringify(asset));
          warningCount++;
          return;
        }
        var locales = Object.keys(asset.fields.file);
        return _bluebird2.default.mapSeries(locales, function (locale) {
          var url = asset.fields.file[locale].url || asset.fields.file[locale].upload;
          return (0, _downloadAsset2.default)(url, options.exportDir).then(function (downLoadedFile) {
            _npmlog2.default.info('export', '-> ' + downLoadedFile);
            successCount++;
          }).catch(function (error) {
            _npmlog2.default.error('export', '-> error downloading ' + url + ' => ' + error.message);
            _npmlog2.default.error('export', JSON.stringify(error, null, 2));
            errorCount++;
          });
        });
      }, {
        concurrency: 6
      }).then(function () {
        ctx.assetDownloads = {
          successCount,
          warningCount,
          errorCount
        };
      });
    },
    skip: function skip() {
      return !options.downloadAssets;
    }
  }, {
    title: 'Writing data to file',
    task: function task(ctx) {
      _fs2.default.existsSync(options.exportDir) || _fs2.default.mkdirSync(options.exportDir);
      var fileName = options.fileName ? options.fileName : `${options.exportDir}/contentful-export-${ctx.clients.source.spaceId}-${Date.now()}.json`;
      ctx.responseFile = `${options.exportDir}/${fileName}`;
      return _bfjNode2.default.write(ctx.responseFile, ctx.data, {
        circular: 'ignore',
        space: 2
      });
    },
    skip: function skip() {
      return !options.saveFile;
    }
  }], listrOptions);

  return tasks.run({
    data: {}
  }).then(function (ctx) {
    var responseTable = new _cliTable2.default();

    responseTable.push([{ colSpan: 2, content: 'Exported entities' }]);

    Object.keys(ctx.data).forEach(function (type) {
      responseTable.push([(0, _lodash.startCase)(type), ctx.data[type].length]);
    });

    console.log(responseTable.toString());

    if ('assetDownloads' in summary) {
      var downloadsTable = new _cliTable2.default();
      downloadsTable.push([{ colSpan: 2, content: 'Asset file download results' }]);
      downloadsTable.push(['Successful', ctx.assetDownloads.successCount]);
      downloadsTable.push(['Warnings ', ctx.assetDownloads.warningCount]);
      downloadsTable.push(['Errors ', ctx.assetDownloads.errorCount]);
      console.log(downloadsTable.toString());
    }

    var durationHuman = summary.startTime.fromNow(true);
    var durationSeconds = (0, _moment2.default)().diff(summary.startTime, 'seconds');

    _npmlog2.default.info('export', `The export took ${durationHuman} (${durationSeconds}s)`);
    if (options.saveFile) {
      _npmlog2.default.info('export', `Stored space data to json file at: ${ctx.responseFile}`);
    }
    return ctx.data;
  }).catch(function (err) {
    var sourceSpace = options.sourceSpace,
        errorLogFile = options.errorLogFile;

    (0, _dumpErrorBuffer2.default)({
      sourceSpace,
      errorLogFile
    });
    throw err;
  });
}
module.exports = exports['default'];