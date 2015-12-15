import craftai, { errors, STATUS } from '../src';

describe('instance.createAgent(<bt_name>, <initial_knowledge_content>)', function() {
  this.timeout(5000);
  let instance;
  before(function() {
    return craftai(CRAFT_CFG)
      .then(newInstance => {
        expect(newInstance.id).to.be.ok;
        instance = newInstance;
      })
  });
  after(function() {
    if (instance) {
      return instance.destroy()
        .then(() => {
          expect(instance.getStatus()).to.equal(STATUS.destroyed);
          instance = undefined;
        })
    }
  });
  it('should succeed when using a valid behavior', function() {
    return instance.createAgent('test/bts/test.bt')
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.at.least(0);
      })
  });
  it('should fail when using an undefined behavior', function() {
    return instance.createAgent()
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using a non-existing behavior', function() {
    return instance.createAgent('test/bts/bloup.bt')
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        if (IN_BROWSER) {
          expect(err).to.be.an.instanceof(errors.CraftAiNetworkError);
        }
        else {
          expect(err).to.be.an.instanceof(errors.CraftAiInternalError); // This shouldn't be an internal error.
        }
      });
  });
  it('should fail when using an invalid behavior', function() {
    return instance.createAgent('test/bts/invalid_behavior.bt')
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        if (IN_BROWSER) {
          expect(err).to.be.an.instanceof(errors.CraftAiNetworkError);
        }
        else {
          expect(err).to.be.an.instanceof(errors.CraftAiInternalError); // This shouldn't be an internal error.
        }
      });
  });
  it('should succeed when using a valid behavior and initial knowledge', function() {
    const INITIAL_KNOWLEDGE = {
      foo: 'fluctuat nec mergitur',
      bar: [true, 34.3, 'alea jacta est'],
      baz: 42
    };
    return instance.createAgent('test/bts/test.bt', INITIAL_KNOWLEDGE)
      .then(agent => {
        expect(agent).to.be.ok;
        expect(agent.id).to.be.at.least(0);
        return instance.getAgentKnowledge(agent.id)
          .then(k => {
            expect(k).to.be.deep.equal(INITIAL_KNOWLEDGE);
          });
      });
  });
});
