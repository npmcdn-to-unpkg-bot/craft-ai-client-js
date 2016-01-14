import _ from 'lodash';
import * as errors from './errors';
import Debug from 'debug';
import fetch from 'isomorphic-fetch';

let debug = Debug('craft-ai:client');

export default function request(req, cfg) {
  req = _.defaults(req || {}, {
    method: 'GET',
    path: '',
    body: undefined,
    headers: {}
  });

  let params = 'delete_logs=' + cfg.deleteLogsOnDestroy;
  req.url = cfg.httpApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version + req.path + '?' + params;
  req.headers['X-Craft-Ai-App-Id'] = cfg.appId;
  req.headers['X-Craft-Ai-App-Secret'] = cfg.appSecret;
  req.headers['Content-Type'] = 'application/json; charset=utf-8';
  req.headers['Accept'] = 'application/json';

  req.body = req.body && JSON.stringify(req.body);

  return fetch(req.url, req)
    .catch(err => Promise.reject(new errors.CraftAiNetworkError({
      more: err.message
    })))
    .then(res => res.text()
      .catch(err => {
        debug(`Invalid response from ${req.method} ${req.path}`, err);
        return Promise.reject(new errors.CraftAiInternalError(
          'Internal Error, the craft ai server responded an invalid response, see err.more for details.', {
            request: req,
            more: err.message
          }
        ));
      })
      .then(body => {
        try {
          return JSON.parse(body);
        }
        catch (err) {
          debug(`Invalid json response from ${req.method} ${req.path}: ${body}`, err);
          return Promise.reject(new errors.CraftAiInternalError(
            'Internal Error, the craft ai server responded an invalid json document.', {
              request: req
            }
          ));
        }
      })
      .then(parsedBody => {
        switch (res.status) {
          case 200:
            return parsedBody;
          case 401:
          case 403:
            return Promise.reject(new errors.CraftAiCredentialsError({
              more: parsedBody.message,
              request: req
            }));
          case 404:
            return Promise.reject(new errors.CraftAiBadRequestError({
              more: parsedBody.message,
              request: req
            }));
          case 500:
            return Promise.reject(new errors.CraftAiInternalError(parsedBody.message, {
              request: req
            }));
          default:
            return Promise.reject(new errors.CraftAiUnknownError({
              more: parsedBody.message,
              request: req,
              status: res.status
            }));
        }
      })
  );
}
