import craftai, { errors, STATUS } from '../src';

describe('instance.getInstanceKnowledge()', function() {
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
  it('should retrieve an empty instance knowledge', function() {
    return instance.getInstanceKnowledge()
      .then(k => {
        expect(k).to.be.deep.equal({});
      });
  });
  it('should retrieve the instance knowledge after updating it', function() {
    const UPDATED_KNOWLEDGE = {
      foo: 'fluctuat nec mergitur',
      bar: [true, 34.3, 'alea jacta est'],
      baz: 42
    };
    return instance.updateInstanceKnowledge(UPDATED_KNOWLEDGE)
      .then(k => instance.getInstanceKnowledge())
      .then(k => {
        expect(k).to.be.deep.equal(UPDATED_KNOWLEDGE);
      })
      .then(() => instance.updateInstanceKnowledge({}))
      .then(() => instance.getInstanceKnowledge())
      .then(k => {
        expect(k).to.be.deep.equal({});
      });
  });
});
