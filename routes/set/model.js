const TBL_SET = 'HanraSet';
const COL_SET_ID = 'id';
const COL_SET_NAME = 'setName';
const COL_SET_DESCRIPTION = 'setDescription'
const COL_SET_OWNER = 'ownerId'

class SetModel {
    constructor(database) {
        this._database = database;
    }

    /**
     * Returns all sets for a given owner
     * @param {Number} ownerId 
     */
    async getAllSets(ownerId) {
        const result = await this.db.all(`SELECT ${COL_SET_ID}, ${COL_SET_NAME}, ${COL_SET_DESCRIPTION} FROM ${TBL_SET} WHERE ${COL_SET_OWNER} = :owner`, {
            ':owner': ownerId
        });
        
        return result.map((e) => ({
            id: e[COL_SET_ID],
            setName: e[COL_SET_NAME],
            setDescription: e[COL_SET_DESCRIPTION],
            owner: ownerId
        }));
    }

    /**
     * Creates a new set
     * @param {Number} ownerId User Id of the owner of the set 
     * @param {String} setName Name of the set 
     * @param {String} setDescription Description of the set
     */
    async createSet(ownerId, setName, setDescription) {
        const result = await this.db.run(`INSERT INTO ${TBL_SET}('${COL_SET_NAME}', '${COL_SET_DESCRIPTION}', '${COL_SET_OWNER}') `+
            `VALUES (:setName, :setDescription, :ownerId)`, {
            ':setName': setName,
            ':setDescription': setDescription,
            ':ownerId': ownerId
        });

        return { setId: result.lastID };
    }

    /**
     * Deletes a given set
     * @param {Number} ownerId 
     * @param {Number} setId 
     */
    async deleteSet(ownerId, setId) {
        const result = await this.db.run(`DELETE FROM ${TBL_SET} WHERE ${COL_SET_ID} = :setId AND ${COL_SET_OWNER} = :ownerId`, {
            ':setId': setId,
            ':ownerId': ownerId
        });

        return { numDeleted: result.changes };
    }

    get db() {
        return this._database.db
    }
}


module.exports = (db) => new SetModel(db);