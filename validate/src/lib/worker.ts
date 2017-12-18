import * as http from 'http';
import * as https from 'https';
import * as cluster from 'cluster';
import * as fs from 'fs';
import App from '../app';
import { AppInsightsClient, DebugLogger } from '../lib/util'

/**
 * Get port from environment and store in Express.
 */
let port = normalizePort(process.env.PORT || '5002');

App.express.set('port', port);
/**
 * Create HTTP server.
 */

let key = fs.readFileSync('/run/secrets/cert_ssl.key');
let cert = fs.readFileSync('/run/secrets/cert_sslcrt.pem');

let options = {
    key: key,
    cert: cert,
};
let server = https.createServer(options, App.express);

/**
 * Listen on provided port, on all network interfaces.
 */
App.Bootstrap().then(() => {
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
});

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: number | string): number | string | boolean {
    let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;

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
function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            DebugLogger(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            DebugLogger(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(): void {
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    DebugLogger('Listening on ' + bind);
}
