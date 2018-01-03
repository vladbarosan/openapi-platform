import * as uuidv4 from 'uuid/v4';
import * as path from 'path';
import * as os from 'os';
import * as debug from 'debug';
import * as fs from 'fs-extra';
import * as url from 'url';
import { AppInsightsClient, DebugLogger } from '../lib/util';
import ValidationResult, { OperationValidationResult } from './validationResult';
import validationResult from './validationResult';
const oav: any = require('oav');

/**
 * @class
 * Model against whcih to validate openapi operations.
 */
class ValidationModel {

    validator: any;
    resourceProvider: string;
    apiVersion: string;
    validationId: string;
    directory: string;
    validationResult: ValidationResult;
    /**
     *
     * @param {string} resourceProvider The resource provider for whose operations to validate.
     * @param {string} apiVersion The API Version for the the resource provider's operations that are to be validated.
     * @param {object} validatorOptions Configuration options for the OAV Live Validator
     */
    constructor(resourceProvider: string, apiVersion: string, validatorOptions: any) {
        this.validationId = uuidv4();
        this.apiVersion = apiVersion;
        this.resourceProvider = resourceProvider;
        this.directory = path.resolve(os.homedir(), `repo-${this.validationId}`);
        this.validationResult = new ValidationResult(this.resourceProvider, this.apiVersion, this.validationId, validatorOptions.git.url, validatorOptions.git.branch);
        validatorOptions.directory = this.directory;
        this.validator = new oav.LiveValidator(validatorOptions);
    }

    /**
     * Validates a specifc Request-Response Pair (Operation).
     * @param {object} requestResponsePair An object representing an api call request and its response.
     */
    validate(requestResponsePair: any): any {
        const validationResult: any = this.validator.validateLiveRequestResponse(requestResponsePair);
        this.updateStats(validationResult, requestResponsePair);
        return validationResult;
    }

    /**
     * Initializes and starts the worker to perform validations.
     */
    async initialize(): Promise<void> {
        await this.validator.initialize();
        fs.removeSync(this.directory);
        return Promise.resolve();
    }

    updateStats(result: any, requestResponsePair: any): void {
        let operationId = "OPERATION_NOT_FOUND"
        let parsedUrl = url.parse(requestResponsePair.liveRequest.url, true);
        let operationPath = parsedUrl.pathname;

        if (result.requestValidationResult.operationInfo
            && Array.isArray(result.requestValidationResult.operationInfo)
            && result.requestValidationResult.operationInfo.length) {
            operationId = result.requestValidationResult.operationInfo[0].operationId;
        }

        if (!this.validationResult.operationResults.has(operationId)) {
            this.validationResult.operationResults.set(operationId, new OperationValidationResult(operationId));
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

        AppInsightsClient.trackTrace({
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

export default ValidationModel;