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

describe('craftai', function() {
  describe('(<config>)', function() {
    it('should create an instance when using valid APP_ID/APP_SECRET', function() {
      this.timeout(5000);
      return craftai(CRAFT_CFG)
        .then(instance => {
          expect(instance.id).to.be.ok;
          expect(instance.getStatus()).to.be.equal(STATUS.running);
          expect(instance.cfg.owner).to.be.equal(CRAFT_CFG.owner);
          expect(instance.cfg.name).to.be.equal(CRAFT_CFG.name);
          expect(instance.cfg.version).to.be.equal(CRAFT_CFG.version);
          expect(instance.cfg.appId).to.be.equal(CRAFT_CFG.appId);
          expect(instance.cfg.appSecret).to.be.equal(CRAFT_CFG.appSecret);
          return instance.destroy()
            .then(() => {
              expect(instance.getStatus()).to.be.equal(STATUS.destroyed);
            });
        })
    });
    it('should fail when using invalid APP_ID/APP_SECRET', function() {
      return craftai(_.extend(CRAFT_CFG, {
          appId: 'baaaah',
          appSecret: 'booooh'
        }))
        .catch(err => {
          expect(err).to.be.ok;
        });
    });
    it('should fail when using missing project owner', function() {
      return craftai(_.extend(CRAFT_CFG, {
          owner: undefined
        }))
        .catch(err => {
          expect(err).to.be.ok;
        });
    });
    it('should fail when using missing project name', function() {
      return craftai(_.extend(CRAFT_CFG, {
          name: undefined
        }))
        .catch(err => {
          expect(err).to.be.ok;
        });
    });
    it('should fail when using missing project version', function() {
      return craftai(_.extend(CRAFT_CFG, {
          version: undefined
        }))
        .catch(err => {
          expect(err).to.be.ok;
        });
    });
  });
});
