"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applicationinsights = require('applicationinsights');
const debug = require("debug");
applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();
applicationinsights.defaultClient.context.tags["ai.cloud.role"] = "validate";
exports.AppInsightsClient = applicationinsights.defaultClient;
exports.DebugLogger = debug(`Validate`);
