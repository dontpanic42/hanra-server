const TBL_CARD = 'HanraCard';
const TBL_SRI = 'HanraSRItem';

const DEFAULT_DIFFICULTY = 0.3;
const DEFAULT_DAYS_BETWEEN_REVIEW = 3.0;
const DEFAULT_PERFORMANCE_RATING = 0.6;

class SRModel {
    constructor(database) {
        this._database = database;
    }

    /**
     * Returns up to sessionSize cards based on the sr algorithm
     * 
     * @param {*} ownerId 
     * @param {*} setId 
     * @param {*} sessionSize 
     */
    async getSession(ownerId, setId, sessionSize) {

        //  as percentOverdue
        const query = `
            SELECT     
                ${TBL_CARD}.id, 
                ${TBL_CARD}.ownerId, 
                ${TBL_CARD}.question, 
                ${TBL_CARD}.answer_l1 as answerLine1,
                ${TBL_CARD}.answer_l2 as answerLine2,

                IFNULL(${TBL_SRI}.difficulty,           :defaultDifficulty)        difficulty,
                IFNULL(${TBL_SRI}.daysBetweenReview,    :defaultDaysBetweenReview) daysBetweenReview,
                IFNULL(${TBL_SRI}.dateLastReviewed,     ${TBL_CARD}.createdAt)     dateLastReviewed,

                CASE
                    WHEN IFNULL(${TBL_SRI}.lastPerformanceRating, :defaultPerformanceRating) < 0.6
                        THEN 1.0
                    ELSE (
                        -- Retruns '2.0' when the card was never learned before (= SRItem missing)
                        MIN(2.0, 
                            (
                                -- If the card was never reviewed use the creation date of the card instead
                                (JULIANDAY('now') - JULIANDAY(IFNULL(${TBL_SRI}.dateLastReviewed, ${TBL_CARD}.createdAt)))
                                / IFNULL(${TBL_SRI}.daysBetweenReview, :defaultDaysBetweenReview)
                            )
                        )
                    )
                END percentOverdue
            FROM
                ${TBL_CARD}
            LEFT JOIN ${TBL_SRI} ON
                ${TBL_CARD}.id = ${TBL_SRI}.cardId
            WHERE
                ${TBL_CARD}.ownerId = :ownerId AND
                ${TBL_CARD}.setId = :setId AND
                -- We still want a result even if TBL_SRI does not exist
                (${TBL_SRI}.ownerId = :ownerId OR ${TBL_SRI}.id IS NULL)
            ORDER BY
                percentOverdue DESC
            LIMIT
                :sessionSize
        `;

        return await this.db.all(query, {
            ':ownerId': ownerId,
            ':setId': setId,
            ':sessionSize': sessionSize,
            ':defaultDaysBetweenReview': DEFAULT_DAYS_BETWEEN_REVIEW,
            ':defaultPerformanceRating': DEFAULT_PERFORMANCE_RATING,
            ':defaultDifficulty': DEFAULT_DIFFICULTY
        });
    }

    /**
     * Creates or updates the SR item for a given card and owner.
     * 
     * @param {*} ownerId Id of the card owner
     * @param {*} cardId Id of the card
     * @param {*} performanceRating Result of the training session with 0.0 the worst, and 1.0 the perfect result
     * @param {*} percentOverdue Previous percentOverdue value
     */
    async upsertSRI(ownerId, cardId, performanceRating) {   
        // Doing a join here to preven creating a sri for a card that either does not exist or that
        // does not belong to the user!
        const readQuery = `
            SELECT 
                ${TBL_CARD}.id, 
                ${TBL_CARD}.ownerId,
                IFNULL(${TBL_SRI}.difficulty,               :defaultDifficulty)         difficulty,
                IFNULL(${TBL_SRI}.lastPerformanceRating,    :defaultPerformanceRating)  lastPerformanceRating,
                IFNULL(${TBL_SRI}.daysBetweenReview,        :defaultDaysBetweenReview)  daysBetweenReview,

                CASE
                    WHEN IFNULL(${TBL_SRI}.lastPerformanceRating, :defaultPerformanceRating) < 0.6
                        THEN 1.0
                    ELSE (
                        -- Retruns '2.0' when the card was never learned before (= SRItem missing)
                        MIN(2.0, 
                            (
                                -- If the card was never reviewed use the creation date of the card instead
                                (JULIANDAY('now') - JULIANDAY(IFNULL(${TBL_SRI}.dateLastReviewed, ${TBL_CARD}.createdAt)))
                                / IFNULL(${TBL_SRI}.daysBetweenReview, :defaultDaysBetweenReview)
                            )
                        )
                    )
                END percentOverdue
            FROM
                ${TBL_CARD}
            LEFT JOIN ${TBL_SRI} ON
                ${TBL_CARD}.id =     ${TBL_SRI}.cardId
            WHERE
                ${TBL_CARD}.id = :cardId AND
                -- We still want a result even if TBL_SRI does not exist
                (${TBL_SRI}.ownerId = :ownerId OR ${TBL_SRI}.id IS NULL)
        `;

        // Do the query
        const sri = await this.db.get(readQuery, {
            ':ownerId': ownerId,
            ':cardId': cardId,
            ':defaultDifficulty': DEFAULT_DIFFICULTY,
            ':defaultPerformanceRating': DEFAULT_PERFORMANCE_RATING,
            ':defaultDaysBetweenReview': DEFAULT_DAYS_BETWEEN_REVIEW
        });

        // sri is only empty when there is no card with the given id that belongs to the given owner
        if(!sri) {
            throw new Error(`Card with cardId=${cardId} not found for owner ${ownerId}`);
        }



        let difficulty = sri.difficulty;
        // Calculate the difficulty delta based on the SM2+ algorithm
        difficulty += (sri.percentOverdue * (1/17) * (8 - (9 * performanceRating)))
        // Clamp it between 1 and 0
        difficulty = Math.min(Math.max(difficulty, 0.0), 1.0);
        // Lots of magic
        let difficultyWeight = 3 - (1.7 * difficulty);

        let daysBetweenReview;
        if(sri.lastPerformanceRating >= 0.6) {
            // When the answer was correct
            // Note: Days scale with the percentOverdue, meaning if you try it again immediately, you
            // don't really increase the daysBetweenReview
            daysBetweenReview = sri.daysBetweenReview * (1+((difficultyWeight - 1) * sri.percentOverdue));
        } else {
            // WHen the ansewr was not correct
            daysBetweenReview = sri.daysBetweenReview * (1.0 / Math.pow(difficultyWeight, 2));
        }

        // Ensure that there is at least one day between reviews
        daysBetweenReview = Math.max(daysBetweenReview, 1.0);

        const updateQuery = `
            INSERT OR REPLACE INTO ${TBL_SRI}(
                ownerId, cardId, difficulty, daysBetweenReview, dateLastReviewed, lastPerformanceRating
            ) VALUES (
                :ownerId, :cardId, :difficulty, :daysBetweenReview, datetime('now'), :performanceRating
            )
        `;

        await this.db.run(updateQuery, {
            ':ownerId': ownerId,
            ':cardId': cardId,
            ':difficulty': difficulty,
            ':daysBetweenReview': daysBetweenReview,
            ':performanceRating': performanceRating
        });
    }

    get db() {
        return this._database.db
    }
}


module.exports = (db) => new SRModel(db);