import craftai from '../src';

import MODEL_1 from './data/model_1.json';
import MODEL_1_OPERATIONS_1 from './data/model_1_operations_1.json';

const MODEL_1_OPERATIONS_1_TO = _.last(MODEL_1_OPERATIONS_1).timestamp;

describe('client.computeAgentDecision(<agentId>, <timestamp>, <context>)', function() {
  let client;
  let agent;
  const agentId = 'compute_agent_decision_agent';
  before(function() {
    client = craftai(CRAFT_CFG);
    expect(client).to.be.ok;
  });
  beforeEach(function() {
    return client.deleteAgent(agentId) // Delete any preexisting agent with this id.
      .then(() => client.createAgent(MODEL_1, agentId))
      .then(createdAgent => {
        expect(createdAgent).to.be.ok;
        agent = createdAgent;
        return client.addAgentContextOperations(agent.id, MODEL_1_OPERATIONS_1);
      });
  });
  afterEach(function() {
    return client.deleteAgent(agentId);
  });
  it('should succeed when using valid parameters', function() {
    return client.computeAgentDecision(agent.id, MODEL_1_OPERATIONS_1_TO + 200, {
      presence: 'none',
      lightIntensity: 0.1
    })
      .then(context => {
        expect(context).to.be.ok;
        expect(context.decision.lightbulbColor).to.be.equal('black');
      });
  });
  it('should succeed when using valid parameters (context override)', function() {
    return client.computeAgentDecision(agent.id, MODEL_1_OPERATIONS_1_TO + 200, {
      presence: 'none',
      lightIntensity: 1
    }, {
      lightIntensity: 0.1
    })
      .then(context => {
        expect(context).to.be.ok;
        expect(context.decision.lightbulbColor).to.be.equal('black');
      });
  });
});
