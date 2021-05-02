const { body, query, param, validationResult } = require('express-validator')

module.exports = {
    'validateGetAllCards': [
        param('setId')
        .exists()
        .isInt()
        .toInt(),
        query('page')
        .optional()
        .isInt({min: 0})
        .toInt(),
        query('pageSize')
        .optional()
        .isInt({min: 10, max: 100})
        .toInt(),
        query('query')
        .optional()
        .isString()
        .trim()
        .escape()
    ],

    'validateCreateCard': [
        param('setId')
        .exists()
        .isInt(),
        body('question')
        .exists()
        .isString()
        .trim()
        .isLength({min: 1}),
        body('answerWordPinyin')
        .exists()
        .isString()
        .trim()
        .isLength({min: 1}),
        body('answerWordHanzi')
        .exists()
        .isString()
        .trim(),
        body('answerMeasurePinyin')
        .optional()
        .isString()
        .trim(),
        body('answerMeasureHanzi')
        .optional()
        .isString()
        .trim(),
        body('answerExample')
        .optional()
        .isString()
        .trim(),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        }
    ],

    'validateUpdateCard': [
        param('cardId')
        .exists()
        .isInt(),
        body('question')
        .exists()
        .isString()
        .trim()
        .isLength({min: 1}),
        body('answerWordPinyin')
        .exists()
        .isString()
        .trim()
        .isLength({min: 1}),
        body('answerWordHanzi')
        .exists()
        .isString()
        .trim()
        .isLength({min: 1}),
        body('answerMeasurePinyin')
        .optional()
        .isString()
        .trim(),
        body('answerMeasureHanzi')
        .optional()
        .isString()
        .trim(),
        body('answerExample')
        .optional()
        .isString()
        .trim(),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            next();
        }
    ],

    'validateDeleteCard': [
        param('cardId')
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