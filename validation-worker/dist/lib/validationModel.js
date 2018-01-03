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
const uuidv4 = require("uuid/v4");
const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const url = require("url");
const util_1 = require("../lib/util");
const validationResult_1 = require("./validationResult");
const oav = require('oav');
/**
 * @class
 * Model against whcih to validate openapi operations.
 */
class ValidationModel {
    /**
     *
     * @param {string} resourceProvider The resource provider for whose operations to validate.
     * @param {string} apiVersion The API Version for the the resource provider's operations that are to be validated.
     * @param {object} validatorOptions Configuration options for the OAV Live Validator
     */
    constructor(resourceProvider, apiVersion, validatorOptions) {
        this.validationId = uuidv4();
        this.apiVersion = apiVersion;
        this.resourceProvider = resourceProvider;
        this.directory = path.resolve(os.homedir(), `repo-${this.validationId}`);
        this.validationResult = new validationResult_1.default(this.resourceProvider, this.apiVersion, this.validationId, validatorOptions.git.url, validatorOptions.git.branch);
        validatorOptions.directory = this.directory;
        this.validator = new oav.LiveValidator(validatorOptions);
    }
    /**
     * Validates a specifc Request-Response Pair (Operation).
     * @param {object} requestResponsePair An object representing an api call request and its response.
     */
    validate(requestResponsePair) {
        const validationResult = this.validator.validateLiveRequestResponse(requestResponsePair);
        this.updateStats(validationResult, requestResponsePair);
        return validationResult;
    }
    /**
     * Initializes and starts the worker to perform validations.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validator.initialize();
            fs.removeSync(this.directory);
            return Promise.resolve();
        });
    }
    updateStats(result, requestResponsePair) {
        let operationId = "OPERATION_NOT_FOUND";
        let parsedUrl = url.parse(requestResponsePair.liveRequest.url, true);
        let operationPath = parsedUrl.pathname;
        if (result.requestValidationResult.operationInfo
            && Array.isArray(result.requestValidationResult.operationInfo)
            && result.requestValidationResult.operationInfo.length) {
            operationId = result.requestValidationResult.operationInfo[0].operationId;
        }
        if (!this.validationResult.operationResults.has(operationId)) {
            this.validationResult.operationResults.set(operationId, new validationResult_1.OperationValidationResult(operationId));
        }
        const isOperationSuccessful = result.requestValidationResult.successfulRequest
            && result.responseValidationResult.successfulResponse;
        ++this.validationResult.totalOperationCount;
        ++this.validationResult.operationResults.get(operationId).operationCount;
        if (result.requestValidationResult.successfulRequest === true) {
            ++this.validationResult.totalSuccessRequestCount;
            ++this.validationResult.operationResults.get(operationId).successRequestCount;
        }
        if (result.responseValidationResult.successfulResponse === true) {
            ++this.validationResult.totalSuccessResponseCount;
            ++this.validationResult.operationResults.get(operationId).successResponseCount;
        }
        if (isOperationSuccessful) {
            ++this.validationResult.totalSuccessCount;
            ++this.validationResult.operationResults.get(operationId).successCount;
        }
        let severityLevel = isOperationSuccessful ? 4 : 3;
        util_1.AppInsightsClient.trackTrace({
            message: JSON.stringify(result),
            severity: severityLevel,
            properties: {
                'validationId': this.validationId,
                'operationId': operationId,
                'path': operationPath,
                'isSuccess': isOperationSuccessful,
                'resourceProvider': this.resourceProvider,
                'apiVersion': this.apiVersion,
                'logType': 'data'
            }
        });
    }
}
exports.default = ValidationModel;
