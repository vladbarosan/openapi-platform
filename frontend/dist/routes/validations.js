"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
var router = express_1.Router();
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a validation resource');
});
exports.default = router;
