const { query, param, validationResult } = require('express-validator')
const RandomModel = require('./model');

module.exports = {
    'validateGetRandomCard': [
        param('setId')
        .exists()
        .isInt(),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        },
        query('type')
        .optional()
        .isString()
        .isIn([
            RandomModel.RANDOM_CARD_TYPE.NEW, 
            RandomModel.RANDOM_CARD_TYPE.ALL]),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        }
    ],
};