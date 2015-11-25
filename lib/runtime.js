'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wsURL = exports.httpURL = exports.agentID = exports.instanceID = exports.ws = exports.inBrowser = undefined;
exports.createInstance = createInstance;
exports.destroyInstance = destroyInstance;
exports.registerActions = registerActions;
exports.createAgent = createAgent;
exports.getAgentKnowledge = getAgentKnowledge;
exports.updateAgentKnowledge = updateAgentKnowledge;
exports.getInstanceKnowledge = getInstanceKnowledge;
exports.setInstanceKnowledge = setInstanceKnowledge;
exports.update = update;
exports.sendSuccess = sendSuccess;
exports.sendFailure = sendFailure;
exports.sendCancel = sendCancel;
exports.doUpdate = doUpdate;
exports.doWS = doWS;
exports.google_auth = google_auth;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var inBrowser = exports.inBrowser = typeof window !== 'undefined';

require('es6-promise').polyfill();

String.prototype.format = function () {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

var runtimeUrl = 'api.craft.ai';
var hubUrl = 'hub.craft.ai';

var ws = exports.ws = undefined;
var instanceID = exports.instanceID = undefined;
var agentID = exports.agentID = undefined;
var httpURL = exports.httpURL = undefined;
var wsURL = exports.wsURL = undefined;

var id;
var secret;

var running = false;

function craftRequest(r) {
  r = _lodash2.default.defaults(r || {}, {
    method: 'GET',
    path: '',
    body: {},
    headers: {}
  });

  var url = httpURL + r.path;
  if (!_lodash2.default.isUndefined(id) && !_lodash2.default.isUndefined(secret)) {
    r.headers['X-Craft-Ai-App-Id'] = id;
    r.headers['X-Craft-Ai-App-Secret'] = secret;
  }
  r.headers['Content-Type'] = 'application/json; charset=utf-8';
  r.headers['accept'] = '';

  return (0, _isomorphicFetch2.default)(url, { method: r.method,
    headers: r.headers,
    body: r.body
  });
}

function createInstance(user, project, version, appId, appSecret) {
  id = appId;
  secret = appSecret;
  exports.httpURL = httpURL = 'https://' + runtimeUrl + '/v1/' + user + '/' + project + '/' + version;
  exports.wsURL = wsURL = 'wss://' + runtimeUrl + '/v1/' + user + '/' + project + '/' + version;
  return craftRequest({
    method: 'PUT'
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    exports.instanceID = instanceID = json.instance.instance_id;
    running = true;
    console.log('instanceID:', instanceID);
  }).catch(function (err) {
    console.log('error in createInstance:', err);
  });
}

function destroyInstance() {
  if (inBrowser === true) {
    var oReq = new XMLHttpRequest();
    oReq.open('DELETE', httpURL + '/' + instanceID, false);
    oReq.setRequestHeader('content-type', 'application/json; charset=utf-8');
    oReq.setRequestHeader('accept', '');
    oReq.setRequestHeader('X-Craft-Ai-App-Id', id);
    oReq.setRequestHeader('X-Craft-Ai-App-Secret', secret);
    oReq.send();
    running = false;
    return oReq.status;
  } else {
    return craftRequest({
      method: 'DELETE',
      path: '/' + instanceID
    }).then(function (res) {
      running = false;
      return res.status;
    }).catch(function (err) {
      console.log('error in destroyInstance:', err);
    });
  }
}

function registerAction(jsonString) {
  return craftRequest({
    method: 'PUT',
    path: '/' + instanceID + '/actions',
    body: jsonString
  }).catch(function (err) {
    console.log('error in registerAction:', err);
  });
}

function registerActions(actionTable) {
  console.log('registering actions...');
  _lodash2.default.map(actionTable, function (obj, key) {
    var actionObject = { 'name': key,
      'start': obj.start.name,
      'cancel': !_lodash2.default.isUndefined(obj.cancel) ? obj.cancel.name : 'cancel' };
    registerAction(JSON.stringify(actionObject)).then(function () {
      return;
    });
  });
}

function createAgent(behavior, knowledge) {
  var params = {};
  params.behavior = behavior;
  params.knowledge = knowledge;
  return craftRequest({
    method: 'PUT',
    path: '/' + instanceID + '/agents',
    body: JSON.stringify(params)
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    exports.agentID = agentID = json.agent.id;
  }).catch(function (err) {
    console.log('error in createAgent:', err);
  });
}

function getAgentKnowledge(agentID) {
  return craftRequest({
    method: 'GET',
    path: '/' + instanceID + '/agents/' + agentID + '/knowledge'
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    return json.knowledge;
  }).catch(function (err) {
    console.log('error in getAgentKnowledge:', err);
  });
}

function updateAgentKnowledge(agentID, destination, value) {
  var method = arguments.length <= 3 || arguments[3] === undefined ? 'merge' : arguments[3];

  var k = {};
  k[destination] = value;
  return craftRequest({
    method: 'POST',
    path: '/' + instanceID + '/agents/' + agentID + '/knowledge?method=' + method,
    body: JSON.stringify(k)
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    return json;
  }).catch(function (err) {
    console.log('error in updateAgentKnowledge:', err);
  });
}

function getInstanceKnowledge() {
  return craftRequest({
    method: 'GET',
    path: '/' + instanceID + '/instanceKnowledge'
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    return json.knowledge;
  }).catch(function (err) {
    console.log('error in getInstanceKnowledge:', err);
  });
}

function setInstanceKnowledge(destination, value) {
  var method = arguments.length <= 2 || arguments[2] === undefined ? 'merge' : arguments[2];

  var k = {};
  k[destination] = value;
  return craftRequest({
    method: 'POST',
    path: '/' + instanceID + '/instanceKnowledge?method=' + method,
    body: JSON.stringify(k)
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    return json;
  }).catch(function (err) {
    console.log('error in setInstanceKnowledge:', err);
  });
}

function update(cbFunction) {
  craftRequest({
    method: 'POST',
    path: '/' + instanceID + '/update',
    body: '{"ts":' + new Date().getTime() + '}'
  }).then(cbFunction).catch(function (err) {
    console.log('error in instance update:', err);
  });
}

function sendSuccess(requestID, jsonString) {
  return craftRequest({
    method: 'POST',
    path: '/' + instanceID + '/actions/' + requestID + '/success',
    body: jsonString
  });
}

function sendFailure(requestID, jsonString) {
  return craftRequest({
    method: 'POST',
    path: '/' + instanceID + '/actions/' + requestID + '/failure',
    body: jsonString
  });
}

function sendCancel(requestID) {
  return craftRequest({
    method: 'POST',
    path: '/' + instanceID + '/actions/' + requestID + '/cancelation'
  });
}

function doUpdate(timeTick) {
  if (running === true) {
    update(function () {
      setTimeout(doUpdate, timeTick);
    });
  }
}

function doWS(actionTable) {
  var wsUrlRoute = wsURL + '/' + instanceID + '/websockets';
  console.log('WS Connexion on', wsUrlRoute);
  if (wsUrlRoute) {
    console.log('requesting WS connexion...');
    exports.ws = ws = new _ws2.default(wsUrlRoute);
    ws.onmessage = function (evt) {
      if (evt.data != 'ping') {
        var jsonEvt = JSON.parse(evt.data);
        console.log('WS data:', evt.data);
        if (inBrowser === true) {
          window[jsonEvt.call](jsonEvt.requestId, jsonEvt.agentId, jsonEvt.input);
        } else {
          actionTable[jsonEvt.call].start(jsonEvt.requestId, jsonEvt.agentId, jsonEvt.input);
        }
      } else {
        // ping web socket
      }
      ws.send('Done');
    };
    ws.onopen = function () {
      ws.send('socket open');
      console.log('WS Connexion open');
    };
    ws.onclose = function () {
      running = false;
      console.log('WS Connexion closed');
    };
    ws.onerror = function () {
      running = false;
      console.log('WS Connexion error');
    };
  }
}

function google_auth(successUri, failureUri, appId, appSecret) {
  return 'https://' + hubUrl + '/v1/auth/google?x-craft-ai-app-id=' + appId + '&x-craft-ai-app-secret=' + appSecret + '&success_uri=' + successUri + '&failure_uri=' + failureUri + '?failure=true';
}