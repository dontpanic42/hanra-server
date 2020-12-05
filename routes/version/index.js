const express = require('express');
const package = require('../../package.json');

const getRoutes = () => {
    const router = express.Router();

    router.get('/version', async (req, res) => {
        return res.status(200).json({
            appversion: package.version
        });
    });

    return router;
}

module.exports = getRoutes;