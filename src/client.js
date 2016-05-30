import _ from 'lodash';
import * as errors from './errors';
import Debug from 'debug';
import DEFAULTS from './defaults';
import onExit from './onExit';
import request from './request';

let debug = Debug('craft-ai:client');

export default function createClient(cfg) {
  cfg = _.defaults(_.clone(cfg), DEFAULTS);

  // Initialization check
  if (!_.has(cfg, 'token') || !_.isString(cfg.token)) {
    return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create a client with no or invalid token provided.'));
  }
  if (!_.has(cfg, 'url') || !_.isString(cfg.url)) {
    return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create a client with no or invalid url provided.'));
  }
  if (!_.has(cfg, 'owner') || !_.isString(cfg.owner)) {
    return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create a client with no or invalid owner provided.'));
  }

  // The list of agents to remove 'onExit'
  let agentsToDestroyOnExit = [];
  onExit(() => {
    if (agentsToDestroyOnExit.length > 0) {
      debug(`Destroying agents ${ _.map(agentsToDestroyOnExit, agent => `'${agent}'`).join(', ') } before exiting...`);
      _.forEach(agentsToDestroyOnExit, agentId => {
        request({
          method: 'DELETE',
          path: '/agents/' + agentId,
          asynchronous: false
        }, cfg);
      });
    }
  });

  // 'Public' attributes & methods
  let instance = _.defaults(_.clone(cfg), DEFAULTS, {
    cfg: cfg,
    createAgent: function(model, id = undefined, destroyOnExit = false) {
      if (_.isUndefined(model) || !_.isObject(model)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to create an agent with no or invalid model provided.'));
      }

      return request({
        method: 'POST',
        path: '/agents',
        body: {
          id: id,
          model: model
        }
      }, this)
      .then(agent => {
        debug(`Agent '${agent.id}' created using model '${agent.model}'`);
        if (destroyOnExit) {
          agentsToDestroyOnExit.push(agent.id);
        }
        return agent;
      });
    },
    destroyAgent: function(agentId) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to destroy an agent with no agentId provided.'));
      }

      return request({
        method: 'DELETE',
        path: '/agents/' + agentId
      }, this)
      .then(agent => {
        debug(`Agent '${agent.id}' destroyed`);
        return agent;
      });
    },
    addAgentContextOperations: function(agentId, operations) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to add operations to agent context with no agentId provided.'));
      }
      if (_.isUndefined(operations) || !_.isArray(operations)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no or invalid operations provided.'));
      }

      return request({
        method: 'POST',
        path: '/agents/' + agentId + '/context',
        body: operations
      }, this);
    },
    computeAgentDecision: function(agentId, timestamp, context) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no agentId provided.'));
      }
      if (_.isUndefined(timestamp)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no timestamp provided.'));
      }
      let posixTimestamp;
      if (_.isInteger(timestamp)) {
        posixTimestamp = timestamp;
      }
      else if (_.isDate()) {
        posixTimestamp = Math.floor(timestamp.UTC() / 1000);
      }
      else {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with an invalid timestamp provided, supported formats are Integers and Dates.'));
      }
      if (_.isUndefined(context) || !_.isObject(context)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no or invalid context provided.'));
      }

      return request({
        method: 'POST',
        path: '/' + this.id + '/instanceKnowledge',
        queries: {
          t: posixTimestamp
        },
        body: context
      }, this)
      .then(json => json.knowledge);
    }
  });

  return instance;
}
