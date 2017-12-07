import { Router, Request, Response, NextFunction } from 'express';
import { RequestPromiseOptions, FullResponse } from 'request-promise-native';
import * as RequestClient from 'request-promise-native';
import { error } from 'util';
import { AppInsightsClient, AsyncMiddleware } from '../lib/util'
//const request = require('request-promise-native');

var router = Router();
var validationService = process.env["VALIDATION_WORKER_URI"] || 'http://localhost:5003';
/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a validation resource');
});

router.post('/', AsyncMiddleware(async (req, res, next) => {
  let options: RequestPromiseOptions = {};
  options.form = req.body;
  options.resolveWithFullResponse = true;

  let response: FullResponse = await RequestClient.post(`${validationService}/api/validations`, options);

  if (response.statusCode != 200) {
    res.status(response.statusCode).send({ error: response.statusMessage });
  }

  let validationId = JSON.parse(response.body).validationId;
  res.status(200).send({ validationId: validationId });
}));

export default router;
