import _ from 'lodash';
import * as errors from './errors';
import Debug from 'debug';
import DEFAULTS from './defaults';
import onExit from './onExit';
import request from './request';
import STATUS from './status';
import WebSocket from 'ws';

const START_SUFFIX = '#s';
const CANCEL_SUFFIX = '#c'; // START_SUFFIX.length === CANCEL_SUFFIX.length

let debug = Debug('craft-ai:client');

export default function createInstance(cfg, knowledge) {
  cfg = _.defaults(cfg, DEFAULTS);
  if (!_.has(cfg, 'owner') || !_.isString(cfg.owner)) {
    return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create an instance with no or invalid project owner provided.'));
  }
  if (!_.has(cfg, 'name') || !_.isString(cfg.name)) {
    return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create an instance with no or invalid project name provided.'));
  }
  if (!_.has(cfg, 'version') || !_.isString(cfg.version)) {
    return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create an instance with no or invalid project version provided.'));
  }

  const appId = cfg.appId;
  const appSecret = cfg.appSecret;
  const wsUrl = cfg.wsApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version;

  let instanceId;
  let status = STATUS.starting;

  let actions = {};

  let ws;
  let sse;

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
              path: '/' + instanceId + '/actions/' + data.requestId + '/cancelation'
            }, cfg)
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
              body: output
            }, cfg),
            (output) => request({
              method: 'POST',
              path: '/' + instanceId + '/actions/' + data.requestId + '/failure',
              body: output
            }, cfg)
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
    method: 'PUT',
    body: {
      knowledge: knowledge
    }
  }, cfg)
  .then(json => {

    status = STATUS.running;
    instanceId = json.instance.instance_id;

    debug(`Instance '${instanceId}' created from ${cfg.owner}/${cfg.name}/${cfg.version}`);

    sse = new EventSource(cfg.httpApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version + '/' instaceId +'/actions/sse');
    sse.onmessage = function(e) {
      const data = JSON.parse(e.data);
      const actionName = data.call.substring(0, data.call.length - START_SUFFIX.length);
      if (_.endsWith(data.call, CANCEL_SUFFIX)) {
        actions[actionName].cancel(
          data.requestId,
          data.agentId,
          () => request({
            method: 'POST',
            path: '/' + instanceId + '/actions/' + data.requestId + '/cancelation'
          }, cfg)
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
            body: output
          }, cfg),
          (output) => request({
            method: 'POST',
            path: '/' + instanceId + '/actions/' + data.requestId + '/failure',
            body: output
          }, cfg)
        );
      }      
    };
    sse.onerror = function() {
      status = STATUS.destroyed; // Should cleanly call destroy instead
    };

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
        }, cfg)
        .then(() => {
          debug(`Instance '${instanceId}' destroyed`);
          cleanupDestroyOnExit();
          sse.close();
          status = STATUS.destroyed;
        })
        .catch(err => {
          status = STATUS.destroyed;
          return Promise.reject(err);
        });
      },
      destroySync: function() {
        status = STATUS.stopping;
        request({
          method: 'DELETE',
          path: '/'+ instanceId,
          asynchronous: false
        }, cfg);
        debug(`Instance '${instanceId}' destroyed`);
        cleanupDestroyOnExit();
        sse.close();
        status = STATUS.destroyed;
      },
      registerAction: function(name, start, cancel = () => undefined) {
        if (_.isUndefined(ws)) {
          initWs();
        }
        return request({
          method: 'PUT',
          path: '/' + instanceId + '/actions',
          body: {
            name: name,
            start: name + START_SUFFIX,
            cancel: name + CANCEL_SUFFIX,
            protocol: 'SSE'
          }
        }, cfg)
        .then(() => {
          actions[name] = {
            start: start,
            cancel: cancel
          };
        });
      },
      createAgent: function(behavior, knowledge = {}) {
        if (_.isUndefined(behavior)) {
          return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create an agent with no behavior provided.'));
        }

        return request({
          method: 'PUT',
          path: '/'+instanceId+'/agents',
          body: {
            behavior: behavior,
            knowledge: knowledge
          }
        }, cfg)
        .then((json) => {
          debug(`Agent #${json.agent.id} created using behavior ${behavior}`);
          return json.agent;
        });
      },
      getAgentKnowledge: function(agentId) {
        if (_.isUndefined(agentId)) {
          return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to retrieve agent knowledge with no agentId provided.'));
        }

        return request({
          method: 'GET',
          path: '/'+instanceId+'/agents/'+agentId+'/knowledge'
        }, cfg)
        .then(json => json.knowledge);
      },
      updateAgentKnowledge: function(agentId, knowledge={}, method='set') {
        if (_.isUndefined(agentId)) {
          return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to update agent knowledge with no agentId provided.'));
        }

        return request({
          method: 'POST',
          path: '/' + instanceId + '/agents/' + agentId + '/knowledge?method=' + method,
          body: knowledge
        }, cfg);
      },
      getInstanceKnowledge: function() {
        return request({
          method: 'GET',
          path: '/' + instanceId + '/instanceKnowledge'
        }, cfg)
        .then(json => json.knowledge);
      },
      updateInstanceKnowledge: function(knowledge={}, method='set') {
        return request({
          method: 'POST',
          path: '/' + instanceId + '/instanceKnowledge?method=' + method,
          body: knowledge
        }, cfg)
        .then((json)=>{
          return json;
        });
      },
      update: function(delay = undefined) {
        let singleUpdate = () => {
          return request({
            method: 'POST',
            path: '/' + instanceId + '/update',
            body: {
              ts: new Date().getTime()
            }
          }, cfg);
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
        debug(`Destroying instance '${instanceId}' before exiting...`);
        instance.destroySync();
      });
    }

    return instance;
  });
}
