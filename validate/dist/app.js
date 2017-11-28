"use strict";
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
    async Bootstrap() {
        let router = await index_1.default();
        this.routes(router);
        return Promise.resolve();
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
