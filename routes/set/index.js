const express = require('express');
const controller = require('./controller');
const getCardRoutes = require('../card/index');
const getSRRoutes = require('../sr/index');
const getRandomCards = require('../random/index');
const validations = require('./validations');

const getRoutes = () => {
    const router = express.Router();

    router.use(express.json())
    
    router
        .route('/')
        .post(validations.validateCreateSet, controller.createSet.bind(controller))
        .get(   controller.getAllSets.bind(controller));

    router
        .route('/:setId')
        .delete(validations.validateDeleteSet, controller.deleteSet.bind(controller))
        .get(validations.validateGetSetDetails, controller.getSetDetails.bind(controller));

    router.use('/:setId/card', getCardRoutes());
    router.use('/:setId/sr', getSRRoutes());

    router.use('/:setId/random', getRandomCards());

    return router;
}

module.exports = getRoutes;