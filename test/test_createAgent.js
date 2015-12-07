import _ from 'lodash';
import assert from 'assert';
import craftai, { STATUS } from '../src';
import dotenv from 'dotenv';

dotenv.config({silent: true});
dotenv.load();

const CRAFT_CFG = {
  owner: 'craft-ai',
  name: 'craft-ai-client-js',
  version: 'master',
  appId: process.env.CRAFT_APP_ID,
  appSecret: process.env.CRAFT_APP_SECRET
}

describe('instance', function() {
  this.timeout(5000);
  let instance;
  beforeEach(function() {
    return craftai(CRAFT_CFG)
      .then(newInstance => {
        assert.notEqual(newInstance.id , undefined);
        instance = newInstance;
      });
  });
  afterEach(function() {
    if (instance) {
      return instance.destroy()
        .then(() => {
          assert.equal(instance.getStatus() , STATUS.destroyed);
          instance = undefined;
        });
    }
  });
  describe('.createAgent(<bt_name>, <initial_knowledge_content>)', function() {
    it('should succeed when using a valid behavior', function() {
      return instance.createAgent('test/bts/test.bt')
        .then(agent => {
          assert.notEqual(agent.id , undefined);
        })
        .catch(err => {
          assert.fail(err, undefined);
        });
    });
    it('should fail when using a non-existing behavior', function() {
      return instance.createAgent('test/bts/bloup.bt')
        .catch(err => {
          assert.notEqual(err , undefined);
        });
    });
  });
});
