#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require("cluster");
const git = require("simple-git/promise");
const fs = require("fs");
const path = require("path");
const os = require("os");
const schedule = require("node-schedule");
const core = require("core-js/library");
const util_1 = require("../lib/util");
const numWorkers = parseInt(process.env['WORKERS']) || 1;
const refreshJob = setupRefresh();
setupRepo().then(() => setupWorkers(numWorkers));
async function setupRepo() {
    let specsRepo = 'https://github.com/vladbarosan/sample-openapi-specs';
    let workingDir = path.resolve(os.homedir(), `repo`);
    if (!fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir);
        let gitOptions = ['--depth=1'];
        await git(workingDir).clone(specsRepo, workingDir, gitOptions);
    }
    else {
        await git(workingDir).pull();
    }
    return Promise.resolve();
}
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
function setupRefresh() {
    let refreshJob = schedule.scheduleJob({ hour: 15, minute: 44 }, async () => {
        await setupRepo();
        for (const [workerId, worker] of core.Object.entries(cluster.workers)) {
            worker.kill();
        }
    });
    return refreshJob;
}
