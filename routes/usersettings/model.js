const log = require('log4js').getLogger('usersettings');

const TBL_USET = 'HanraUserSettings';

class UserSettingsModel {
    constructor(database) {
        this._database = database;
    }

    /**
     * Returns all user settings for a given user id
     * @param {number} userId Id of the user to fetch the settings for 
     */
    async getSettings(ownerId) {
        const readQuery = `
            SELECT 
                srSessionSize,
                srSessionNewItemsRatio,
                srSessionNewCutoffDays
            FROM
                ${TBL_USET}
            WHERE
                ownerId = :ownerId
            LIMIT
                1
        `

        const result = await this.db.get(readQuery, {
            ':ownerId': ownerId
        });

        if(!result) {
            log.error('Could not find user settings for user', userId);
            throw new Error('Could not find user settings for user' + userId);
        }

        return result;
    }

    async saveSettings(ownerId, settings) {
        const updateQuery = `
            INSERT OR REPLACE INTO 
                ${TBL_USET} (
                    ownerId,
                    srSessionSize,
                    srSessionNewItemsRatio,
                    srSessionNewCutoffDays
                ) VALUES (
                    :ownerId,
                    :srSessionSize,
                    :srSessionNewItemsRatio,
                    :srSessionNewCutoffDays
                )
            `;

        await this.db.run(updateQuery, {
            ':ownerId': ownerId,
            ':srSessionSize': settings.srSessionSize,
            ':srSessionNewItemsRatio': settings.srSessionNewItemsRatio,
            ':srSessionNewCutoffDays': settings.srSessionNewCutoffDays
        });
    }

    get db() {
        return this._database.db
    }
}


module.exports = (db) => new UserSettingsModel(db);