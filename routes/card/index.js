const express = require('express');
const controller = require('./controller');

const getRoutes = () => {
    const router = express.Router({mergeParams: true});

    router.use(express.json())
    
    router
        .route('/')
        .get(   controller.getAllCards.bind(controller))
        .post(  controller.createCard.bind(controller));

    return router;
}

module.exports = getRoutes;