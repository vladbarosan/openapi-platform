"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
var router = express_1.Router();
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Azure Devex Tools Frontend' });
});
exports.default = router;
