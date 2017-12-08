#!/usr/bin/env node

/**
 * Module dependencies.
 */

import * as http from 'http';
import * as cluster from 'cluster';
import { AppInsightsClient, DebugLogger } from '../lib/util';

/**
 * Get port from environment and store in Express.
 */

const numWorkers: number = parseInt(process.env['WORKERS']) || 1;

setupWorkers(numWorkers);

function setupWorkers(numWorkers: number): void {
  cluster.setupMaster({
    exec: 'dist/lib/worker.js',
    silent: false
  });

  // Check that workers are online
  cluster.on('online', (worker) => {
    DebugLogger(`The worker ${worker.id} responded after it was forked`);
  });

  cluster.on('exit', (worker, code, signal) => {
    DebugLogger(`worker ${worker.process.pid} died`);
    cluster.fork();
  });

  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
}