require('./helper');

require('../test_addAgentContextOperations');
require('../test_computeAgentDecision');
require('../test_createAgent');
require('../test_errors');
require('../test_getAgent');
require('../test_getAgentInspectorUrl');

if (window.initMochaPhantomJS) {
  window.initMochaPhantomJS();
}
