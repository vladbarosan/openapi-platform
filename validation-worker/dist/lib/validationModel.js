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
class ValidationModel {
    constructor(resourceProvider, apiVersion, validatorOptions) {
        this.validationId = uuidv4();
        this.directory = path.resolve(os.homedir(), `repo-${this.validationId}`);
        validatorOptions.directory = this.directory;
        this.validator = new oav.LiveValidator(validatorOptions);
    }
    validate(requestResponsePair) {
        const validationResult = this.validator.validateLiveRequestResponse(requestResponsePair);
        return validationResult;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validator.initialize();
            fs.removeSync(this.directory);
            return Promise.resolve();
        });
    }
}
exports.default = ValidationModel;
