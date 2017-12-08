import * as uuidv4 from 'uuid/v4';
import * as path from 'path';
import * as os from 'os';
import * as debug from "debug"
import * as fs from 'fs-extra';
import { AppInsightsClient, DebugLogger } from '../lib/util';
const oav = require('oav');

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
        validatorOptions.directory = this.directory;
        this.validator = new oav.LiveValidator(validatorOptions);
    }

    /**
     * Validates a specifc Request-Response Pair (Operation).
     * @param {object} requestResponsePair An object representing an api call request and its response.
     */
    validate(requestResponsePair: any): any {
        const validationResult = this.validator.validateLiveRequestResponse(requestResponsePair);
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
}

export default ValidationModel;