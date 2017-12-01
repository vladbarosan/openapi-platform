#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const cluster = require("cluster");
/**
 * Get port from environment and store in Express.
 */
const numWorkers = parseInt(process.env['WORKERS']) || 1;
const debugLogger = debug('Master');
setupWorkers(numWorkers);
function setupWorkers(numWorkers) {
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
