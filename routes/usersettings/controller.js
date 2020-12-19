const log = require('log4js').getLogger('card');
const database = require('../../database/index.js').getInstance();
const model = require('./model')(database);

const DEFAULT_USER_ID = 1;

class CardController {

    /**
     * Returns a list of all settings for the requesting user
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
    */
    async getSettings(req, res, next) {
        try {
            const result = await model.getSettings(DEFAULT_USER_ID);
            res.json(result);
        } catch(e) {
            return next(e);
        }
    }

    async setSettings(req, res, next) {
        const settings = {
            srSessionSize: req.body.srSessionSize,
            srSessionNewItemsRatio: req.body.srSessionNewItemsRatio,
            srSessionNewCutoffDays: req.body.srSessionNewCutoffDays
        }

        try {
            await model.saveSettings(DEFAULT_USER_ID, settings);
            res.status(201).json({message: 'ok'});

        } catch(e) {
            return next(e);
        }
    }
}

module.exports = new CardController();