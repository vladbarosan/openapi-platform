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
const debug = require("debug");
const fs = require("fs-extra");
const oav = require('oav');
const debugLogger = debug(`Worker:ValidationModel`);
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
        this.directory = path.resolve(os.homedir(), `repo-${this.validationId}`);
        validatorOptions.directory = this.directory;
        this.validator = new oav.LiveValidator(validatorOptions);
    }
    /**
     * Validates a specifc Request-Response Pair (Operation).
     * @param {object} requestResponsePair An object representing an api call request and its response.
     */
    validate(requestResponsePair) {
        const validationResult = this.validator.validateLiveRequestResponse(requestResponsePair);
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
}
exports.default = ValidationModel;
