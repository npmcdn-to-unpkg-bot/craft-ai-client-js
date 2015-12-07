import _ from 'lodash';
import craftai, { STATUS } from '../src';
import dotenv from 'dotenv';
import { expect } from 'chai';

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
          expect(err).to.be.ok;
        });
    });
  });
});
