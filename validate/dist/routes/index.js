"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
var router = express_1.Router();
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
exports.default = router;
