const TBL_CARD = 'HanraCard';
const COL_CARD_ID = 'id';
const COL_CARD_OWNER = 'ownerId';
const COL_CARD_SET = 'setId';
const COL_CARD_Q = 'question';
const COL_CARD_AL1 = 'answer_l1';
const COL_CARD_AL2 = 'answer_l2';

class CardModel {
    constructor(database) {
        this._database = database;
    }

    /**
     * Returns all sets for a given owner
     * @param {Number} ownerId 
     */
    async getAllCards(ownerId, setId, page = 0, pageSize = 10) {
        // Count all items to we know how many pages there are
        const countQuery = `
            SELECT 
                COUNT(*) as numItems
            FROM 
                ${TBL_CARD} 
            WHERE 
                ${COL_CARD_OWNER} = :ownerId AND 
                ${COL_CARD_SET} = :setId
        `

        const countResult = await this.db.get(countQuery, {
            ':ownerId': ownerId,
            ':setId': setId,
        });

        // Read the actual page
        const readQuery = `
            SELECT 
                *
            FROM 
                ${TBL_CARD} 
            WHERE 
                ${COL_CARD_OWNER} = :ownerId AND 
                ${COL_CARD_SET} = :setId
            LIMIT
                :pageSize
            OFFSET
                :offset
        `;

        const result = await this.db.all(readQuery, {
            ':ownerId': ownerId,
            ':setId': setId,
            ':pageSize': pageSize,
            ':offset': page * pageSize
        });

        return {
            page: page,
            pageSize: pageSize,
            numPages: countResult.numItems == 0 ? 1 : Math.ceil(countResult.numItems / pageSize),
            cards: result.map((e) => ({
                id: e[COL_CARD_ID],
                owner: e[COL_CARD_OWNER],
                set: e[COL_CARD_SET],
                question: e[COL_CARD_Q],
                answerLine1: e[COL_CARD_AL1],
                answerLine2: e[COL_CARD_AL2]
            }))
        };
    }

    /**
     * Creates a new card in a set
     * @param {Number} ownerId 
     * @param {Number} setId 
     * @param {String} question 
     * @param {String} answerLine1 
     * @param {String} answerLine2 
     */
    async createCard(ownerId, setId, question, answerLine1, answerLine2) {
        const result = await this.db.run(`INSERT INTO ` +
            `${TBL_CARD}('${COL_CARD_SET}', '${COL_CARD_OWNER}', '${COL_CARD_Q}', '${COL_CARD_AL1}', '${COL_CARD_AL2}') ` +
            `VALUES (:setId, :ownerId, :cardQuestion, :cardAnswer1, :cardAnswer2)`, {
            ':setId': setId,
            ':ownerId': ownerId,
            ':cardQuestion': question,
            ':cardAnswer1': answerLine1,
            ':cardAnswer2': answerLine2
        });

        return { cardId: result.lastID };
    }

    /**
     * Deletes a given card
     * @param {Number} ownerId 
     * @param {Number} setId 
     * @param {Number} cardId 
     */
    async deleteCard(ownerId, setId, cardId) {
        const deleteQuery = `
            DELETE FROM 
                ${TBL_CARD} 
            WHERE 
                ${COL_CARD_SET}     = :setId AND 
                ${COL_CARD_OWNER}   = :ownerId AND    
                ${COL_CARD_ID}      = :cardId
        `;

        const result = await this.db.run(deleteQuery, {
            ':setId': setId,
            ':ownerId': ownerId,
            ':cardId': cardId
        });

        return { numDeleted: result.changes };
    }

    get db() {
        return this._database.db
    }
}


module.exports = (db) => new CardModel(db);