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
let router = express_1.Router();
const maxConcurrentValidations = 50;
let validationModels = new Map();
const redisAllRequestsChannel = process.env['REDIS_CHANNEL'] || "allValidationRequests";
const redisClient = redis.createClient({
    host: process.env['REDIS_HOST'] || "127.0.0.1",
    port: parseInt(process.env['REDIS_PORT']) || 6379,
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
        util_1.AppInsightsClient.trackTrace({
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
router.post('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
    let model = new validationModel_1.default(modelOptions.resourceProvider, modelOptions.apiVersion, liveValidatorOptions);
    yield model.initialize();
    util_1.DebugLogger("initialize finished successfully.");
    validationModels.set(model.validationId, model);
    setTimeout(() => {
        validationModels.delete(model.validationId);
        util_1.AppInsightsClient.trackTrace(`Validation model ${model.validationId} is being deleted.`, 4, { "logType": "diagnostics" });
    }, durationInSeconds * 1000);
    res.status(200).send({ validationId: model.validationId });
}));
exports.default = router;
