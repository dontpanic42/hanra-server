const express = require('express');
const controller = require('./controller');
const validations = require('./validations');

const getRoutes = () => {
    const router = express.Router({mergeParams: true});

    router.use(express.json())
    
    router
        .route('/')
        .get(validations.validateGetRandomCard, controller.getRandomCard.bind(controller))

    return router;
}

module.exports = getRoutes;