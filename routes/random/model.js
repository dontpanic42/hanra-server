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

    async getRandomCards(ownerId, setId, settings, maxItems, type=RandomModel.RANDOM_CARD_TYPE.ALL) {

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
                answerWordPinyin,
                answerWordHanzi,
                answerMeasurePinyin,
                answerMeasureHanzi,
                answerExample,
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
            LIMIT 
                :maxItems
        `;

        const cards = await this.db.all(query, Object.assign({
            ':ownerId': ownerId,
            ':setId': setId,
            ':maxItems': maxItems,
        }, cutoffParams));

        return cards;
    }

    get db() {
        return this._database.db
    }
}

module.exports = RandomModel;