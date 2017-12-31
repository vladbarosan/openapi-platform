"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applicationinsights = require('applicationinsights');
const debug = require("debug");
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
function getProvider(path) {
    if (path.trim().length == 0) {
        throw new Error('path cannot be an empty string.');
    }
    let providerRegEx = new RegExp('/providers/(\:?[^{/]+)', 'gi');
    let pathMatch;
    let result;
    // Loop over the paths to find the last matched provider namespace
    while ((pathMatch = providerRegEx.exec(path)) != null) {
        result = pathMatch[0];
    }
    return result.slice("/providers/".length);
}
exports.getProvider = getProvider;
;
exports.AppInsightsClient = applicationinsights.defaultClient;
exports.DebugLogger = debug(`ValidationWorker`);
