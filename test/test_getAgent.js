import craftai, { errors } from '../src';

import MODEL_1 from './data/model_1.json';

describe('client.getAgent(<agentId>)', function() {
  let client;
  let agent;
  const agentId = 'get_agent_agent';
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
      });
  });
  afterEach(function() {
    return client.deleteAgent(agentId);
  });
  it('should return no first/last timestamps on "empty" agents', function() {
    return client.getAgent(agent.id)
      .then(retrievedAgent => {
        expect(retrievedAgent.firstTimestamp).to.be.undefined;
        expect(retrievedAgent.lastTimestamp).to.be.undefined;
      });
  });
  it('should fail on non-existing agent', function() {
    return client.deleteAgent(agentId)
      .then(() => client.getAgent(agent.id))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
});
