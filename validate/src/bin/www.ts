#!/usr/bin/env node

/**
 * Module dependencies.
 */

import * as cluster from 'cluster';
import * as git from 'simple-git/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as schedule from 'node-schedule';
import { RecurrenceRule } from 'node-schedule';
import * as core from 'core-js/library';
import { AppInsightsClient, DebugLogger } from '../lib/util';

const numWorkers = parseInt(process.env['WORKERS']) || 1;
const refreshJob: schedule.Job = setupRefresh();

setupRepo().then(() => setupWorkers(numWorkers));

async function setupRepo(): Promise<any> {
  let specsRepo = 'https://github.com/Azure/azure-rest-api-specs';

  let workingDir = path.resolve(os.homedir(), `repo`);

  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir);
    let gitOptions = ['--depth=1'];
    await git(workingDir).clone(specsRepo, workingDir, gitOptions);
  } else {
    await git(workingDir).pull();
  }
  return Promise.resolve();
}

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

function setupRefresh(): schedule.Job {

  let refreshJob: schedule.Job = schedule.scheduleJob({ hour: 15, minute: 44 }, async () => {
    await setupRepo();
    for (const [workerId, worker] of core.Object.entries(cluster.workers)) {
      worker.kill();
    }
  });

  return refreshJob;
}