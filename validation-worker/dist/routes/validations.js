"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validationModel_1 = require("../lib/validationModel");
const redis = require("redis");
const onDeath = require("death");
const util_1 = require("../lib/util");
const util = require("../lib/util");
const url = require("url");
const mongodb_1 = require("mongodb");
let router = express_1.Router();
const maxConcurrentValidations = 50;
const validationsCollectionName = 'validationResults';
let validationModels = new Map();
const redisAllRequestsChannel = process.env['REDIS_CHANNEL'] || 'allValidationRequests';
const redisClient = redis.createClient({
    host: process.env['REDIS_HOST'] || "127.0.0.1",
    port: parseInt(process.env['REDIS_PORT']) || 6379,
});
let dbConn;
let connectionOptions = {};
connectionOptions.native_parser = true;
mongodb_1.MongoClient.connect(process.env['DB_CONNECTION_STRING'], connectionOptions).then(db => {
    dbConn = db;
});
redisClient.on("message", (channel, message) => {
    let requestResponsePair = JSON.parse(message);
    util_1.DebugLogger(`Processing message ${message}`);
    if (requestResponsePair === undefined) {
        return;
    }
    let parsedUrl = url.parse(requestResponsePair.liveRequest.url, true);
    let path = parsedUrl.pathname;
    let apiVersion = parsedUrl.query['api-version'];
    let resourceProvider = util.getProvider(path);
    validationModels.forEach((model, id, map) => {
        util_1.DebugLogger(`Processing model with id: ${id}`);
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
router.get('/:validationId', util.AsyncMiddleware((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let validationId = req.params.validationId;
    let findOptions = {};
    findOptions.returnKey = false;
    findOptions.fields = { '_id': 0 };
    let validationResult = yield dbConn.collection(validationsCollectionName).findOne({ validationId: validationId }, findOptions);
    if (validationResult == null) {
        res.status(404).send({ error: 'No validation results exists for the specified validation Id. Please retry later.' });
    }
    else {
        res.status(200).send(validationResult);
    }
})));
router.post('/', util.AsyncMiddleware((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    if (validationModels.size >= maxConcurrentValidations) {
        res.status(429).send({ error: 'More live validations are running then the service currently supports. Try again later.' });
    }
    let modelOptions = req.body;
    let durationInSeconds = parseInt(modelOptions.duration);
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
    const validationJsonsPattern = `/specification/**/${modelOptions.resourceProvider}/${modelOptions.apiVersion}/**/*.json`;
    const liveValidatorOptions = {
        git: {
            shouldClone: true,
            url: modelOptions.repoUrl,
            branch: modelOptions.branch
        },
        swaggerPathsPattern: validationJsonsPattern,
    };
    let model = new validationModel_1.default(modelOptions.resourceProvider, modelOptions.apiVersion, liveValidatorOptions);
    yield model.initialize();
    util_1.DebugLogger("initialize finished successfully.");
    validationModels.set(model.validationId, model);
    setTimeout(() => {
        dbConn.collection(validationsCollectionName).insertOne(model.validationResult);
        validationModels.delete(model.validationId);
        util_1.AppInsightsClient.trackTrace(`Validation model ${model.validationId} is being deleted.`, 4, { "logType": "diagnostics" });
    }, durationInSeconds * 1000);
    res.status(200).send({ validationId: model.validationId });
})));
exports.default = router;
