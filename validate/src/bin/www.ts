#!/usr/bin/env node

/**
 * Module dependencies.
 */

import * as http from 'http';
import * as debug from 'debug';
import * as cluster from 'cluster';
import * as git from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const numCPUs = 1;
const debugLogger: debug.IDebugger = debug('Master');

setupRepo();
setupWorkers();

function setupRepo(): void {
  let specsRepo = 'https://github.com/vladbarosan/sample-openapi-specs';

  let workingDir = path.resolve(os.homedir(), `repo`);

  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir);
    git(workingDir).clone(specsRepo, workingDir, '--depth=1');
  }
}

function setupWorkers(): void {
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