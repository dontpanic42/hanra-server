const log = require('log4js').getLogger('rnd');
const database = require('../../database/index.js').getInstance();
const RandomModel = require('./model');
const settingsModel = require('../usersettings/model')(database);

const DEFAULT_USER_ID = 1;

const model = new RandomModel(database);

class RandomController {

    async getRandomCard(req, res, next) {
        const setId = parseInt(req.params.setId, 10);
        const cardType = req.query.type;

        try {
            // Fetch user settings
            const settings = await settingsModel.getSettings(DEFAULT_USER_ID);
            // Get the session
            const result = await model.getRandomCard(DEFAULT_USER_ID, setId, settings, cardType);
            res.json({
                card: result
            });
        } catch(e) {
            return next(e);
        }
    };

};

module.exports = new RandomController();