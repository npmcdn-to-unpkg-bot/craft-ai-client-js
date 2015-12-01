'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IN_BROWSER = typeof window !== 'undefined';

function onWindowCloses(cb) {
  var listener = function listener() {
    cb();
  };
  window.addEventListener('beforeunload', listener);
  return function () {
    return window.removeEventListener(listener);
  };
}

var NODE_PROCESS_EVENT = ['unhandledRejection', 'uncaughtException', 'SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];

function onProcessQuits(cb) {
  var listener = function listener() {
    cb();
  };
  _lodash2.default.map(NODE_PROCESS_EVENT, function (evt) {
    return process.on(evt, listener);
  });
  return function () {
    return _lodash2.default.map(NODE_PROCESS_EVENT, function (evt) {
      return process.removeListener(evt, listener);
    });
  };
}

var onExit = IN_BROWSER ? onWindowCloses : onProcessQuits;

exports.default = onExit;