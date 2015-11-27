import _ from 'lodash';
import DEFAULTS from './defaults';
import fetch from 'isomorphic-fetch';
import STATUS from './status';
import WebSocket from 'ws';

export const IN_BROWSER = typeof window !== 'undefined';

const START_SUFFIX = '#s';
const CANCEL_SUFFIX = '#c'; // START_SUFFIX.length === CANCEL_SUFFIX.length

export default function createInstance(cfg) {
  cfg = _.defaults(cfg, DEFAULTS);
  if (!_.has(cfg, 'owner')) {
    return Promise.reject(new Error('Unable to create an instance, the project owner was not provided.'));
  }
  if (!_.has(cfg, 'name')) {
    return Promise.reject(new Error('Unable to create an instance, the project name was not provided.'));
  }
  if (!_.has(cfg, 'version')) {
    return Promise.reject(new Error('Unable to create an instance, the project version was not provided.'));
  }

  const appId = cfg.appId;
  const appSecret = cfg.appSecret;
  const httpUrl = cfg.httpApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;
  const wsUrl = cfg.wsApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;

  let instanceId;
  let status = STATUS.starting;

  let request = (r) => {
    r = _.defaults(r || {}, {
      method: 'GET',
      path: '',
      body: {},
      headers: {}
    });

    const url = httpUrl + r.path;
    r.headers['X-Craft-Ai-App-Id'] = appId;
    r.headers['X-Craft-Ai-App-Secret'] = appSecret;
    r.headers['Content-Type'] = 'application/json; charset=utf-8';
    r.headers['accept'] = '';

    return fetch(url, {
      method: r.method,
      headers:r.headers,
      body: r.body
    })
    .then((res) => {
      switch (res.status) {
        case 200:
          return res.json();
        case 401:
        case 403:
          return Promise.reject('Unauthorized access please check the given appId/appSecret');
        default:
          return Promise.reject('Unexpected error');
      }
    });
  };

  let actions = {};

  let ws;

  let initWs = () => {
    ws = new WebSocket(wsUrl + '/' + instanceId + '/websockets');
    ws.onmessage = function(evt) {
      if (evt.data != 'ping') {
        const data = JSON.parse(evt.data);
        const actionName = data.call.substring(0, data.call.length - START_SUFFIX.length);
        if (_.endsWith(data.call, CANCEL_SUFFIX)) {
          actions[actionName].cancel(
            data.requestId,
            data.agentId,
            () => request({
              method: 'POST',
              path: '/' + instanceId + '/actions/' + data.requestId + '/cancelation',
              body: JSON.stringify()
            })
          );
        }
        else if (_.endsWith(data.call, START_SUFFIX)) {
          actions[actionName].start(
            data.requestId,
            data.agentId,
            data.input,
            (output) => request({
              method: 'POST',
              path: '/' + instanceId + '/actions/' + data.requestId + '/success',
              body: JSON.stringify(output)
            }),
            (output) => request({
              method: 'POST',
              path: '/' + instanceId + '/actions/' + data.requestId + '/failure',
              body: JSON.stringify(output)
            })
          );
        }
      }
      ws.send('Done');
    };
    ws.onopen = function() {
      ws.send('socket open');
    };
    ws.onclose = function() {
      status = STATUS.destroyed; // Should cleanly call destroy instead
    };
    ws.onerror = function() {
      status = STATUS.destroyed; // Should cleanly call destroy instead
    };
  };

  return request({
    method: 'PUT'
  })
  .then(json => {
    status = STATUS.running;
    instanceId = json.instance.instance_id;
    return {
      instanceId: instanceId,
      getStatus: function() {
        return status;
      },
      getGoogleAuthUri: function(successUri, failureUri) {
        return cfg.hubApiUrl + '/auth/google?x-craft-ai-app-id=' +
          appId + '&x-craft-ai-app-secret=' + appSecret + '&success_uri=' +
          successUri + '&failure_uri=' + failureUri + '?failure=true';
      },
      destroy: function() {
        status = STATUS.stopping;
        if (IN_BROWSER === true) {
          return new Promise((resolve, reject) => {
            // Using directly a XMLHttpRequest to handle properly the destruction on the window destruction
            let oReq = new XMLHttpRequest();
            oReq.open('DELETE', httpUrl + '/' + instanceId, false);
            oReq.setRequestHeader('content-type', 'application/json; charset=utf-8');
            oReq.setRequestHeader('accept', '');
            oReq.setRequestHeader('X-Craft-Ai-App-Id', appId);
            oReq.setRequestHeader('X-Craft-Ai-App-Secret', appSecret);
            oReq.send();
            status = STATUS.destroyed; // This should be done when craft respond
          });
        }
        else {
          return request({
            method: 'DELETE',
            path: '/'+ instanceId
          })
          .then(function(res) {
            status = STATUS.destroyed;
          })
          .catch(err => {
            status = STATUS.destroyed;
            return Promise.reject(err);
          });
        }
      },
      registerAction: function(name, start, cancel = () => undefined) {
        if (_.isUndefined(ws)) {
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
        })
        .then(() => {
          actions[name] = {
            start: start,
            cancel: cancel
          };
        });
      },
      createAgent: function(behavior, knowledge = {}) {
        return request({
          method: 'PUT',
          path: '/'+instanceId+'/agents',
          body: JSON.stringify({
            behavior: behavior,
            knowledge: knowledge
          })
        })
        .then((json) => {
          return json.agent;
        });
      },
      getAgentKnowledge: function(agentId) {
        return request({
          method: 'GET',
          path: '/'+instanceId+'/agents/'+agentId+'/knowledge'
        })
        .then((json)=>{
          return json.knowledge;
        });
      },
      updateAgentKnowledge: function(agentId, knowledge, method='set') {
        return request({
          method: 'POST',
          path: '/'+instanceId+'/agents/'+agentId+'/knowledge?method='+method,
          body: JSON.stringify(knowledge)
        });
      },
      getInstanceKnowledge: function() {
        return request({
          method: 'GET',
          path: '/'+instanceId+'/instanceKnowledge'
        })
        .then((json)=>{
          return json.knowledge;
        });
      },
      updateInstanceKnowledge: function(knowledge, method='set') {
        return request({
          method: 'POST',
          path: '/'+instanceId+'/instanceKnowledge?method='+method,
          body: JSON.stringify(knowledge)
        })
        .then((json)=>{
          return json;
        });
      },
      update: function(delay = undefined) {
        let singleUpdate = () => {
          return request({
            method: 'POST',
            path: '/'+instanceId+'/update',
            body: '{"ts":' + new Date().getTime() + '}'
          });
        };

        if (status !== STATUS.running) {
          return Promise.reject('Can\'t update the instance, it is not running.');
        }
        else if (_.isUndefined(delay)) {
          return singleUpdate();
        }
        else {
          return singleUpdate()
            .then(() => new Promise(resolve => setTimeout(resolve, delay)))
            .then(() => this.update(delay));
        }
      }
    };
  });
}
