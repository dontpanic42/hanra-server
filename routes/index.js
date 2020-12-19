const express = require('express');
const getSetRoutes = require('./set/index');
const getVersionRoutes = require('./version/index');
const getSettingsRoutes = require('./usersettings/index');

const getRoutes = () => {
    const router = express.Router();

    router.use('/helloworld', async (req, res) => {
        res.send('hello world indeed!');
    });

    router.use('/set', getSetRoutes());
    router.use('/settings', getSettingsRoutes())
    router.use('/version', getVersionRoutes());

    return router;
}

module.exports = getRoutes;