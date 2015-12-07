import craftai, { errors, STATUS } from '../src';

describe('instance.getAgentKnowledge(<agent_id>)', function() {
  this.timeout(5000);
  let instance;
  let agentId;
  before(function() {
    return craftai(CRAFT_CFG)
      .then(newInstance => {
        expect(newInstance.id).to.be.ok;
        instance = newInstance;
        return instance.createAgent('test/bts/test.bt')
      })
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.at.least(0);
        agentId = agent.id;
      })
  });
  after(function() {
    if (instance) {
      return instance.destroy()
        .then(() => {
          expect(instance.getStatus()).to.equal(STATUS.destroyed);
          instance = undefined;
          agentId = undefined;
        })
    }
  });
  it('should retrieve an empty knowledge for our agent', function() {
    return instance.getAgentKnowledge(agentId)
      .then(k => {
        expect(k).to.be.deep.equal({});
      });
  });
  it('should retrieve the agent knowledge after updating it', function() {
    const UPDATED_KNOWLEDGE = {
      foo: 'fluctuat nec mergitur',
      bar: [true, 34.3, 'alea jacta est'],
      baz: 42
    };
    return instance.updateAgentKnowledge(agentId, UPDATED_KNOWLEDGE)
      .then(() => instance.getAgentKnowledge(agentId))
      .then(k => {
        expect(k).to.be.deep.equal(UPDATED_KNOWLEDGE);
      })
      .then(() => instance.updateAgentKnowledge(agentId, {}))
      .then(() => instance.getAgentKnowledge(agentId))
      .then(k => {
        expect(k).to.be.deep.equal({});
      });
  });
  it('should fail for non-existing agents', function() {
    const INVALID_AGENT_ID = 342;
    expect(INVALID_AGENT_ID).to.not.be.equal(agentId);
    return instance.getAgentKnowledge(INVALID_AGENT_ID)
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
});
