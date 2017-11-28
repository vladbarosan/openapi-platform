#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const cluster = require("cluster");
const git = require("simple-git");
const fs = require("fs");
const path = require("path");
const os = require("os");
const numCPUs = 1;
const debugLogger = debug('Master');
setupRepo();
setupWorkers();
function setupRepo() {
    let specsRepo = 'https://github.com/vladbarosan/sample-openapi-specs';
    let workingDir = path.resolve(os.homedir(), `repo`);
    if (!fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir);
        git(workingDir).clone(specsRepo, workingDir, '--depth=1');
    }
}
function setupWorkers() {
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
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
}
