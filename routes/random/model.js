const log = require('log4js').getLogger('rnd');
const TBL_CARD = 'HanraCard';

class RandomModel {
    static RANDOM_CARD_TYPE = Object.freeze({
        'NEW': 'new',
        'ALL': 'all'
    });

    constructor(database) {
        this._database = database;
    }

    async getRandomCard(ownerId, setId, settings, type=RandomModel.RANDOM_CARD_TYPE.ALL) {

        let cutoffWhereClause = String();
        let cutoffParams = {};
        cutoffParams[':cutoff'] = parseInt(settings.srSessionNewCutoffDays, 10);
        cutoffParams[':cutoff'] = `-${Math.abs(cutoffParams[':cutoff'])} days`;
        if(type == RandomModel.RANDOM_CARD_TYPE.NEW) {
            cutoffWhereClause = `createdAt > datetime('now', :cutoff) AND`;
        }

        const query = `
            SELECT     
                id, 
                ownerId, 
                question, 
                answer_l1 as answerLine1,
                answer_l2 as answerLine2,
                createdAt,
                CASE
                    WHEN createdAt > datetime('now', :cutoff)
                        THEN 'new'
                    ELSE
                        'review'
                END type
            FROM
                ${TBL_CARD}
            WHERE
                ${cutoffWhereClause}
                setId = :setId AND
                ownerId = :ownerId
            ORDER BY
                RANDOM()
            LIMIT 1
        `;

        const card = await this.db.get(query, Object.assign({
            ':ownerId': ownerId,
            ':setId': setId,
        }, cutoffParams));

        return card;
    }

    get db() {
        return this._database.db
    }
}

module.exports = RandomModel;