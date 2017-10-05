'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = parseOptions;

var _path = require('path');

var _package = require('../package');

var _proxy = require('./utils/proxy');

function parseOptions(params) {
  var defaultOptions = {
    exportDir: process.cwd(),
    includeDrafts: false,
    skipRoles: false,
    skipContentModel: false,
    skipContent: false,
    skipWebhooks: false,
    maxAllowedLimit: 1000,
    saveFile: true,
    useVerboseRenderer: false
  };

  var configFile = params.config ? require((0, _path.resolve)(process.cwd(), params.config)) : {};

  var options = _extends({}, defaultOptions, configFile, params);

  // Validation
  if (!options.spaceId) {
    throw new Error('The `spaceId` option is required.');
  }

  if (!options.managementToken) {
    throw new Error('The `managementToken` option is required.');
  }

  var proxySimpleExp = /.+:\d+/;
  var proxyAuthExp = /.+:.+@.+:\d+/;
  if (options.proxy && !(proxySimpleExp.test(options.proxy) || proxyAuthExp.test(options.proxy))) {
    throw new Error('Please provide the proxy config in the following format:\nhost:port or user:password@host:port');
  }

  // Further processing
  options.sourceSpace = options.spaceId;
  options.sourceManagementToken = options.managementToken;

  if (!options.errorLogFile) {
    options.errorLogFile = options.exportDir + '/contentful-export-' + Date.now() + '.log';
  }

  if (typeof options.proxy === 'string') {
    options.proxy = (0, _proxy.proxyStringToObject)(options.proxy);
  }

  if (options.proxy) {
    options.httpsAgent = (0, _proxy.agentFromProxy)(options.proxy);
    delete options.proxy;
  }

  options.managementApplication = options.managementApplication || `contentful.export/${_package.version}`;
  return options;
}
module.exports = exports['default'];