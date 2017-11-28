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
const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const index_1 = require("./routes/index");
class App {
    constructor() {
        this.express = express();
        this.middleware();
    }
    Bootstrap() {
        return __awaiter(this, void 0, void 0, function* () {
            let router = yield index_1.default();
            this.routes(router);
            return Promise.resolve();
        });
    }
    middleware() {
        // view engine setup
        this.express.set('views', path.join(__dirname, '../views'));
        this.express.set('view engine', 'pug');
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(cookieParser());
        this.express.use(express.static(path.join(__dirname, '../public')));
    }
    // Configure API endpoints.
    routes(Router) {
        this.express.use('/', Router);
        // catch 404 and forward to error handler
        this.express.use((req, res, next) => {
            var err = new Error('Not Found');
            res.statusCode = 404;
            next(err);
        });
        // error handler
        this.express.use((err, req, res, next) => {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });
    }
}
exports.default = new App();
