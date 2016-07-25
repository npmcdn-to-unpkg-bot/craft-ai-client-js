import * as errors from './errors';
import createClient from './client';
import decide from './decide';
import DEFAULT from './defaults';
import Time from './time';

export default createClient;

createClient.decide = decide;
createClient.DEFAULT = DEFAULT;
createClient.errors = errors;
createClient.Time = Time;

export {
  createClient,
  decide,
  DEFAULT,
  errors,
  Time
};
