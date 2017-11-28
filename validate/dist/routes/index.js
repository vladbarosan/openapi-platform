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
const path = require("path");
const os = require("os");
const debug = require("debug");
const oav = require('oav');
const debugLogger = debug(`Worker3`);
let router = express_1.Router();
const liveValidatorOptions = {
    git: {
        shouldClone: false,
        url: 'https://github.com/vladbarosan/sample-openapi-specs'
    },
    directory: path.resolve(os.homedir(), `repo`)
};
const apiValidator = new oav.LiveValidator(liveValidatorOptions);
const ErrorCodes = oav.Constants.ErrorCodes;
function Bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        yield apiValidator.initialize();
        /* GET home page. */
        router.get('/', function (req, res, next) {
            res.render('index', { title: 'OpenAPI Validate' });
        });
        /* POST validate endpoint. */
        router.post('/validate', function (req, res, next) {
            let validationResult = apiValidator.validateLiveRequestResponse(req.body);
            // Something went wrong
            if (validationResult && validationResult.errors && Array.isArray(validationResult.errors) && validationResult.errors.length) {
                let errors = validationResult.errors;
                let is400 = errors.some((error) => { return error.code === ErrorCodes.IncorrectInput; });
                if (is400) {
                    // Return 400 with validationResult
                    res.status(400).send(validationResult);
                }
            }
            // Return 200 with validationResult
            res.status(200).send(validationResult);
        });
        return router;
    });
}
exports.default = Bootstrap;
