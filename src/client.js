import _ from 'lodash';
import * as errors from './errors';
import Debug from 'debug';
import DEFAULTS from './defaults';
import onExit from './onExit';
import request from './request';

let debug = Debug('craft-ai:client');

function getPosixTimestamp(ts) {
  if (_.isUndefined(ts)) {
    return Math.floor(Date.now() / 1000);
  }
  else if (_.isNumber(ts)) {
    return Math.floor(ts);
  }
  else if (_.isDate()) {
    return Math.floor(ts.UTC() / 1000);
  }
  else {
    return undefined;
  }
}

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

  // The cache of operations to send.
  let agentsOperations = {};

  // The promise that actually flush the context operations for one agent.
  let flushAgentContextOperationsPromise = agentId => {
    // Extract the operations to flush
    const operationsToFlush = agentsOperations[agentId] || [];
    agentsOperations[agentId] = [];

    if (operationsToFlush.length === 0) {
      // Nothing to flush
      return new Promise(resolve => resolve());
    }
    else {
      // Something to flush, in chunks !
      return _(operationsToFlush)
      .chunk(cfg.operationsChunksSize)
      .reduce((p, chunk) => p.then(
          () => request({
            method: 'POST',
            path: '/agents/' + agentId + '/context',
            body: chunk
          }, cfg)
        ),
        new Promise(resolve => resolve())
      )
      .then(() => {
        debug(`Successfully added ${operationsToFlush.length} operations to the agent ${cfg.owner}/${agentId} context.`);
      });
    }
  };

  // This is the only flush operation that will occur in this client, ever.
  let currentFlushOperation = new Promise(resolve => resolve());

  // To execute when an immediate flush is needed.
  let flushAgentContextOperations = agentId => {
    currentFlushOperation = currentFlushOperation
      .then(() => flushAgentContextOperationsPromise(agentId));
    return currentFlushOperation
      .catch(err => {
        // If an error is caught during this immediate flush, we break the
        // Promise chain to avoid 'contaminating' future flush operations.
        currentFlushOperation = new Promise(resolve => resolve());
        return Promise.reject(err);
      });
  };

  // To execute when an eventual flush is needed.
  let throttledFlushAgentContextOperations = _.throttle(
    agentId => {
      currentFlushOperation = currentFlushOperation
        .then(() => flushAgentContextOperationsPromise(agentId));
      return currentFlushOperation;
    },
    cfg.operationsAdditionWait * 1000,
    {
      leading: true
    }
  );

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

      agentsOperations[agentId] = [];
      
      return request({
        method: 'DELETE',
        path: '/agents/' + agentId
      }, this)
      .then(agent => {
        debug(`Agent '${agentId}' destroyed`);
        return agent;
      });
    },
    getAgentContext: function(agentId, timestamp = undefined) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to get the agent context with no agentId provided.'));
      }
      let posixTimestamp = getPosixTimestamp(timestamp);
      if (_.isUndefined(posixTimestamp)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to get the agent context with no or invalid timestamp provided, supported formats are Numbers and Dates.'));
      }

      return flushAgentContextOperations(agentId)
      .then(() => request({
        method: 'GET',
        path: '/agents/' + agentId + '/context/state',
        query: {
          t: posixTimestamp
        }
      }, this));
    },
    addAgentContextOperations: function(agentId, operations, flush = false) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to add agent context operations with no agentId provided.'));
      }
      if (!_.isArray(operations)) {
        // Only one given operation
        operations = [operations];
      }
      if (_.isUndefined(operations) || !_.isArray(operations) ) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to add agent context operations with no or invalid operations provided.'));
      }

      agentsOperations[agentId] = (agentsOperations[agentId] || []).concat(operations);
      if (flush) {
        return flushAgentContextOperations(agentId);
      }
      else {
        throttledFlushAgentContextOperations(agentId);
        return new Promise(resolve => resolve());
      }
    },
    getAgentContextOperations: function(agentId) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to get agent context operations with no agentId provided.'));
      }

      return flushAgentContextOperations(agentId)
      .then(() => request({
        method: 'GET',
        path: '/agents/' + agentId + '/context'
      }, this));
    },
    computeAgentDecision: function(agentId, timestamp, context) {
      if (_.isUndefined(agentId)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no agentId provided.'));
      }
      let posixTimestamp = getPosixTimestamp(timestamp);
      if (_.isUndefined(posixTimestamp)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no or invalid timestamp provided, supported formats are Numbers and Dates.'));
      }
      if (_.isUndefined(context) || !_.isObject(context)) {
        return Promise.reject(new errors.CraftAiBadRequestError('Bad Request, unable to compute an agent decision with no or invalid context provided.'));
      }

      return flushAgentContextOperations(agentId)
      .then(() => request({
        method: 'POST',
        path: '/agents/' + agentId + '/decision',
        query: {
          t: posixTimestamp
        },
        body: context
      }, this));
    }
  });

  return instance;
}
