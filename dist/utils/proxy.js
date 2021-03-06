'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.proxyStringToObject = proxyStringToObject;
exports.agentFromProxy = agentFromProxy;
exports.proxyObjectToString = proxyObjectToString;

var _url = require('url');

var _lodash = require('lodash');

var _httpsProxyAgent = require('https-proxy-agent');

var _httpsProxyAgent2 = _interopRequireDefault(_httpsProxyAgent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function serializeAuth() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      username = _ref.username,
      password = _ref.password;

  if (!username) {
    return '';
  }

  if (!password) {
    return username;
  }

  return `${username}:${password}`;
}

function parseAuth(authString) {
  // authString may be a falsy value like `null`
  var _split = (authString || '').split(':'),
      _split2 = _slicedToArray(_split, 2),
      username = _split2[0],
      password = _split2[1];

  return { username, password };
}

function proxyStringToObject(proxyString) {
  if (!proxyString.startsWith('http')) {
    return proxyStringToObject(`http://${proxyString}`);
  }

  var _parse = (0, _url.parse)(proxyString),
      host = _parse.hostname,
      portString = _parse.port,
      authString = _parse.auth,
      protocol = _parse.protocol;

  var auth = parseAuth(authString);
  var port = (0, _lodash.toInteger)(portString);
  var isHttps = protocol === 'https:';

  if (!auth.username) {
    return { host, port, isHttps };
  }

  return {
    host,
    port,
    auth,
    isHttps
  };
}
function agentFromProxy(proxy) {
  if (!proxy) {
    return {};
  }
  ['http_proxy', 'https_proxy'].forEach(function (envStr) {
    delete process.env[envStr];
    delete process.env[envStr.toUpperCase()];
  });
  var host = proxy.host,
      port = proxy.port;

  var agent = new _httpsProxyAgent2.default({ host, port });
  return agent;
}

function proxyObjectToString(proxyObject) {
  var hostname = proxyObject.host,
      port = proxyObject.port,
      authObject = proxyObject.auth;

  var auth = serializeAuth(authObject);

  var formatted = (0, _url.format)({ hostname, port, auth });

  // Ugly fix for Node 6 vs Node 8 behavior
  return formatted.replace(/^\/\//, '');
}