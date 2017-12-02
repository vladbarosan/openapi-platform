
const applicationinsights = require('applicationinsights');

applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();

applicationinsights.defaultClient.context.tags["ai.cloud.role"] = "validate";
export let AppInsightsClient = applicationinsights.defaultClient;
