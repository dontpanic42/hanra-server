const express = require('express');
const controller = require('./controller');
const validations = require('./validations');

const getRoutes = () => {
    const router = express.Router({mergeParams: true});

    router.use(express.json())
    
    router
        .route('/')
        .get(   controller.getAllCards.bind(controller))
        .post(validations.validateCreateCard, controller.createCard.bind(controller));

    router
        .route('/:cardId')
        .put   (validations.validateUpdateCard, controller.updateCard.bind(controller))
        .delete(validations.validateDeleteCard, controller.deleteCard.bind(controller));

    return router;
}

module.exports = getRoutes;