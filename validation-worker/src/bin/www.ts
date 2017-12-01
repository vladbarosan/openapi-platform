#!/usr/bin/env node

/**
 * Module dependencies.
 */

import * as http from 'http';
import * as debug from 'debug';
import * as cluster from 'cluster';

/**
 * Get port from environment and store in Express.
 */

const numWorkers: number = parseInt(process.env['WORKERS']) || 1;
const debugLogger: debug.IDebugger = debug('Master');

setupWorkers(numWorkers);

function setupWorkers(numWorkers: number): void {
  cluster.setupMaster({
    exec: 'dist\\lib\\worker.js',
    silent: false
  });

  // Check that workers are online
  cluster.on('online', (worker) => {
    debugLogger(`The worker ${worker.id} responded after it was forked`);
  });

  cluster.on('exit', (worker, code, signal) => {
    debugLogger(`worker ${worker.process.pid} died`);
    cluster.fork();
  });

  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
}