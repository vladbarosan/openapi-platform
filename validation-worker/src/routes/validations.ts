import { Router, Request, Response, NextFunction } from 'express';
import * as cluster from 'cluster';
import ValidationModel from '../lib/validationModel';
import * as debug from 'debug';
import * as redis from 'redis';
import { RedisClient } from 'redis';
import * as onDeath from 'death';

let router = Router();
const maxConcurrentValidations = 50;
const debugLogger: debug.IDebugger = debug(`Worker:1`);


let validationModels: Map<string, ValidationModel> = new Map();

const redisAllRequestsChannel = process.env['REDIS_CHANNEL'] || "allValidationRequests";
const redisClient = redis.createClient({
  host: process.env['REDIS_HOST'] || "127.0.0.1",
  port: parseInt(process.env['REDIS_PORT']) || 6379,
});


redisClient.on("message", (channel, message) => {
  let requestResponsePair: any = JSON.parse(message);

  if (requestResponsePair === undefined) {
    return;
  }

  validationModels.forEach((model, id, map) => {
    model.validate(requestResponsePair);
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

  if (modelOptions.repoUrl === undefined || modelOptions.repoUrl === null) {
    res.status(400).send({ error: 'Repo Url is not set in the request.' });
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

  debugLogger("pre creation");

  let model: ValidationModel = new ValidationModel(modelOptions.resourceProvider, modelOptions.apiVersion, liveValidatorOptions);
  debugLogger("pre initialize");
  await model.initialize();
  debugLogger("done initialize");
  validationModels.set(model.validationId, model);

  setTimeout(() => {
    validationModels.delete(model.validationId);
  }, durationInSeconds * 1000);

  res.status(200).send({ validationId: model.validationId });
});

export default router;
