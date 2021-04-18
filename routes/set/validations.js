const { body, param, validationResult } = require('express-validator')

module.exports = {
    'validateGetSetDetails': [
        param('setId')
        .exists()
        .isInt(),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        }
    ],

    'validateCreateSet': [
        body('setName')
        .exists()
        .isString()
        .trim()
        .isLength({min: 3}),
        body('setDescription')
        .optional()
        .isString()
        .trim()
        .isLength({min: 3}),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        }
    ],

    'validateDeleteSet': [
        param('setId')
        .exists()
        .isInt(),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        }
    ],
};