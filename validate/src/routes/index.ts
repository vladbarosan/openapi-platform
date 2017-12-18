import { Router, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as os from 'os'
import * as redis from 'redis';
import * as url from 'url';
import * as util from '../lib/util';
import { AppInsightsClient, DebugLogger } from '../lib/util'
const oav = require('oav');

let router = Router();

const liveValidatorOptions = {
  git: {
    shouldClone: false,
    url: 'https://github.com/vladbarosan/sample-openapi-specs'
  },
  directory: path.resolve(os.homedir(), `repo`)
};

const apiValidator = new oav.LiveValidator(liveValidatorOptions);
const ErrorCodes = oav.Constants.ErrorCodes;
const redisAllRequestsChannel = process.env['REDIS_CHANNEL'] || "allValidationRequests";
const redisClient = redis.createClient({
  host: process.env['REDIS_HOST'] || "127.0.0.1",
  port: parseInt(process.env['REDIS_PORT']) || 6379,
});

async function Bootstrap(): Promise<Router> {
  await apiValidator.initialize();

  /* GET home page. */
  router.get('/', function (req, res, next) {
    res.render('index', { title: 'OpenAPI Validate' });
  });

  /* POST validate endpoint. */
  router.post('/validate', function (req, res, next) {

    redisClient.publish(redisAllRequestsChannel, JSON.stringify(req.body));

    let requestResponsePair: any = req.body;

    if (requestResponsePair === undefined) {
      return;
    }

    let parsedUrl = url.parse(requestResponsePair.liveRequest.url, true);
    let path = parsedUrl.pathname;

    let apiVersion = parsedUrl.query['api-version'];
    let resourceProvider = util.getProvider(path);
    let validationResult = apiValidator.validateLiveRequestResponse(req.body);

    const isOperationSuccessful = validationResult.requestValidationResult.successfulRequest
      && validationResult.responseValidationResult.successfulResponse;

    let SeverityLevel = isOperationSuccessful ? 4 : 3;
    let operationId = validationResult.requestValidationResult.operationInfo[0].operationId;

    AppInsightsClient.trackTrace({
      message: JSON.stringify(validationResult),
      severity: SeverityLevel,
      properties: {
        'validationId': 'ARM',
        'operationId': operationId,
        'isSuccess': isOperationSuccessful,
        'resourceProvider': resourceProvider,
        'apiVersion': apiVersion,
        'logType': 'data'
      }
    });

    // Something went wrong
    if (validationResult && validationResult.errors && Array.isArray(validationResult.errors) && validationResult.errors.length) {
      let errors = validationResult.errors;
      let is400 = errors.some((error) => { return error.code === ErrorCodes.IncorrectInput; });
      if (is400) {
        // Return 400 with validationResult
        res.status(400).send(validationResult);
      }
    }

    // Return 200 with validationResult
    res.status(200).send(validationResult);
  });

  router.post('/validateProd', function (req, res, next) {
    res.status(403).send({ "Message": "Not available yet." })
  });

  return router;
}

export default Bootstrap;