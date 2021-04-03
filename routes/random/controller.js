const log = require('log4js').getLogger('rnd');
const database = require('../../database/index.js').getInstance();
const RandomModel = require('./model');
const settingsModel = require('../usersettings/model')(database);

const DEFAULT_USER_ID = 1;
// When no number of items is passed, use this one as default
const DEFAULT_MAX_ITEMS = 100;
// To prevent slowdowns, this is the maximum number of items that can be requested
const MAX_MAX_ITEMS = 100;

const model = new RandomModel(database);

class RandomController {

    async getRandomCards(req, res, next) {
        const setId = parseInt(req.params.setId, 10);
        const cardType = req.query.type;
        const maxItems = Math.min(MAX_MAX_ITEMS, parseInt(req.query.max, 10) || DEFAULT_MAX_ITEMS);

        try {
            // Fetch user settings
            const settings = await settingsModel.getSettings(DEFAULT_USER_ID);
            // Get the session
            const result = await model.getRandomCards(DEFAULT_USER_ID, setId, settings, maxItems, cardType);
            res.json({
                cards: result || [],
                maxCards: maxItems
            });
        } catch(e) {
            return next(e);
        }
    };

};

module.exports = new RandomController();