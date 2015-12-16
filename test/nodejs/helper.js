import _ from 'lodash';
import { expect } from 'chai';
import Debug from 'debug';
import dotenv from 'dotenv';

dotenv.load({silent: true});

const CRAFT_CFG = {
  owner: 'craft-ai',
  name: 'craft-ai-client-js',
  version: 'master',
  appId: process.env.CRAFT_APP_ID,
  appSecret: process.env.CRAFT_APP_SECRET
}

Debug.enable(process.env.DEBUG);

global._ = _;
global.CRAFT_CFG = CRAFT_CFG;
global.debug = Debug('craft-ai:client:test');
global.expect = expect;
global.IN_BROWSER = false;
