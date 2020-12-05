
const db = require('sqlite');
const sqlite3 = require('sqlite3');
const log = require('log4js').getLogger('db');

class HanraDatabase {
    constructor() {
        this._database = undefined;
    }

    async initialize() {
        log.info('Opening database');
        this._database = await db.open({
            filename: './hanra.db',
            driver: sqlite3.Database
        });

        // log.info('Starting db migrations')
        // db.migrate({force: 'last'});
        log.info('Db intialized');
    }

    async migrate() {
        log.info('Starting database migrations');
        await this._database.migrate({
            migrationsPath: './migrations'
        });
        log.info('Done migrating database');
    }

    async close() {
        if(this._database) {
            await this._database.close();
            this._database = undefined;
        }
    }

    get db() {
        if(this._database) {
            return this._database;
        } else {
            throw new Error('Trying to access database, but database not initialized!');
        }
    }
}

module.exports = new HanraDatabase();