import { Router, Request, Response, NextFunction } from 'express';
import * as cluster from 'cluster';
import ValidationModel from '../lib/validationModel';
import * as redis from 'redis';
import * as onDeath from 'death';
import { AppInsightsClient, DebugLogger } from '../lib/util';
import * as util from '../lib/util';
import * as url from 'url';
import { MongoClient, Db, Collection, MongoClientOptions, FindOneOptions } from 'mongodb';
import { RedisClient } from 'redis';

let router: Router = Router();
const maxConcurrentValidations: number = 50;
const validationsCollectionName: string = 'validationResults';

let validationModels: Map<string, ValidationModel> = new Map();

const redisAllRequestsChannel: string = process.env['REDIS_CHANNEL'] || 'allValidationRequests';
const redisClient: RedisClient = redis.createClient({
  host: process.env['REDIS_HOST'] || "127.0.0.1",
  port: parseInt(process.env['REDIS_PORT']) || 6379,
});

let dbConn: Db;
let connectionOptions: MongoClientOptions = {};
connectionOptions.native_parser = true;
MongoClient.connect(process.env['DB_CONNECTION_STRING'], connectionOptions).then(db => {
  dbConn = db;
});

redisClient.on("message", (channel, message) => {
  let requestResponsePair: any = JSON.parse(message);

  DebugLogger(`Processing message ${message}`)

  if (requestResponsePair === undefined) {
    return;
  }

  let parsedUrl: url.Url = url.parse(requestResponsePair.liveRequest.url, true);
  let path: string = parsedUrl.pathname;

  let apiVersion = parsedUrl.query['api-version'];
  let resourceProvider = util.getProvider(path);

  validationModels.forEach((model, id, map) => {
    DebugLogger(`Processing model with id: ${id}`);

    if (model.resourceProvider != resourceProvider && model.apiVersion != apiVersion) {
      return;
    }

    model.validate(requestResponsePair);
  });
});

onDeath((signal, err) => {
  redisClient.unsubscribe();
  redisClient.quit();
});

redisClient.subscribe(redisAllRequestsChannel);

/* GET validations listing. */
router.get('/:validationId', util.AsyncMiddleware(async (req, res, next) => {
  let validationId: string = req.params.validationId;
  let findOptions: FindOneOptions = {};
  findOptions.returnKey = false;
  findOptions.fields = { '_id': 0 };
  let validationResult: any = await dbConn.collection(validationsCollectionName).findOne({ validationId: validationId }, findOptions);
  if (validationResult == null) {
    res.status(404).send({ error: 'No validation results exists for the specified validation Id. Please retry later.' });
  } else {
    res.status(200).send(validationResult);
  }
}));

router.post('/', util.AsyncMiddleware(async (req, res, next) => {

  if (validationModels.size >= maxConcurrentValidations) {
    res.status(429).send({ error: 'More live validations are running then the service currently supports. Try again later.' });
  }

  let modelOptions: any = req.body;
  let durationInSeconds: number = parseInt(modelOptions.duration);


  if (isNaN(durationInSeconds) || durationInSeconds > 60 * 60) {
    res.status(400).send({ error: 'Duration is not a number or it is longer than maximum allowed value of 60 minutes.' });
  }

  if (modelOptions.repoUrl === undefined || modelOptions.repoUrl === null || !modelOptions.repoUrl.startsWith("https://github.com")) {
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

  const validationJsonsPattern: string = `/specification/**/${modelOptions.resourceProvider}/${modelOptions.apiVersion}/**/*.json`;

  const liveValidatorOptions: any = {
    git: {
      shouldClone: true,
      url: modelOptions.repoUrl,
      branch: modelOptions.branch
    },
    swaggerPathsPattern: validationJsonsPattern,
  };


  let model: ValidationModel = new ValidationModel(modelOptions.resourceProvider, modelOptions.apiVersion, liveValidatorOptions);
  await model.initialize();
  DebugLogger("initialize finished successfully.");
  validationModels.set(model.validationId, model);

  setTimeout(() => {
    DebugLogger(`Saving validation result for ${model.validationId} and removing it from traffic.`);
    dbConn.collection(validationsCollectionName).insertOne(model.validationResult);
    validationModels.delete(model.validationId);

    AppInsightsClient.trackTrace({
      message: `Validation model ${model.validationId} is being deleted.`,
      severity: 4,
      properties: { 'logType': 'diagnostics' }
    });
  }, durationInSeconds * 1000);

  res.status(200).send({ validationId: model.validationId });
}));

export default router;
