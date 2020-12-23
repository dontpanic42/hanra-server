const log = require('log4js').getLogger('set');
const database = require('../../database/index.js').getInstance();
const model = require('./model')(database);

const DEFAULT_USER_ID = 1;

class SetController {

    /**
     * Returns a list of all sets
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
    */
    async getAllSets(req, res, next) {
        try {
            const result = await model.getAllSets(DEFAULT_USER_ID);
            res.json({
                page: 0,
                sets: result
            });
        } catch(e) {
            return next(e);
        }
    }

    /**
     * Returns a single set
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async getSetDetails(req, res, next) {
        const setId = parseInt(req.params.setId, 10);

        try {
            const result = await model.getSetDetails(DEFAULT_USER_ID, setId);
            if(!result) {
                return res.status(404).json({message: 'set not found'});
            }
            
            return res.json(result);
        } catch(e) {
            return next(e);
        }
    }

    /**
     * Creates a new set
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async createSet(req, res, next) {
        const {setName, setDescription} = req.body;

        try {
            const result = await model.createSet(DEFAULT_USER_ID, setName, setDescription);
            res.status(201).json({message: 'ok', setId: result.setId});

        } catch(e) {
            return next(e);
        }
    }

    /**
     * Delete a set
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async deleteSet(req, res, next) {
        const setId = parseInt(req.params.setId, 10);

        try {
            const result = await model.deleteSet(DEFAULT_USER_ID, setId);
            if(result.numDeleted == 0) {
                return res.status(404).json({message: 'not found'});
            } else {
                return res.status(200).json({message: 'ok'})
            }
        } catch(e) {
            return next(e);
        }
    }
}

module.exports = new SetController();