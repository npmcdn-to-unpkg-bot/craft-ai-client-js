import craftai, { errors, STATUS } from '../src';

describe('craftai(<config>)', function() {
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
    return craftai(_.extend(_.clone(CRAFT_CFG), {
        appId: 'baaaah',
        appSecret: 'booooh'
      }))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiCredentialsError);
      });
  });
  it('should fail when using a missing project owner', function() {
    return craftai(_.omit(_.clone(CRAFT_CFG), 'owner'))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using a missing project name', function() {
    return craftai(_.omit(_.clone(CRAFT_CFG), 'name'))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using a missing project version', function() {
    return craftai(_.omit(_.clone(CRAFT_CFG), 'version'))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using an invalid project owner', function() {
    return craftai(_.extend(_.clone(CRAFT_CFG), {
        owner: undefined
      }))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using an invalid project name', function() {
    return craftai(_.extend(_.clone(CRAFT_CFG), {
        name: undefined
      }))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using an invalid project version', function() {
    return craftai(_.extend(_.clone(CRAFT_CFG), {
        version: undefined
      }))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiBadRequestError);
      });
  });
  it('should fail when using invalid API root', function() {
    this.timeout(8000);
    return craftai(_.extend(_.clone(CRAFT_CFG), {
        httpApiUrl: 'https://foo.bar'
      }))
      .catch(err => {
        expect(err).to.be.an.instanceof(errors.CraftAiError);
        expect(err).to.be.an.instanceof(errors.CraftAiNetworkError);
      });
  });
});
