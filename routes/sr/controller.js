const log = require('log4js').getLogger('sri');
const database = require('../../database/index.js').getInstance();
const SRModel = require('./model');
const settingsModel = require('../usersettings/model')(database);

const DEFAULT_USER_ID = 1;
const DEFAULT_SESSION_SIZE = 20;
const MAX_SESSION_SIZE = 50;
const MIN_SESSION_SIZE = 2;

const model = new SRModel(database);

class SRController {

    /**
     * Returns cards based on the SR algorithm
     * 
     * Note: This is a read only operation.
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
    */
    async getSession(req, res, next) {

        const setId = parseInt(req.params.setId, 10);   

        try {
            // Fetch user settings
            const settings = await settingsModel.getSettings(DEFAULT_USER_ID);
            // Get the session
            const result = await model.getSession(DEFAULT_USER_ID, setId, settings);
            res.json({
                page: 0,
                cards: result
            });
        } catch(e) {
            return next(e);
        }
    }

    /**
     * Upsert the SR item for a given card.
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async updateSRI(req, res, next) {
        const cardId = req.params.cardId;
        const performanceRating = req.body.performanceRating;

        try {
            await model.upsertSRI(DEFAULT_USER_ID, cardId, performanceRating);
            res.status(201).json({message: 'ok'});

        } catch(e) {
            return next(e);
        }
            
    }
};

module.exports = new SRController();