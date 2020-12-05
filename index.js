const express = require('express');
const log4js = require('log4js');
const cors = require('cors');
const log4jsConf = require('./config/log4js.json');
const getRoutes = require('./routes/index.js');
const db = require('./database/index.js');

const APP_PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 3000;

log4js.configure(log4jsConf);
const log = log4js.getLogger('app');

const errorMiddleware = (error, req, res, next) => {
    if (res.headersSent) {
        next(error)
    } else {
        log.error(error)
        res.status(500)
        res.json({
            message: error.message,
            // we only add a `stack` property in non-production environments
            ...(process.env.NODE_ENV === 'production' ? null : {stack: error.stack}),
        })
    }   
}

const setupExitHandler = (server) => {
    const exitHandler = async (options) => {
        log.warn(`Shutting down, reason: ${options.reason}`);

        // Stop webserver
        try {
            await server.close();
            log.info('Server stopped gracefully');
        } catch(e) {
            log.error('Error while stopping server', e);
        }

        // Stop database
        await db.close();

        if(options.reason !== 'exit') {
            process.exit();
        }
    }

    process.on('exit', exitHandler.bind(null, {reason: 'exit'}))
    // catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {reason: 'SIGINT'}));
    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, {reason: 'SIGUSR1'}))
    process.on('SIGUSR2', exitHandler.bind(null, {reason: 'SIGUSR2'}))
    // catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {reason: 'uncaughtException'}))
}


const startServer = async () => {
    const app = express();
    app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

    // When not running in production, allow all cors requests
    if(process.env.NODE_ENV !== 'production') {
        app.use(cors());
    }

    app.use(errorMiddleware);
    app.use('/api', getRoutes());

    const server = app.listen(APP_PORT, () => {
        log.info('Started server');
    });

    setupExitHandler(server);
}

(async () => {
    await db.initialize();
    await db.migrate();
    await startServer();
})();
