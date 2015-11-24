export const inBrowser = typeof window !== 'undefined';

import WebSocket from 'ws';
import _ from 'lodash';
var fetch = inBrowser === true ? require('whatwg-fetch') : require('node-fetch');

String.prototype.format = function() {
  let args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { return typeof args[number] != 'undefined' ? args[number] : match; });
};

const runtimeUrl = 'api.craft.ai';
const hubUrl = 'hub.craft.ai';

export var ws;
export var instanceID;
export var agentID;
export var httpURL;
export var wsURL;

var id;
var secret;

var idUpdate = false;

function craftRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    body: {},
    headers: {}
  });

  var url = httpURL + r.path;
  if ((!_.isUndefined(id)) && (!_.isUndefined(secret))) {
    r.headers['X-Craft-Ai-App-Id'] = id;
    r.headers['X-Craft-Ai-App-Secret'] = secret;
  }
  r.headers['Content-Type'] = 'application/json; charset=utf-8';
  r.headers['accept'] = '';
  
  return fetch(url, {method: r.method,
    headers:r.headers,
    body: r.body
  });
}

export function createInstance(user, project, version, appId, appSecret) {
  id = appId;
  secret = appSecret;
  httpURL = 'https://' + runtimeUrl + '/v1/' + user + '/' + project + '/' + version;
  wsURL = 'wss://' + runtimeUrl + '/v1/' + user + '/' + project + '/' + version;
  return craftRequest({
    method: 'PUT'
  })
  .then((res)=>{
    return res.json();
  })
  .then((json)=>{
    instanceID = json.instance.instance_id;
    idUpdate = true;
    console.log('instanceID:', instanceID);
  })
  .catch((err)=>{
    console.log('error in createInstance:', err);
  });
}

export function destroyInstance() {
  if (inBrowser === true){
    let oReq = new XMLHttpRequest();
    oReq.open('DELETE', httpURL + '/' + instanceID, false);
    oReq.setRequestHeader('content-type', 'application/json; charset=utf-8');
    oReq.setRequestHeader('accept', '');
    oReq.setRequestHeader('X-Craft-Ai-App-Id', id);
    oReq.setRequestHeader('X-Craft-Ai-App-Secret', secret);
    oReq.send();
    idUpdate = false;
    return oReq.status;
  }
  else {
    return craftRequest({
      method: 'DELETE',
      path: '/'+instanceID
    })
    .then(function(res) {
      idUpdate = false;
      return res.status;
    })
    .catch((err)=>{
      console.log('error in destroyInstance:', err);
    });
  }
}

function registerAction(jsonString) {
  return craftRequest({
    method: 'PUT',
    path: '/'+instanceID+'/actions',
    body: jsonString
  })
  .catch((err)=>{
    console.log('error in registerAction:', err);
  });
}

export function registerActions(actionTable) {
  console.log('registering actions...');
  _.map(actionTable, (obj, key)=>{
    let actionObject = {'name': key, 
                        'start': obj.start.name, 
                        'cancel': !_.isUndefined(obj.cancel) ? obj.cancel.name : 'cancel'};
    registerAction(JSON.stringify(actionObject))
    .then(()=>{
      return;
    });
  });
}

export function createAgent(behavior, knowledge) {
  let params = {};
  params.behavior = behavior;
  params.knowledge = knowledge;
  return craftRequest({
    method: 'PUT',
    path: '/'+instanceID+'/agents',
    body: JSON.stringify(params)
  })
  .then((res)=>{
    return res.json();
  })
  .then((json)=>{
    agentID = json.agent.id;
  })
  .catch((err)=>{
    console.log('error in createAgent:', err);
  });
}

export function getAgentKnowledge(agentID) {
  return craftRequest({
    method: 'GET',
    path: '/'+instanceID+'/agents/'+agentID+'/knowledge'
  })
  .then((res)=>{
    return res.json();
  })
  .then((json)=>{
    return json.knowledge;
  })
  .catch((err)=>{
    console.log('error in getAgentKnowledge:', err);
  });
}

export function updateAgentKnowledge(agentID, destination, value, method='merge') {
  let k = {};
  k[destination] = value;
  return craftRequest({
    method: 'POST',
    path: '/'+instanceID+'/agents/'+agentID+'/knowledge?method='+method,
    body: JSON.stringify(k)
  })
  .then((res)=>{
    return res.json();
  })
  .then((json)=>{
    return json;
  })
  .catch((err)=>{
    console.log('error in updateAgentKnowledge:', err);
  });
}

export function getInstanceKnowledge() {
  return craftRequest({
    method: 'GET',
    path: '/'+instanceID+'/instanceKnowledge'
  })
  .then((res)=>{
    return res.json();
  })
  .then((json)=>{
    return json.knowledge;
  })
  .catch((err)=>{
    console.log('error in getInstanceKnowledge:', err);
  });
}

export function setInstanceKnowledge(destination, value, method='merge') {
  let k = {};
  k[destination] = value;
  return craftRequest({
    method: 'POST',
    path: '/'+instanceID+'/instanceKnowledge?method='+method,
    body: JSON.stringify(k)
  })
  .then((res)=>{
    return res.json();
  })
  .then((json)=>{
    return json;
  })
  .catch((err)=>{
    console.log('error in setInstanceKnowledge:', err);
  });
}

export function update(cbFunction) {
  craftRequest({
    method: 'POST',
    path: '/'+instanceID+'/update',
    body: '{"time":0.5,"ts":' + new Date().getTime() + '}'
  })
  .then(cbFunction)
  .catch((err)=>{
    console.log('error in instance update:', err);
  });
}

export function sendSuccess(requestID, jsonString) {
  return craftRequest({
    method: 'POST',
    path: '/'+instanceID+'/actions/'+requestID+'/success',
    body: jsonString
  });
}

export function sendFailure(requestID, jsonString) {
  return craftRequest({
    method: 'POST',
    path: '/'+instanceID+'/actions/'+requestID+'/failure',
    body: jsonString
  });
}

export function sendCancel(requestID) {
  return craftRequest({
    method: 'POST',
    path: '/'+instanceID+'/actions/'+requestID+'/cancelation'
  });
}

export function doUpdate(timeTick) {
  if (idUpdate === true) {
    update(()=>{
      setTimeout(doUpdate, timeTick);
    });
  }
}

export function doWS(actionTable) {
  let wsUrlRoute = wsURL + '/' + instanceID + '/websockets';
  console.log('WS Connexion on', wsUrlRoute);
  if (wsUrlRoute) {
    console.log('requesting WS connexion...');
    ws = new WebSocket(wsUrlRoute);
    ws.onmessage = function(evt) {
      if (evt.data != 'ping') {
        let jsonEvt = JSON.parse(evt.data);
        console.log('WS data:', evt.data);
        if (inBrowser === true){
          window[jsonEvt.call](jsonEvt.requestId , jsonEvt.agentId, jsonEvt.input);
        }
        else {
          actionTable[jsonEvt.call].start(jsonEvt.requestId, jsonEvt.agentId, jsonEvt.input);
        }
      }
      else {
        // ping web socket
      }
      ws.send('Done');
    };
    ws.onopen = function() {
      ws.send('socket open');
      console.log('WS Connexion open');
    };
    ws.onclose = function() {
      idUpdate = false;
      console.log('WS Connexion closed');
    };
    ws.onerror = function() {
      idUpdate = false;
      console.log('WS Connexion error');
    };
  }
}

export function google_auth(successUri, failureUri, appId, appSecret) {
  return 'https://' + hubUrl + '/v1/auth/google?x-craft-ai-app-id=' + appId + '&x-craft-ai-app-secret=' + appSecret + '&success_uri=' + successUri + '&failure_uri=' + failureUri + '?failure=true';
}
