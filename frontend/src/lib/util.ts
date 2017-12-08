
const applicationinsights = require('applicationinsights');
import * as debug from 'debug';

applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();

applicationinsights.defaultClient.context.tags["ai.cloud.role"] = "frontend";

export const AsyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

export const AppInsightsClient = applicationinsights.defaultClient;
export const DebugLogger: debug.IDebugger = debug(`Frontend`);
