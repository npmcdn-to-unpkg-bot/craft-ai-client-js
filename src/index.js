import * as errors from './errors';
import createClient from './client';
import decide from './decide';
import DEFAULT from './defaults';
import Time from './time';

export default createClient;

export {
  createClient,
  decide,
  DEFAULT,
  errors,
  Time
};
