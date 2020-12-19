const { body, param, validationResult } = require('express-validator')

module.exports = {
    'validatePerformanceReview': [
        body('performanceRating')
        .exists()
        .isFloat({min: 0.0, max: 1.0}),
        param('cardId')
        .exists()
        .isInt(),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        },
    ]
};