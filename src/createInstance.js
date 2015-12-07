import _ from 'lodash';
import * as errors from './errors';
import DEFAULTS from './defaults';
import fetch from 'isomorphic-fetch';
import onExit from './onExit';
import STATUS from './status';
import WebSocket from 'ws';

const IN_BROWSER = typeof window !== 'undefined';

const START_SUFFIX = '#s';
const CANCEL_SUFFIX = '#c'; // START_SUFFIX.length === CANCEL_SUFFIX.length

export default function createInstance(cfg) {
  cfg = _.defaults(cfg, DEFAULTS);
  if (!_.has(cfg, 'owner')) {
    return Promise.reject(new errors.CraftAiError('Unable to create an instance, the project owner was not provided.'));
  }
  if (!_.has(cfg, 'name')) {
    return Promise.reject(new errors.CraftAiError('Unable to create an instance, the project name was not provided.'));
  }
  if (!_.has(cfg, 'version')) {
    return Promise.reject(new errors.CraftAiError('Unable to create an instance, the project version was not provided.'));
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

    r.url = httpUrl + r.path;
    r.headers['X-Craft-Ai-App-Id'] = appId;
    r.headers['X-Craft-Ai-App-Secret'] = appSecret;
    r.headers['Content-Type'] = 'application/json; charset=utf-8';
    r.headers['accept'] = '';

    return fetch(r.url, r)
    .catch(err => Promise.reject(new errors.CraftAiNetworkError({
      more: err.message
    })))
    .then(res => res.json()
      .catch(err => Promise.reject(new errors.CraftAiInternalError(
        'Internal Error, the craft ai server responded an invalid json document.', {
          request: r
        }
      )))
      .then(res_content => {
        switch (res.status) {
          case 200:
            return res_content;
          case 401:
          case 403:
            return Promise.reject(new errors.CraftAiCredentialsError({
              more: res_content.message,
              request: r
            }));
          case 500:
            return Promise.reject(new errors.CraftAiInternalError(res_content.message, {
              request: r
            }));
          default:
            return Promise.reject(new errors.CraftAiUnknownError({
              more: res_content.message,
              request: r
            }));
        }
      })
    );
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

  // Function that'll be called when the instance is destroyed.
  let cleanupDestroyOnExit = () => undefined;

  return request({
    method: 'PUT'
  })
  .then(json => {

    status = STATUS.running;
    instanceId = json.instance.instance_id;

    let instance = {
      id: instanceId,
      cfg: cfg,
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
        return request({
          method: 'DELETE',
          path: '/'+ instanceId
        })
        .then(() => {
          cleanupDestroyOnExit();
          status = STATUS.destroyed;
        })
        .catch(err => {
          status = STATUS.destroyed;
          return Promise.reject(err);
        });
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
          return Promise.reject(new errors.CraftAiError('Can\'t update the instance, it is not running.'));
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

    if (cfg.destroyOnExit) {
      cleanupDestroyOnExit = onExit(() => {
        if (IN_BROWSER) {
          // Using directly a XMLHttpRequest to make a synchronous call.
          let oReq = new XMLHttpRequest();
          oReq.open('DELETE', httpUrl + '/' + instance.id, false);
          oReq.setRequestHeader('content-type', 'application/json; charset=utf-8');
          oReq.setRequestHeader('accept', '');
          oReq.setRequestHeader('X-Craft-Ai-App-Id', appId);
          oReq.setRequestHeader('X-Craft-Ai-App-Secret', appSecret);
          instance.status = STATUS.destroyed;
          oReq.send();
        }
        else {
          instance.destroy();
        }
      });
    }

    return instance;
  });
}
