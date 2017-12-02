"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applicationinsights = require('applicationinsights');
applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();
applicationinsights.defaultClient.context.tags["ai.cloud.role"] = "frontend";
exports.AppInsightsClient = applicationinsights.defaultClient;
