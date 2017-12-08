#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require("cluster");
const util_1 = require("../lib/util");
/**
 * Get port from environment and store in Express.
 */
const numWorkers = parseInt(process.env['WORKERS']) || 1;
setupWorkers(numWorkers);
function setupWorkers(numWorkers) {
    cluster.setupMaster({
        exec: 'dist/lib/worker.js',
        silent: false
    });
    // Check that workers are online
    cluster.on('online', (worker) => {
        util_1.DebugLogger(`The worker ${worker.id} responded after it was forked`);
    });
    cluster.on('exit', (worker, code, signal) => {
        util_1.DebugLogger(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
    for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
}
