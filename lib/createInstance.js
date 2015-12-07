'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createInstance;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _errors = require('./errors');

var errors = _interopRequireWildcard(_errors);

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _onExit = require('./onExit');

var _onExit2 = _interopRequireDefault(_onExit);

var _status = require('./status');

var _status2 = _interopRequireDefault(_status);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IN_BROWSER = typeof window !== 'undefined';

var START_SUFFIX = '#s';
var CANCEL_SUFFIX = '#c'; // START_SUFFIX.length === CANCEL_SUFFIX.length

function createInstance(cfg) {
  cfg = _lodash2.default.defaults(cfg, _defaults2.default);
  if (!_lodash2.default.has(cfg, 'owner')) {
    return Promise.reject(new errors.CraftAiError('Unable to create an instance, the project owner was not provided.'));
  }
  if (!_lodash2.default.has(cfg, 'name')) {
    return Promise.reject(new errors.CraftAiError('Unable to create an instance, the project name was not provided.'));
  }
  if (!_lodash2.default.has(cfg, 'version')) {
    return Promise.reject(new errors.CraftAiError('Unable to create an instance, the project version was not provided.'));
  }

  var appId = cfg.appId;
  var appSecret = cfg.appSecret;
  var httpUrl = cfg.httpApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;
  var wsUrl = cfg.wsApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;

  var instanceId = undefined;
  var status = _status2.default.starting;

  var request = function request(r) {
    r = _lodash2.default.defaults(r || {}, {
      method: 'GET',
      path: '',
      body: {},
      headers: {}
    });

    var url = httpUrl + r.path;
    r.headers['X-Craft-Ai-App-Id'] = appId;
    r.headers['X-Craft-Ai-App-Secret'] = appSecret;
    r.headers['Content-Type'] = 'application/json; charset=utf-8';
    r.headers['accept'] = '';

    return (0, _isomorphicFetch2.default)(url, {
      method: r.method,
      headers: r.headers,
      body: r.body
    }).catch(function (err) {
      return Promise.reject(new errors.CraftAiNetworkError({
        more: err.message
      }));
    }).then(function (res) {
      switch (res.status) {
        case 200:
          return res.json();
        case 401:
        case 403:
          return Promise.reject(new errors.CraftAiCredentialsError());
        default:
          return Promise.reject(new errors.CraftAiUnknownError());
      }
    });
  };

  var actions = {};

  var ws = undefined;

  var initWs = function initWs() {
    ws = new _ws2.default(wsUrl + '/' + instanceId + '/websockets');
    ws.onmessage = function (evt) {
      if (evt.data != 'ping') {
        (function () {
          var data = JSON.parse(evt.data);
          var actionName = data.call.substring(0, data.call.length - START_SUFFIX.length);
          if (_lodash2.default.endsWith(data.call, CANCEL_SUFFIX)) {
            actions[actionName].cancel(data.requestId, data.agentId, function () {
              return request({
                method: 'POST',
                path: '/' + instanceId + '/actions/' + data.requestId + '/cancelation',
                body: JSON.stringify()
              });
            });
          } else if (_lodash2.default.endsWith(data.call, START_SUFFIX)) {
            actions[actionName].start(data.requestId, data.agentId, data.input, function (output) {
              return request({
                method: 'POST',
                path: '/' + instanceId + '/actions/' + data.requestId + '/success',
                body: JSON.stringify(output)
              });
            }, function (output) {
              return request({
                method: 'POST',
                path: '/' + instanceId + '/actions/' + data.requestId + '/failure',
                body: JSON.stringify(output)
              });
            });
          }
        })();
      }
      ws.send('Done');
    };
    ws.onopen = function () {
      ws.send('socket open');
    };
    ws.onclose = function () {
      status = _status2.default.destroyed; // Should cleanly call destroy instead
    };
    ws.onerror = function () {
      status = _status2.default.destroyed; // Should cleanly call destroy instead
    };
  };

  // Function that'll be called when the instance is destroyed.
  var cleanupDestroyOnExit = function cleanupDestroyOnExit() {
    return undefined;
  };

  return request({
    method: 'PUT'
  }).then(function (json) {

    status = _status2.default.running;
    instanceId = json.instance.instance_id;

    var instance = {
      id: instanceId,
      cfg: cfg,
      getStatus: function getStatus() {
        return status;
      },
      getGoogleAuthUri: function getGoogleAuthUri(successUri, failureUri) {
        return cfg.hubApiUrl + '/auth/google?x-craft-ai-app-id=' + appId + '&x-craft-ai-app-secret=' + appSecret + '&success_uri=' + successUri + '&failure_uri=' + failureUri + '?failure=true';
      },
      destroy: function destroy() {
        status = _status2.default.stopping;
        return request({
          method: 'DELETE',
          path: '/' + instanceId
        }).then(function () {
          cleanupDestroyOnExit();
          status = _status2.default.destroyed;
        }).catch(function (err) {
          status = _status2.default.destroyed;
          return Promise.reject(err);
        });
      },
      registerAction: function registerAction(name, start) {
        var cancel = arguments.length <= 2 || arguments[2] === undefined ? function () {
          return undefined;
        } : arguments[2];

        if (_lodash2.default.isUndefined(ws)) {
          initWs();
        }
        return request({
          method: 'PUT',
          path: '/' + instanceId + '/actions',
          body: JSON.stringify({
            name: name,
            start: name + START_SUFFIX,
            cancel: name + CANCEL_SUFFIX
          })
        }).then(function () {
          actions[name] = {
            start: start,
            cancel: cancel
          };
        });
      },
      createAgent: function createAgent(behavior) {
        var knowledge = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        return request({
          method: 'PUT',
          path: '/' + instanceId + '/agents',
          body: JSON.stringify({
            behavior: behavior,
            knowledge: knowledge
          })
        }).then(function (json) {
          return json.agent;
        });
      },
      getAgentKnowledge: function getAgentKnowledge(agentId) {
        return request({
          method: 'GET',
          path: '/' + instanceId + '/agents/' + agentId + '/knowledge'
        }).then(function (json) {
          return json.knowledge;
        });
      },
      updateAgentKnowledge: function updateAgentKnowledge(agentId, knowledge) {
        var method = arguments.length <= 2 || arguments[2] === undefined ? 'set' : arguments[2];

        return request({
          method: 'POST',
          path: '/' + instanceId + '/agents/' + agentId + '/knowledge?method=' + method,
          body: JSON.stringify(knowledge)
        });
      },
      getInstanceKnowledge: function getInstanceKnowledge() {
        return request({
          method: 'GET',
          path: '/' + instanceId + '/instanceKnowledge'
        }).then(function (json) {
          return json.knowledge;
        });
      },
      updateInstanceKnowledge: function updateInstanceKnowledge(knowledge) {
        var method = arguments.length <= 1 || arguments[1] === undefined ? 'set' : arguments[1];

        return request({
          method: 'POST',
          path: '/' + instanceId + '/instanceKnowledge?method=' + method,
          body: JSON.stringify(knowledge)
        }).then(function (json) {
          return json;
        });
      },
      update: function update() {
        var _this = this;

        var delay = arguments.length <= 0 || arguments[0] === undefined ? undefined : arguments[0];

        var singleUpdate = function singleUpdate() {
          return request({
            method: 'POST',
            path: '/' + instanceId + '/update',
            body: '{"ts":' + new Date().getTime() + '}'
          });
        };

        if (status !== _status2.default.running) {
          return Promise.reject(new errors.CraftAiError('Can\'t update the instance, it is not running.'));
        } else if (_lodash2.default.isUndefined(delay)) {
          return singleUpdate();
        } else {
          return singleUpdate().then(function () {
            return new Promise(function (resolve) {
              return setTimeout(resolve, delay);
            });
          }).then(function () {
            return _this.update(delay);
          });
        }
      }
    };

    if (cfg.destroyOnExit) {
      cleanupDestroyOnExit = (0, _onExit2.default)(function () {
        if (IN_BROWSER) {
          // Using directly a XMLHttpRequest to make a synchronous call.
          var oReq = new XMLHttpRequest();
          oReq.open('DELETE', httpUrl + '/' + instance.id, false);
          oReq.setRequestHeader('content-type', 'application/json; charset=utf-8');
          oReq.setRequestHeader('accept', '');
          oReq.setRequestHeader('X-Craft-Ai-App-Id', appId);
          oReq.setRequestHeader('X-Craft-Ai-App-Secret', appSecret);
          instance.status = _status2.default.destroyed;
          oReq.send();
        } else {
          instance.destroy();
        }
      });
    }

    return instance;
  });
}