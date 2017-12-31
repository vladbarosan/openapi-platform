/**
 * @class
 * Result of the a model validation.
 */
class ValidationResult {

    resourceProvider: string;
    apiVersion: string;
    validationId: string;
    operationId: string;
    repoUrl: string;
    repoBranch: string;
    totalOperationCount: number;
    totalSuccessCount: number;
    successRate: number;
    totalSuccessRequestCount: number;
    totalSuccessResponseCount: number;
    operationResults: Map<string, OperationValidationResult>;
    /**
     *
     * @param {string} resourceProvider The resource provider for whose operations to validate.
     * @param {string} apiVersion The API Version for the the resource provider's operations that are to be validated.
     * @param {string} validationId Configuration options for the OAV Live Validator.
     * @param {string} repoUrl The repo url from which the model was created.
     * @param {string} repoBranch The repo branch from whcih the model was created.
     */

    constructor(resourceProvider: string, apiVersion: string, validationId: string, repoUrl: string, repoBranch: string) {
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
        this.operationResults = new Map<string, OperationValidationResult>();
    }
}

/**
 * Result of an operation validation.
 */
export class OperationValidationResult {

    operationId: string;
    operationCount: number;
    successCount: number;
    successRequestCount: number;
    successResponseCount: number;
    successRate: number;

    /**
     *
     * @param operationId The id of the operation against which the validations are done.
     */
    constructor(operationId: string) {
        this.operationId = operationId;
        this.operationCount = 0;
        this.successCount = 0;
        this.successRequestCount = 0;
        this.successResponseCount = 0;
        this.successRate = 0;
    }
}

export default ValidationResult;