import { Router, Request, Response, NextFunction } from 'express';
import * as cluster from 'cluster';
import ValidationModel from '../lib/validationModel';
import * as redis from 'redis';
import * as onDeath from 'death';
import { AppInsightsClient, DebugLogger } from '../lib/util';
import * as util from '../lib/util';
import * as url from 'url';

let router = Router();
const maxConcurrentValidations = 50;

let validationModels: Map<string, ValidationModel> = new Map();

const redisAllRequestsChannel = process.env['REDIS_CHANNEL'] || "allValidationRequests";
const redisClient = redis.createClient({
  host: process.env['REDIS_HOST'] || "127.0.0.1",
  port: parseInt(process.env['REDIS_PORT']) || 6379,
});


redisClient.on("message", (channel, message) => {
  let requestResponsePair: any = JSON.parse(message);

  DebugLogger(`Processing message ${message}`)

  if (requestResponsePair === undefined) {
    return;
  }

  let parsedUrl = url.parse(requestResponsePair.liveRequest.url, true);
  let path = parsedUrl.pathname;

  let apiVersion = parsedUrl.query['api-version'];
  let resourceProvider = util.getProvider(path);

  validationModels.forEach((model, id, map) => {
    DebugLogger(`Processing model with id: ${id}`);

    if (model.resourceProvider != resourceProvider && model.apiVersion != apiVersion) {
      return;
    }

    let validationResult = model.validate(requestResponsePair);
    const isOperationSuccessful = validationResult.requestValidationResult.successfulRequest
      && validationResult.responseValidationResult.successfulResponse;

    let SeverityLevel = isOperationSuccessful ? 4 : 3;
    let operationId = validationResult.requestValidationResult.operationInfo[0].operationId;

    if (validationResult.requestValidationResult.operationInfo
      && Array.isArray(validationResult.requestValidationResult.operationInfo)
      && validationResult.requestValidationResult.operationInfo.length) {
      operationId = validationResult.requestValidationResult.operationInfo[0].operationId;
    }

    AppInsightsClient.trackTrace({
      message: JSON.stringify(validationResult),
      severity: SeverityLevel,
      properties: {
        'validationId': model.validationId,
        'operationId': operationId,
        'path': path,
        'isSuccess': isOperationSuccessful,
        "resourceProvider": model.resourceProvider,
        "apiVersion": model.apiVersion,
        "logType": "data"
      }
    });
  });
});

onDeath((signal, err) => {
  redisClient.unsubscribe();
  redisClient.quit();
});

redisClient.subscribe(redisAllRequestsChannel);

/* GET validations listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a validation resource');
});

router.post('/', async (req, res, next) => {

  if (validationModels.size >= maxConcurrentValidations) {
    res.status(429).send({ error: 'More live validations are running then the service currently supports. Try again later.' });
  }

  let modelOptions = req.body;
  let durationInSeconds = parseInt(modelOptions.duration);


  if (isNaN(durationInSeconds) || durationInSeconds > 60 * 60) {
    res.status(400).send({ error: 'Duration is not a number or it is longer than maximum allowed value of 60 minutes.' });
  }

  if (modelOptions.repoUrl === undefined || modelOptions.repoUrl === null || !modelOptions.repoUrl.StartsWith("https://github.com")) {
    res.status(400).send({ error: 'Repo Url is not set or is not a GitHub repo.' });
  }

  if (modelOptions.branch === undefined || modelOptions.branch === null) {
    res.status(400).send({ error: 'Repo branch is not set in the request.' });
  }

  if (modelOptions.resourceProvider === undefined && modelOptions.resourceProvider === null) {
    res.status(400).send({ error: 'Resource Provider is not set in the request.' });
  }

  if (modelOptions.apiVersion === undefined && modelOptions.apiVersion === null) {
    res.status(400).send({ error: 'Api Version is not set in the request.' });
  }

  const validationJsonsPattern = `/specification/**/${modelOptions.resourceProvider}/${modelOptions.apiVersion}/**/*.json`;

  const liveValidatorOptions = {
    git: {
      shouldClone: true,
      url: modelOptions.repoUrl
    },
    swaggerPathsPattern: validationJsonsPattern,
  };


  let model: ValidationModel = new ValidationModel(modelOptions.resourceProvider, modelOptions.apiVersion, liveValidatorOptions);
  await model.initialize();
  DebugLogger("initialize finished successfully.");
  validationModels.set(model.validationId, model);

  setTimeout(() => {
    validationModels.delete(model.validationId);
    AppInsightsClient.trackTrace(`Validation model ${model.validationId} is being deleted.`, 4, { "logType": "diagnostics" });
  }, durationInSeconds * 1000);

  res.status(200).send({ validationId: model.validationId });
});

export default router;
