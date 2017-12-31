#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const https = require("https");
const fs = require("fs");
const util_1 = require("../lib/util");
const app_1 = require("../app");
/**
 * Get port from environment and store in Express.
 */
let port = normalizePort(process.env.PORT || '5001');
app_1.default.set('port', port);
/**
 * Create HTTP server.
 */
let server;
try {
    let key = fs.readFileSync('/run/secrets/cert_ssl.key');
    let cert = fs.readFileSync('/run/secrets/cert_sslcrt.pem');
    let options = {
        key: key,
        cert: cert,
    };
    server = https.createServer(options, app_1.default);
}
catch (_a) {
    server = http.createServer(app_1.default);
}
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    let port = (typeof val === 'string') ? parseInt(val, 10) : val;
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            util_1.DebugLogger(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            util_1.DebugLogger(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    util_1.DebugLogger(`Listening on ${bind}`);
}
