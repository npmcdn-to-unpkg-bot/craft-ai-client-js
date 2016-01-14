import _ from 'lodash';
import * as errors from './errors';
import Debug from 'debug';
import fetch from 'isomorphic-fetch';
import syncRequest from 'sync-request';

let debug = Debug('craft-ai:client');

function parseResponse(req, resStatus, resBody) {
  let resBodyUtf8;
  try {
    resBodyUtf8 = resBody.toString('utf-8');
  }
  catch (err) {
    debug(`Invalid response format from ${req.method} ${req.path}: ${resBody}`, err);
    throw new errors.CraftAiInternalError(
      'Internal Error, the craft ai server responded in an invalid format.', {
        request: req
      }
    );
  }
  let resBodyJson;
  try {
    resBodyJson = JSON.parse(resBodyUtf8);
  }
  catch (err) {
    debug(`Invalid json response from ${req.method} ${req.path}: ${resBody}`, err);
    throw new errors.CraftAiInternalError(
      'Internal Error, the craft ai server responded an invalid json document.', {
        request: req
      }
    );
  }

  switch (resStatus) {
    case 200:
      return resBodyJson;
    case 401:
    case 403:
      throw new errors.CraftAiCredentialsError({
        more: resBodyJson.message,
        request: req
      });
    case 404:
      throw new errors.CraftAiBadRequestError({
        more: resBodyJson.message,
        request: req
      });
    case 500:
      throw new errors.CraftAiInternalError(resBodyJson.message, {
        request: req
      });
    default:
      throw new errors.CraftAiUnknownError({
        more: resBodyJson.message,
        request: req,
        status: resStatus
      });
  }
}

export default function request(req, cfg) {
  req = _.defaults(req || {}, {
    method: 'GET',
    path: '',
    body: undefined,
    asynchronous: true,
    headers: {}
  });

  req.url = cfg.httpApiUrl + '/' + cfg.owner + '/' + cfg.name + '/' + cfg.version + req.path;
  req.headers['X-Craft-Ai-App-Id'] = cfg.appId;
  req.headers['X-Craft-Ai-App-Secret'] = cfg.appSecret;
  req.headers['Content-Type'] = 'application/json; charset=utf-8';
  req.headers['Accept'] = 'application/json';

  req.body = req.body && JSON.stringify(req.body);

  if (req.asynchronous) {
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
        .then(resBody => parseResponse(req, res.status, resBody))
      );
  }
  else {
    let res = syncRequest(req.method, req.url, req);
    return parseResponse(req, res.statusCode, res.body);
  }
}
