require('./helper');

require('../test_addAgentContextOperations');
require('../test_createAgent');
require('../test_errors');

if (window.initMochaPhantomJS) {
  window.initMochaPhantomJS();
}
