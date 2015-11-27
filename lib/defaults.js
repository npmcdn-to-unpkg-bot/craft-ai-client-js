'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var DEFAULTS = {
  appId: process.env.CRAFT_APP_ID,
  appSecret: process.env.CRAFT_APP_SECRET,
  httpApiUrl: process.env.CRAFT_HTTP_API_URL || 'https://api.craft.ai/v1',
  wsApiUrl: process.env.CRAFT_WS_API_URL || 'wss://api.craft.ai/v1',
  hubApiUrl: process.env.CRAFT_HUB_API_URL || 'https://hub.craft.ai/v1'
};

exports.default = DEFAULTS;