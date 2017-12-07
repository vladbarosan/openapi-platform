
const applicationinsights = require('applicationinsights');

applicationinsights.setup()
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .start();

applicationinsights.defaultClient.context.tags["ai.cloud.role"] = "validationworker";

/**
/*
 * Gets provider namespace from the given path. In case of multiple, last one will be returned.
 * @param {string} path The path of the operation.
 *                 Example "/subscriptions/{subscriptionId}/resourcegroups/{resourceGroupName}/providers/{resourceProviderNamespace}/
 *                 {parentResourcePath}/{resourceType}/{resourceName}/providers/Microsoft.Authorization/roleAssignments"
 *                 will return "Microsoft.Authorization".
 *
 * @returns {string} result - provider namespace from the given path.
 */
export function getProvider(path: string): string {
    if (path.trim().length == 0) {
        throw new Error('path cannot be an empty string.');
    }

    let providerRegEx: RegExp = new RegExp('/providers/(\:?[^{/]+)', 'gi');
    let pathMatch: RegExpExecArray;
    let result: string;

    // Loop over the paths to find the last matched provider namespace
    while ((pathMatch = providerRegEx.exec(path)) != null) {
        result = pathMatch[0];
    }

    return result;
};

export let AppInsightsClient = applicationinsights.defaultClient;
