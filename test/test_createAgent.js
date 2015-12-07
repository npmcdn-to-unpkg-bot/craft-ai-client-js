import craftai, { errors, STATUS } from '../src';

describe('instance', function() {
  this.timeout(5000);
  let instance;
  beforeEach(function() {
    return craftai(CRAFT_CFG)
      .then(newInstance => {
        expect(newInstance.id).to.be.ok;
        instance = newInstance;
      })
  });
  afterEach(function() {
    if (instance) {
      return instance.destroy()
        .then(() => {
          expect(instance.getStatus()).to.equal(STATUS.destroyed);
          instance = undefined;
        })
    }
  });
  describe('.createAgent(<bt_name>, <initial_knowledge_content>)', function() {
    it('should succeed when using a valid behavior', function() {
      return instance.createAgent('test/bts/test.bt')
        .then(agent => {
          expect(agent).to.be.ok;
          expect(agent.id).to.be.equal(0);
        })
    });
    it('should fail when using a non-existing behavior', function() {
      return instance.createAgent('test/bts/bloup.bt')
        .catch(err => {
          expect(err).to.be.an.instanceof(errors.CraftAiError);
        });
    });
  });
});
