import decide, { Time } from 'craft-ai-interpreter';
import * as errors from './errors';
import createClient from './client';
import DEFAULT from './defaults';

export default createClient;

export {
  createClient,
  decide,
  DEFAULT,
  errors,
  Time
};
