const log = require('log4js').getLogger('srsession');
const SRUtil = require('./util');

const TBL_CARD = 'HanraCard';
const TBL_SRI = 'HanraSRItem';

const DEFAULT_DAYS_BETWEEN_REVIEW = 3.0;
const DEFAULT_PERFORMANCE_RATING = 0.6;

class SRModel {

    static DEFAULT_DIFFICULTY = 0.4;

    static SESSION_CARD_TYPE = Object.freeze({
        'NEW': 'new',
        'REVIEW': 'review'
    });

    constructor(database) {
        this._database = database;
    }

    async getSession(ownerId, setId, settings) {
        const ratio = settings.srSessionNewItemsRatio;
        const size = settings.srSessionSize;

        // Getting the cards for the session. Note that we always request a full set of
        // either, since in the worst case, there either only new or only old cards
        // Get new cards
        const newCards = await this.getSessionCards(ownerId, setId, settings, SRModel.SESSION_CARD_TYPE.NEW);
        // Get review cards
        const revCards = await this.getSessionCards(ownerId, setId, settings, SRModel.SESSION_CARD_TYPE.REVIEW);

        // Calculate the number of cards we take from the new cards deck and the
        // review cards deck. Keep in mind that we might have less cards than
        // the maximum supplied in the settings
        let numNewCards = Math.min(Math.ceil(size * ratio), newCards.length);
        // If we don't have enough new cards, fill the rest with review cards
        let numRevCards = Math.min(size - numNewCards, revCards.length);

        // If we still don't have enough cards, try to fill the rest with new cards
        if((numNewCards + numRevCards) < settings.srSessionSize) {
            // Calculate the amount of cards that we still need for a full session
            const stillRequired = settings.srSessionSize - (numRevCards + numNewCards);
            // Calculate how many new cards we still have that are unused
            const newCardsLeft = newCards.length - numNewCards;
            // Use those cards to fill up the session
            numNewCards += Math.min(stillRequired, newCardsLeft);
        }

        const deck = SRUtil.shuffle([
            ...newCards.slice(0, numNewCards),
            ...revCards.slice(0, numRevCards)
        ]);

        return deck;
    }

    /**
     * Returns up to sessionSize cards based on the sr algorithm
     * 
     * @param {*} ownerId 
     * @param {*} setId 
     * @param {*} settings 
     * @param {String} sesstion type (of enum SRModel.SESSION_CARD_TYPE)
     */
    async getSessionCards(ownerId, setId, settings, type = SRModel.SESSION_CARD_TYPE.NEW) {

        let cardAgeCutoffDays = parseInt(settings.srSessionNewCutoffDays, 10);
        if(isNaN(cardAgeCutoffDays)) {
            throw new Error('srSessionNewCutoffDays is not a number!!');
        }
        cardAgeCutoffDays = `-${Math.abs(cardAgeCutoffDays)} days`;

        let cardAgeWhenClause = '';
        switch(type) {
            case SRModel.SESSION_CARD_TYPE.NEW: {
                cardAgeWhenClause = `IFNULL(${TBL_SRI}.createdAt, datetime('now')) > datetime('now', :cutoff)`;
                break;
            }
            case SRModel.SESSION_CARD_TYPE.REVIEW: {
                cardAgeWhenClause = `IFNULL(${TBL_SRI}.createdAt, datetime('now')) < datetime('now', :cutoff)`;
                break;
            }
            default: {
                throw new Error(`Unknown getSessionCards type param ${type}`);
            }
        }

        //  as percentOverdue
        const query = `
            SELECT     
                ${TBL_CARD}.id, 
                ${TBL_CARD}.ownerId, 
                ${TBL_CARD}.question, 
                ${TBL_CARD}.answerWordPinyin,
                ${TBL_CARD}.answerWordHanzi,
                ${TBL_CARD}.answerMeasurePinyin,
                ${TBL_CARD}.answerMeasureHanzi,
                ${TBL_CARD}.answerExample,

                IFNULL(${TBL_SRI}.difficulty,           :defaultDifficulty)        difficulty,
                IFNULL(${TBL_SRI}.daysBetweenReview,    :defaultDaysBetweenReview) daysBetweenReview,
                IFNULL(${TBL_SRI}.dateLastReviewed,     ${TBL_CARD}.createdAt)     dateLastReviewed,
                IFNULL(${TBL_SRI}.createdAt, ${TBL_CARD}.createdAt)                createdAt,

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
                (${TBL_SRI}.ownerId = :ownerId OR ${TBL_SRI}.id IS NULL) AND
                ${cardAgeWhenClause}
            ORDER BY
                percentOverdue DESC
            LIMIT
                :sessionSize
        `;

        const result = await this.db.all(query, {
            ':ownerId': ownerId,
            ':setId': setId,
            ':sessionSize': settings.srSessionSize,
            ':defaultDaysBetweenReview': DEFAULT_DAYS_BETWEEN_REVIEW,
            ':defaultPerformanceRating': DEFAULT_PERFORMANCE_RATING,
            ':defaultDifficulty': SRModel.DEFAULT_DIFFICULTY,
            ':cutoff': cardAgeCutoffDays
        });

        // Add a new property 'type' to each card
        // that contains the type for the card
        return (result || []).map(r => {
            r.type = type
            return r;
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
                
                ${TBL_SRI}.dateLastReviewed as SRItemLastReviewAt,
                ${TBL_SRI}.createdAt as SRItemCreatedAt,

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
            ':defaultDifficulty': SRModel.DEFAULT_DIFFICULTY,
            ':defaultPerformanceRating': DEFAULT_PERFORMANCE_RATING,
            ':defaultDaysBetweenReview': DEFAULT_DAYS_BETWEEN_REVIEW
        });

        // sri is only empty when there is no card with the given id that belongs to the given owner
        if(!sri) {
            log
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

        
        // Since we are doing a replace, with out specifying this, on every update we would
        // automatically set the createdAt date to the current timestamp. This is not what we want
        // to do when the SRItem already existed (i.e. SRItemCreatedAt != null), so we just pass
        // it through. When the item did *not* yet exist, we just set it to the current date.
        // Here's where it gets weird: Seems like sqlite returns datetime objects as timestamps, but
        // it accepts iso timestrings? So basically we need to parse the date we just read and
        // converting it into an ISO timestamp before putting it back into the db?! 
        // Anyways, seemt to work well and it's covered extensively by tests, so lets go with it for now
        const srCreatedAt = (sri.SRItemCreatedAt) ? 
            new Date(sri.SRItemCreatedAt).toISOString() : 
            (new Date()).toISOString()

        const updateQuery = `
            INSERT OR REPLACE INTO ${TBL_SRI}(
                ownerId, 
                cardId, 
                difficulty, 
                daysBetweenReview, 
                dateLastReviewed, 
                lastPerformanceRating,
                createdAt
            ) VALUES (
                :ownerId, 
                :cardId, 
                :difficulty, 
                :daysBetweenReview, 
                datetime('now'), 
                :performanceRating,
                :createdAt
            )
        `;

        await this.db.run(updateQuery, {
            ':ownerId': ownerId,
            ':cardId': cardId,
            ':difficulty': difficulty,
            ':daysBetweenReview': daysBetweenReview,
            ':performanceRating': performanceRating,
            ':createdAt': srCreatedAt
        });
    }

    get db() {
        return this._database.db
    }
}


module.exports = SRModel;