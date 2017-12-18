import { Router, Request, Response, NextFunction } from 'express';

var router = Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Azure Devex Tools Frontend' });
});

export default router;
