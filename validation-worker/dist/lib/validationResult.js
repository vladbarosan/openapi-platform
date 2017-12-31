"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class
 * Result of the a model validation.
 */
class ValidationResult {
    /**
     *
     * @param {string} resourceProvider The resource provider for whose operations to validate.
     * @param {string} apiVersion The API Version for the the resource provider's operations that are to be validated.
     * @param {string} validationId Configuration options for the OAV Live Validator.
     * @param {string} repoUrl The repo url from which the model was created.
     * @param {string} repoBranch The repo branch from whcih the model was created.
     */
    constructor(resourceProvider, apiVersion, validationId, repoUrl, repoBranch) {
        this.resourceProvider = resourceProvider;
        this.apiVersion = apiVersion;
        this.validationId = validationId;
        this.repoUrl = repoUrl;
        this.repoBranch = repoBranch;
        this.totalOperationCount = 0;
        this.totalSuccessCount = 0;
        this.totalSuccessRequestCount = 0;
        this.totalSuccessResponseCount = 0;
        this.successRate = 0;
        this.operationResults = new Map();
    }
}
/**
 * Result of an operation validation.
 */
class OperationValidationResult {
    /**
     *
     * @param operationId The id of the operation against which the validations are done.
     */
    constructor(operationId) {
        this.operationId = operationId;
        this.operationCount = 0;
        this.successCount = 0;
        this.successRequestCount = 0;
        this.successResponseCount = 0;
        this.successRate = 0;
    }
}
exports.OperationValidationResult = OperationValidationResult;
exports.default = ValidationResult;
