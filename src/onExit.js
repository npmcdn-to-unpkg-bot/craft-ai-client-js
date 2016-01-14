import _ from 'lodash';

const IN_BROWSER = typeof window !== 'undefined';

function onWindowCloses(cb) {
  const listener = () => {
    cb();
  };
  window.addEventListener('beforeunload', listener);
  return () => window.removeEventListener(listener);
}

const NODE_PROCESS_EVENT = [
  'exit',
  'unhandledRejection',
  'uncaughtException',
  'SIGINT',
  'SIGTERM',
  'SIGQUIT',
  'SIGHUP'
];

function onProcessQuits(cb) {
  const listener = () => {
    cb();
  };
  _.map(NODE_PROCESS_EVENT, evt => process.on(evt, listener));
  return () => _.map(NODE_PROCESS_EVENT, evt => process.removeListener(evt, listener));
}

let onExit = IN_BROWSER ? onWindowCloses : onProcessQuits;

export default onExit;
