require('./helper');

require('../test_createInstance');
require('../test_createAgent');
require('../test_errors');
require('../test_getAgentKnowledge');
require('../test_update');
require('../test_getInstanceKnowledge');

if (window.initMochaPhantomJS) {
  window.initMochaPhantomJS();
}
