const TBL_CARD = 'HanraCard';
const COL_CARD_ID = 'id';
const COL_CARD_OWNER = 'ownerId';
const COL_CARD_SET = 'setId';
const COL_CARD_Q = 'question';
const COL_CARD_AL1 = 'answerWordPinyin';
const COL_CARD_AL2 = 'answerWordHanzi';
const COL_CARD_MWP = 'answerMeasurePinyin';
const COL_CARD_MWH = 'answerMeasureHanzi';
const COL_CARD_EX = 'answerExample';

class CardModel {
    constructor(database) {
        this._database = database;
    }

    /**
     * Counds all cards in a given set for a given owner
     * @param {number} ownerId 
     * @param {number} setId 
     */
    async countAllCards(ownerId, setId, query) {
        // Count all items to we know how many pages there are
        const countQuery = `
            SELECT 
                COUNT(*) as numItems
            FROM 
                ${TBL_CARD} 
            WHERE 
                ${COL_CARD_OWNER} = :ownerId AND 
                ${COL_CARD_SET} = :setId AND
                (
                    ${COL_CARD_Q} LIKE :query OR
                    ${COL_CARD_AL1} LIKE :query OR
                    ${COL_CARD_AL2} LIKE :query
                )
        `
        const result = await this.db.get(countQuery, {
            ':ownerId': ownerId,
            ':setId': setId,
            ':query': `%${query}%`
        });

        return result.numItems;
    }

    /**
     * Returns all sets for a given owner
     * @param {Number} ownerId 
     */
    async getAllCards(ownerId, setId, query, page = 0, pageSize = 10) {
        // Read the actual page
        const readQuery = `
            SELECT 
                ${COL_CARD_ID},
                ${COL_CARD_OWNER},
                ${COL_CARD_SET},
                ${COL_CARD_Q}, 
                ${COL_CARD_AL1}, 
                ${COL_CARD_AL2},
                ${COL_CARD_MWP},
                ${COL_CARD_MWH},
                ${COL_CARD_EX}
            FROM 
                ${TBL_CARD} 
            WHERE 
                ${COL_CARD_OWNER} = :ownerId AND 
                ${COL_CARD_SET} = :setId AND
                (
                    ${COL_CARD_Q} LIKE :query OR
                    ${COL_CARD_AL1} LIKE :query OR
                    ${COL_CARD_AL2} LIKE :query
                )
            ORDER BY 
                ${COL_CARD_Q} COLLATE NOCASE ASC
            LIMIT
                :pageSize
            OFFSET
                :offset
        `;

        const result = await this.db.all(readQuery, {
            ':ownerId': ownerId,
            ':setId': setId,
            ':pageSize': pageSize,
            ':offset': page * pageSize,
            ':query': `%${query}%`
        });

        const numCards = await this.countAllCards(ownerId, setId, query);
        const numPages = numCards == 0 ? 1 : Math.ceil(numCards / pageSize);

        return {
            page: page,
            pageSize: pageSize,
            numPages: numPages,
            numCards: numCards,
            cards: result.map((e) => ({
                id: e[COL_CARD_ID],
                owner: e[COL_CARD_OWNER],
                set: e[COL_CARD_SET],
                question: e[COL_CARD_Q],
                answerWordPinyin:    e[COL_CARD_AL1],
                answerWordHanzi:     e[COL_CARD_AL2],
                // Optional fields: don't want to use 'null', so we'll need to check
                answerMeasurePinyin: e[COL_CARD_MWP] === null ? undefined : e[COL_CARD_MWP],
                answerMeasureHanzi:  e[COL_CARD_MWH] === null ? undefined : e[COL_CARD_MWH],
                answerExample:       e[COL_CARD_EX]  === null ? undefined : e[COL_CARD_EX],
            }))
        }; 
    }

    /**
     * Creates a new card in a set
     * @param {Number} ownerId 
     * @param {Number} setId 
     * @param {Object} values
     */
    async createCard(ownerId, setId, values) {

        // Sanitize values - if values only contain empty spaces, convert it
        // to undefined
        Object.keys(values).forEach(key => {
            if(typeof(values[key]) == 'string') {
                values[key] = values[key].trim();
                if(values[key] == '') {
                    values[key] = undefined;
                }
            }
        });

        const result = await this.db.run(`INSERT INTO ` +
            `${TBL_CARD}(
                '${COL_CARD_SET}', 
                '${COL_CARD_OWNER}', 
                '${COL_CARD_Q}', 
                '${COL_CARD_AL1}', 
                '${COL_CARD_AL2}', 
                '${COL_CARD_MWP}', 
                '${COL_CARD_MWH}', 
                '${COL_CARD_EX}')
            VALUES (
                :setId, 
                :ownerId, 
                :cardQuestion, 
                :answerWordPinyin, 
                :answerWordHanzi, 
                :answerMeasurePinyin, 
                :answerMeasureHanzi, 
                :answerExample)`, {
            ':setId': setId,
            ':ownerId': ownerId,
            ':cardQuestion': values.question,
            ':answerWordPinyin': values.answerWordPinyin,
            ':answerWordHanzi': values.answerWordHanzi,
            ':answerMeasurePinyin': values.answerMeasurePinyin,
            ':answerMeasureHanzi': values.answerMeasureHanzi,
            ':answerExample': values.answerExample
        });

        return { cardId: result.lastID };
    }

    /**
     * Updates a given card with the given question and answers while
     * preserving learn progress
     * @param {*} ownerId 
     * @param {*} cardId 
     * @param {Object} values
     */
    async updateCard(ownerId, cardId, values) {

        // Sanitize values - if values only contain empty spaces, convert it
        // to undefined
        Object.keys(values).forEach(key => {
            if(typeof(values[key]) == 'string') {
                values[key] = values[key].trim();
                if(values[key] == '') {
                    values[key] = undefined;
                }
            }
        });

        const updateQuery = `
            UPDATE 
                ${TBL_CARD}
            SET
                ${COL_CARD_Q} = :question,
                ${COL_CARD_AL1} = :answerWordPinyin,
                ${COL_CARD_AL2} = :answerWordHanzi,
                ${COL_CARD_MWP} = :answerMeasurePinyin,
                ${COL_CARD_MWH} = :answerMeasureHanzi,
                ${COL_CARD_EX} = :answerExample
            WHERE
                ${COL_CARD_ID}      = :cardId AND
                ${COL_CARD_OWNER}   = :ownerId
        `;

        const result = await this.db.run(updateQuery, {
            ':cardId': cardId,
            ':ownerId': ownerId,
            ':question': values.question,
            ':answerWordPinyin': values.answerWordPinyin,
            ':answerWordHanzi': values.answerWordHanzi,
            ':answerMeasurePinyin': values.answerMeasurePinyin,
            ':answerMeasureHanzi': values.answerMeasureHanzi,
            ':answerExample': values.answerExample,
        });

        return { numUpdated: result.changes };
    }

    /**
     * Deletes a given card
     * @param {Number} ownerId 
     * @param {Number} setId 
     * @param {Number} cardId 
     */
    async deleteCard(ownerId, cardId) {
        const deleteQuery = `
            DELETE FROM 
                ${TBL_CARD} 
            WHERE 
                ${COL_CARD_OWNER}   = :ownerId AND    
                ${COL_CARD_ID}      = :cardId
        `;

        const result = await this.db.run(deleteQuery, {
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