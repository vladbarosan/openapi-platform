"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applicationinsights = require('applicationinsights');
applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();
exports.AppInsightsClient = applicationinsights.defaultClient;
