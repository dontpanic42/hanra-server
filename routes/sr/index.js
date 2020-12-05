const express = require('express');
const controller = require('./controller');

const getRoutes = () => {
    const router = express.Router({mergeParams: true});

    router.use(express.json())
    
    router
        .route('/')
        .get(   controller.getSession.bind(controller))

    router
        .route('/:cardId')
        .post(   controller.updateSRI.bind(controller))

    return router;
}

module.exports = getRoutes;