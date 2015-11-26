'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IN_BROWSER = undefined;
exports.default = createInstance;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IN_BROWSER = exports.IN_BROWSER = typeof window !== 'undefined';

var CRAFT_API_URL = 'api.craft.ai';
var CRAFT_HUB_URL = 'hub.craft.ai';

var START_SUFFIX = '#s';
var CANCEL_SUFFIX = '#c'; // START_SUFFIX.length === CANCEL_SUFFIX.length

function createInstance(cfg) {
  var appId = cfg.appId;
  var appSecret = cfg.appSecret;
  var httpUrl = 'https://' + CRAFT_API_URL + '/v1/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;
  var wsUrl = 'wss://' + CRAFT_API_URL + '/v1/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;

  var instanceId = undefined;
  var running = false;

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
      running = false;
    };
    ws.onerror = function () {
      running = false;
    };
  };

  return request({
    method: 'PUT'
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    running = true;
    instanceId = json.instance.instance_id;
    return {
      instanceId: instanceId,
      getGoogleAuthUri: function getGoogleAuthUri(successUri, failureUri) {
        return 'https://' + CRAFT_HUB_URL + '/v1/auth/google?x-craft-ai-app-id=' + appId + '&x-craft-ai-app-secret=' + appSecret + '&success_uri=' + successUri + '&failure_uri=' + failureUri + '?failure=true';
      },
      destroy: function destroy() {
        if (IN_BROWSER === true) {
          return new Promise(function (resolve, reject) {
            // Using directly a XMLHttpRequest to handle properly the destruction on the window destruction
            var oReq = new XMLHttpRequest();
            oReq.open('DELETE', httpUrl + '/' + instanceId, false);
            oReq.setRequestHeader('content-type', 'application/json; charset=utf-8');
            oReq.setRequestHeader('accept', '');
            oReq.setRequestHeader('X-Craft-Ai-App-Id', appId);
            oReq.setRequestHeader('X-Craft-Ai-App-Secret', appSecret);
            oReq.send();
            running = false;
          });
        } else {
          return request({
            method: 'DELETE',
            path: '/' + instanceId
          }).then(function (res) {
            running = false;
            return res.status;
          });
        }
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
        }).then(function (res) {
          return res.json();
        }).then(function (json) {
          return json.agent;
        });
      },
      getAgentKnowledge: function getAgentKnowledge(agentId) {
        return request({
          method: 'GET',
          path: '/' + instanceId + '/agents/' + agentId + '/knowledge'
        }).then(function (res) {
          return res.json();
        }).then(function (json) {
          return json.knowledge;
        });
      },
      updateAgentKnowledge: function updateAgentKnowledge(agentId, destination, value) {
        var method = arguments.length <= 3 || arguments[3] === undefined ? 'merge' : arguments[3];

        var k = {};
        k[destination] = value;
        return request({
          method: 'POST',
          path: '/' + instanceId + '/agents/' + agentId + '/knowledge?method=' + method,
          body: JSON.stringify(k)
        }).then(function (res) {
          return res.json();
        });
      },
      getInstanceKnowledge: function getInstanceKnowledge() {
        return request({
          method: 'GET',
          path: '/' + instanceId + '/instanceKnowledge'
        }).then(function (res) {
          return res.json();
        }).then(function (json) {
          return json.knowledge;
        });
      },
      updateInstanceKnowledge: function updateInstanceKnowledge(destination, value) {
        var method = arguments.length <= 2 || arguments[2] === undefined ? 'merge' : arguments[2];

        var k = {};
        k[destination] = value;
        return request({
          method: 'POST',
          path: '/' + instanceId + '/instanceKnowledge?method=' + method,
          body: JSON.stringify(k)
        }).then(function (res) {
          return res.json();
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

        if (!running) {
          return Promise.reject('Can\'t update the instance, it has been destroyed.');
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
  });
}