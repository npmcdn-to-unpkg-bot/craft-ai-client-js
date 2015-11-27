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

describe('craftai', () => {
  describe('(<config>)', () => {
    it('should create an instance with valid APP_ID/APP_SECRET', () => {
      return craftai(CRAFT_CFG)
        .then(instance => {
          assert.notEqual(instance.instanceId , undefined);
          assert.equal(instance.getStatus() , STATUS.running);
          return instance.destroy()
            .then(() => {
              assert.equal(instance.getStatus() , STATUS.destroyed);
            });
        })
        .catch(err => {
          assert.fail(err, undefined);
        });
    });
    it('should fail with invalid APP_ID/APP_SECRET', () => {
      return craftai(_.extend(CRAFT_CFG, {
          appId: 'baaaah',
          appSecret: 'booooh'
        }))
        .catch(err => {
          assert.notEqual(err , undefined);
        });
    });
    it('should fail with missing project owner', () => {
      return craftai(_.extend(CRAFT_CFG, {
          owner: undefined
        }))
        .catch(err => {
          assert.notEqual(err , undefined);
        });
    });
    it('should fail with missing project name', () => {
      return craftai(_.extend(CRAFT_CFG, {
          name: undefined
        }))
        .catch(err => {
          assert.notEqual(err , undefined);
        });
    });
    it('should fail with missing project version', () => {
      return craftai(_.extend(CRAFT_CFG, {
          version: undefined
        }))
        .catch(err => {
          assert.notEqual(err , undefined);
        });
    });
  });
});
