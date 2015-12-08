import _ from 'lodash';
import { expect } from 'chai';
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

// Exposing stuff that are usefull in the tests
if (typeof window !== 'undefined') {
  global = window;
}

global._ = _;
global.CRAFT_CFG = CRAFT_CFG;
global.expect = expect;
