'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CraftAiUnknownError = exports.CraftAiNetworkError = exports.CraftAiInternalError = exports.CraftAiError = exports.CraftAiCredentialsError = undefined;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function CraftAiError(message, extraProperties) {
  var _this = this;

  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || 'Cannot get a stacktrace, browser is too old';
  }

  this.name = this.constructor.name;
  this.message = message || 'Unknown error';

  if (extraProperties) {
    _lodash2.default.forEach(extraProperties, function (value, key) {
      _this[key] = value;
    });
  }
}

(0, _inherits2.default)(CraftAiError, Error);

function createCustomError(name, message) {
  function CraftAiCustomError() {
    var args = Array.prototype.slice.call(arguments, 0);

    // custom message not set, use default
    if (typeof args[0] !== 'string') {
      args.unshift(message);
    }

    CraftAiError.apply(this, args);
    this.name = name;
  }

  (0, _inherits2.default)(CraftAiCustomError, CraftAiError);

  return CraftAiCustomError;
}

var CraftAiUnknownError = createCustomError('CraftAiUnknownError', 'Unknown error occured');

var CraftAiNetworkError = createCustomError('CraftAiNetworkError', 'Network issue, see err.more for details');

var CraftAiCredentialsError = createCustomError('CraftAiCredentialsError', 'Credentials error, make sure the given appId/appSecret are valid');

var CraftAiInternalError = createCustomError('CraftAiInternalError', 'Internal Error, see err.more for details');

exports.CraftAiCredentialsError = CraftAiCredentialsError;
exports.CraftAiError = CraftAiError;
exports.CraftAiInternalError = CraftAiInternalError;
exports.CraftAiNetworkError = CraftAiNetworkError;
exports.CraftAiUnknownError = CraftAiUnknownError;