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
const RequestClient = require("request-promise-native");
const util_1 = require("../lib/util");
//const request = require('request-promise-native');
var router = express_1.Router();
var validationService = process.env["VALIDATION_WORKER_URI"] || 'http://localhost:5003';
/* GET users listing. */
router.get('/:validationId', util_1.AsyncMiddleware((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let validationId = req.params.validationId;
    let options = {};
    options.resolveWithFullResponse = true;
    let response = yield RequestClient.get(`${validationService}/api/validations/${validationId}`, options);
    if (response.statusCode != 200) {
        res.status(response.statusCode).send({ error: response.statusMessage });
    }
    else {
        res.status(200).send(JSON.parse(response.body));
    }
})));
router.post('/', util_1.AsyncMiddleware((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let options = {};
    options.form = req.body;
    options.resolveWithFullResponse = true;
    let response = yield RequestClient.post(`${validationService}/api/validations`, options);
    if (response.statusCode != 200) {
        res.status(response.statusCode).send({ error: response.statusMessage });
    }
    else {
        let validationId = JSON.parse(response.body).validationId;
        res.status(200).send({ validationId: validationId });
    }
})));
exports.default = router;
