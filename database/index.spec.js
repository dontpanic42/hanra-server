const { expect } = require('chai');
const sinon = require('sinon');
const database = require('./index');

beforeEach(async () => {
    await database.initialize();
    await database.migrate();
});

describe('database configuration', () => {
    describe('foreign key constraints', () => {
        // By default, sqlite disables foreign key constraints. This leads to 
        // cascading updates/deletes not working. This should ALWAYS be enabled
        it('is enabled', async () => {
            const r = await database.db.get('PRAGMA foreign_keys');
            expect(r).to.have.property('foreign_keys').that.equals(1);
        });
    });
});