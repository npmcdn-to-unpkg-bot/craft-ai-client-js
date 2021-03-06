import craftai, { errors } from '../src';

import MODEL_1 from './data/model_1.json';
import INVALID_MODEL_1 from './data/invalid_model_1.json';

describe('client.createAgent(<model>, [id], [deleteOnExit])', function() {
  let client;
  before(function() {
    client = craftai(CRAFT_CFG);
    expect(client).to.be.ok;
  });
  it('should succeed when using a valid model and generated id', function() {
    return client.createAgent(MODEL_1)
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.a.string;
        return client.getAgent(agent.id)
          .then(retrieveAgent => {
            expect(retrieveAgent.model).to.be.deep.equal(MODEL_1);
            return client.deleteAgent(agent.id);
          });
      });
  });
  it('should succeed when using a valid model and specified id', function() {
    const agentId = 'unspeakable_dermatologist';
    return client.deleteAgent(agentId) // Destroy any preexisting agent with this id.
      .then(() => client.createAgent(MODEL_1, agentId))
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.equal(agentId);
        return client.deleteAgent(agent.id);
      })
      .catch(err => {
        client.deleteAgent(agentId) // The test might fail due to duplicate id, let's make sure it doesn't fail twice.
          .then(() => {
            throw err;
          });
      });
  });
  it('should fail when trying to use the same id twice', function() {
    const agentId = 'aphasic_parrot';
    return client.deleteAgent(agentId) // Delete any preexisting agent with this id.
      .then(() => client.createAgent(MODEL_1, agentId))
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.equal(agentId);
        return client.createAgent(MODEL_1, agentId);
      })
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      })
      .then(() => {
        return client.deleteAgent(agentId);
      });
  });
  it('should succeed when using a valid model, specified id and destroyOnExit', function() {
    const agentId = 'suicidal_on_exit';
    return client.deleteAgent(agentId) // Delete any preexisting agent with this id.
      .then(() => client.createAgent(MODEL_1, agentId, true))
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.a.string;
      });
  });
  it('should fail when using an undefined model', function() {
    return client.createAgent(undefined)
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using an invalid model', function() {
    return client.createAgent(INVALID_MODEL_1)
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
});
