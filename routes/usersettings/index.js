const express = require('express');
const controller = require('./controller');
const validations = require('./validations');

const getRoutes = () => {
    const router = express.Router({mergeParams: true});

    router.use(express.json())
    
    router
        .route('/')
        .get(controller.getSettings.bind(controller))
        .post(validations.validateSettings, controller.setSettings.bind(controller));

    return router;
}

module.exports = getRoutes;