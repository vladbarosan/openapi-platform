import { Router, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as os from 'os';
import * as debug from 'debug';

const oav = require('oav');

const debugLogger: debug.IDebugger = debug(`Worker3`);

let router = Router();

const liveValidatorOptions = {
  git: {
    shouldClone: false,
    url: 'https://github.com/vladbarosan/sample-openapi-specs'
  },
  directory: path.resolve(os.homedir(), `repo`)
};

const apiValidator = new oav.LiveValidator(liveValidatorOptions);
const ErrorCodes = oav.Constants.ErrorCodes;


async function Bootstrap(): Promise<Router> {
  await apiValidator.initialize();

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
}

export default Bootstrap;