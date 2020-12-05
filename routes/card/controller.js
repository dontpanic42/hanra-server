const log = require('log4js').getLogger('card');
const database = require('../../database/index.js');
const model = require('./model')(database);

const DEFAULT_USER_ID = 1;

class CardController {

    /**
     * Returns a list of all cards for a given set
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
    */
    async getAllCards(req, res, next) {
        const setId = parseInt(req.params.setId, 10);

        try {
            const result = await model.getAllCards(DEFAULT_USER_ID, setId);
            res.json({
                page: 0,
                cards: result
            });
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

        if(!question || String(question).trim() == '') {
            return next(new Error("Invalid or missing question!"));
        }

        if(!answerLine1 || String(answerLine1).trim() == '') {
            return next(new Error("Invalid or missing answerLine1!"));
        }

        if(!answerLine2 || String(answerLine2).trim() == '') {
            return next(new Error("Invalid or missing answerLine2!"));
        }

        try {
            const result = await model.createCard(DEFAULT_USER_ID, setId, question, answerLine1, answerLine2);
            res.status(201).json({message: 'ok', cardId: result.cardId});

        } catch(e) {
            return next(e);
        }
    }
}

module.exports = new CardController();