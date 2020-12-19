const { body, validationResult } = require('express-validator')

module.exports = {
    'validateSettings': [
        body('srSessionSize')
        .exists()
        .isInt({min: 0, max: 100}),
        body('srSessionNewCutoffDays')
        .exists()
        .isInt({min: 0, max: 360}),
        body('srSessionNewItemsRatio')
        .exists()
        .isFloat({min: 0.0, max: 1.0}),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        },
    ]
};