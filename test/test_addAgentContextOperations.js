import craftai, { errors } from '../src';

import MODEL_1 from './data/model_1.json';
import MODEL_1_OPERATIONS_1 from './data/model_1_operations_1.json';

const MODEL_1_OPERATIONS_1_FROM = _.first(MODEL_1_OPERATIONS_1).timestamp;
const MODEL_1_OPERATIONS_1_TO = _.last(MODEL_1_OPERATIONS_1).timestamp;
const MODEL_1_OPERATIONS_1_LAST = _.reduce(
  MODEL_1_OPERATIONS_1,
  (context, operation) => _.extend(context, operation),
  {});

import MODEL_1_OPERATIONS_2 from './data/model_1_operations_2.json';

describe('client.addAgentContextOperations(<agentId>, <operations>)', function() {
  let client;
  let agent;
  const agentId = 'add_agent_context_operations_agent';
  before(function() {
    client = craftai(CRAFT_CFG);
    expect(client).to.be.ok;
  });
  beforeEach(function() {
    return client.destroyAgent(agentId) // Destroy any preexisting agent with this id.
      .then(() => client.createAgent(MODEL_1, agentId))
      .then(createdAgent => {
        expect(createdAgent).to.be.ok;
        agent = createdAgent;
      });
  });
  afterEach(function() {
    return client.destroyAgent(agentId);
  });
  it('should succeed when using valid operations', function() {
    return client.addAgentContextOperations(agent.id, MODEL_1_OPERATIONS_1)
      .then(() => {
        return client.getAgentContext(agent.id, MODEL_1_OPERATIONS_1_TO + 100);
      })
      .then(context => {
        expect(context.context).to.be.deep.equal(MODEL_1_OPERATIONS_1_LAST.diff);
        expect(context.timestamp).to.equal(MODEL_1_OPERATIONS_1_LAST.timestamp);
      })
      .then(() => {
        return client.getAgentContextOperations(agent.id);
      })
      .then(retrievedOperations => {
        expect(retrievedOperations).to.be.deep.equal(MODEL_1_OPERATIONS_1);
      });
  });
  it('should fail when using out of order operations', function() {
    return client.addAgentContextOperations(agent.id, MODEL_1_OPERATIONS_1)
      .then(() => {
        return client.addAgentContextOperations(agent.id, MODEL_1_OPERATIONS_1[0])
      })
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      })
      .then(() => {
        return client.getAgentContextOperations(agent.id);
      })
      .then(retrievedOperations => {
        expect(retrievedOperations).to.be.deep.equal(MODEL_1_OPERATIONS_1);
      });
  });
  it('should succeed with a very large payload', function() {
    this.timeout(10000);
    return client.addAgentContextOperations(agent.id, MODEL_1_OPERATIONS_2);
  });
});
