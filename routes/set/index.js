const express = require('express');
const controller = require('./controller');
const getCardRoutes = require('../card/index');

const getRoutes = () => {
    const router = express.Router();

    router.use(express.json())
    
    router
        .route('/')
        .post(  controller.createSet.bind(controller))
        .get(   controller.getAllSets.bind(controller));

    router
        .route('/:setId')
        .delete(controller.deleteSet.bind(controller));

    router.use('/:setId/card', getCardRoutes())

    return router;
}

module.exports = getRoutes;