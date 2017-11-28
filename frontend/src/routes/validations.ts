import { Router, Request, Response, NextFunction } from 'express';

var router = Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a validation resource');
});

export default router;
