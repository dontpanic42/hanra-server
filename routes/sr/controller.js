const log = require('log4js').getLogger('sri');
const database = require('../../database/index.js');
const model = require('./model')(database);

const DEFAULT_USER_ID = 1;
const DEFAULT_SESSION_SIZE = 20;
const MAX_SESSION_SIZE = 50;
const MIN_SESSION_SIZE = 2;

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
        let sessionSize  = parseInt(req.query.sessionSize, 10);
        sessionSize = isNaN(sessionSize) ? DEFAULT_SESSION_SIZE : sessionSize;
        sessionSize = Math.min(MAX_SESSION_SIZE, sessionSize);
        sessionSize = Math.max(MIN_SESSION_SIZE, sessionSize);

        console.log('sessionSize', sessionSize);

        try {
            const result = await model.getSession(DEFAULT_USER_ID, setId, sessionSize);
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
        const cardId = parseInt(req.params.cardId, 10);
        const performanceRating = parseFloat(req.body.performanceRating);

        if(isNaN(cardId)) {
            return next(new Error("Invalid or missing cardId parameter"))
        }

        if(isNaN(performanceRating)) {
            return next(new Error("Invalid or missing performanceRating parameter"));
        }

        try {
            const result = await model.upsertSRI(DEFAULT_USER_ID, cardId, performanceRating);
            res.status(201).json({message: 'ok'});

        } catch(e) {
            return next(e);
        }
            
    }
};

module.exports = new SRController();