import * as express from "express";
import * as path from 'path';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as os from 'os';

import Boot from './routes/index';
import { Router } from "express";

class App {
  public express: express.Application;
  constructor() {
    this.express = express();
    this.middleware();
  }

  public async Bootstrap(): Promise<void> {
    let router: Router = await Boot();
    this.routes(router);
    return Promise.resolve();
  }

  private middleware(): void {
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
  private routes(Router: Router): void {

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

export default new App();