const log = require('log4js').getLogger('card');
const database = require('../../database/index.js').getInstance();
const model = require('./model')(database);

const DEFAULT_USER_ID = 1;
const DEFAULT_PAGE_SIZE = 10;

class CardController {

    /**
     * Returns a list of all cards for a given set
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
    */
    async getAllCards(req, res, next) {
        const { setId } = req.params;

        // page, query and pageSize are optional parameters
        // so we might need to set them to default values
        let { page, query, pageSize } = req.query;
        // toInt() is buggy in express-validator, we need to cast it ourselves :-|
        page = typeof(page) === 'undefined' ? parseInt(page, 10) : 0;
        pageSize = typeof(pageSize) === 'undefined' ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE;
        query = query || String();

        console.log('got page', page, typeof(page));
        console.log('got pageSize', pageSize, typeof(pageSize));

        try {
            const result = await model.getAllCards(DEFAULT_USER_ID, setId, query, page, pageSize);
            res.json(result);
        } catch(e) {
            return next(e);
        }
    } 

    /**
     * Creates a new card in a given set
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async createCard(req, res, next) {
        const {setId} = req.params;
        const {question, answerLine1, answerLine2} = req.body;

        try {
            const result = await model.createCard(DEFAULT_USER_ID, setId, question, answerLine1, answerLine2);
            res.status(201).json({message: 'ok', cardId: result.cardId});

        } catch(e) {
            return next(e);
        }
    }

    /**
     * Updates question and answer on a given card
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async updateCard(req, res, next) {
        const { cardId } = req.params;
        const { question, answerLine1, answerLine2 } = req.body;

        try {
            const result = await model.updateCard(DEFAULT_USER_ID, cardId, question, answerLine1, answerLine2);
            if(result.numUpdated == 0) {
                return res.status(404).json({message: 'not found'});
            } else {
                return res.status(200).json({message: 'ok'});
            }
        } catch(e) {
            return next(e);
        }
    }

    /**
     * Delete a given card
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async deleteCard(req, res, next) {
        const { cardId } = req.params;

        try {
            const result = await model.deleteCard(DEFAULT_USER_ID, cardId);
            if(result.numDeleted == 0) {
                return res.status(404).json({message: 'not found'});
            } else {
                return res.status(200).json({message: 'ok'})
            }
        } catch (e) {
            return next(e);
        }
    }
}

module.exports = new CardController();