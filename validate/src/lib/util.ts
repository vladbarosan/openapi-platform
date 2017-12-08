
const applicationinsights = require('applicationinsights');
import * as debug from 'debug';

applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();

applicationinsights.defaultClient.context.tags["ai.cloud.role"] = "validate";
export let AppInsightsClient = applicationinsights.defaultClient;
export const DebugLogger: debug.IDebugger = debug(`Validate`);
