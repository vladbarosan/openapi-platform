import { Router, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as os from 'os';
import * as debug from 'debug';
import * as redis from 'redis';

const oav = require('oav');

const debugLogger: debug.IDebugger = debug(`Index`);

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
debugLogger(JSON.stringify(redisClient.config));
debugLogger(`This is the host: `);

async function Bootstrap(): Promise<Router> {
  await apiValidator.initialize();

  /* GET home page. */
  router.get('/', function (req, res, next) {
    res.render('index', { title: 'OpenAPI Validate' });
  });

  /* POST validate endpoint. */
  router.post('/validate', function (req, res, next) {

    redisClient.publish(redisAllRequestsChannel, JSON.stringify(req.body));
    let validationResult = apiValidator.validateLiveRequestResponse(req.body);

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

  return router;
}

export default Bootstrap;