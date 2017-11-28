import { Router, Request, Response, NextFunction } from 'express';

var router = Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'OpenAPI Frontend' });
});

export default router;
