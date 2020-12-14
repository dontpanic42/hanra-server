
const db = require('sqlite');
const sqlite3 = require('sqlite3');
const log = require('log4js').getLogger('db');

const DEFAULT_DATABASE_FILE = './hanra.db';
const DEFAULT_DATABASE_MIGRATIONS = './migrations';
const IN_MEMORY_DATABASE_FILE = ':memory:'

class HanraDatabase {
    constructor() {
        // When unit testing, use an in-memory database
        if(process.env.NODE_ENV === 'test') {
            log.warn('*** RUNNING WITH IN-MEMORY DB! USE FOR TESTING ONLY! ***');
            this._databaseFilename = IN_MEMORY_DATABASE_FILE;
         } else {
            this._databaseFilename = process.env.HANRA_DB_FILE ? process.env.HANRA_DB_FILE : DEFAULT_DATABASE_FILE;
        }
        this._database = undefined;
    }

    async initialize() {

        // Check for re-initialization
        if(this._database) {
            await this.close();
        }

        log.info('Opening database');
        this._database = await db.open({
            filename: this._databaseFilename,
            driver: sqlite3.Database
        });

        // WTF sqlite does not enable foreign key constraints
        // by default, leading to unused entries all over the db...!
        this._database.exec('PRAGMA foreign_keys=1')

        // log.info('Starting db migrations')
        // db.migrate({force: 'last'});
        log.info('Db intialized');
    }

    async migrate(migrations = DEFAULT_DATABASE_MIGRATIONS) {
        log.info('Starting database migrations');
        await this._database.migrate({
            migrationsPath: migrations
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