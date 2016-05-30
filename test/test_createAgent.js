import craftai, { errors } from '../src';

import MODEL_1 from './data/model_1.json';
import INVALID_MODEL_1 from './data/invalid_model_1.json';

describe('client.createAgent(<model>, [id], [destroyOnExit])', function() {
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
        return client.destroyAgent(agent.id);
      });
  });
  it('should succeed when using a valid model and specified id', function() {
    const id = 'unspeakable_dermatologist';
    return client.createAgent(MODEL_1, id)
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.equal(id);
        return client.destroyAgent(agent.id);
      });
  });
  it('should fail when trying to use the same id twice', function() {
    const id = 'aphasic_parrot';
    return client.createAgent(MODEL_1, id)
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.equal(id);
        return client.createAgent(MODEL_1, id);
      })
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      })
      .then(() => {
        return client.destroyAgent(id);
      })
  });
  it('should succeed when using a valid model, specified id and destroyOnExit', function() {
    return client.createAgent(MODEL_1, 'suicidal_on_exit', true)
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
