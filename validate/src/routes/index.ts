import { Router, Request, Response, NextFunction } from 'express';

var router = Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'OpenAPI Validate' });
});

/* POST validate endpoint. */
router.post('/validate', function (req, res, next) {
  res.status(200).send({
    validated: true
  });
});

export default router;
