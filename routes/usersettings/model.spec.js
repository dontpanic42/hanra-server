const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const sinon = require('sinon');
const HanraDatabase = require('../../database');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('UserSettings Model', () => {
    let testModel;
    let database;
    let testUserWithoutSettings;
    let testUserWithSettings;
    let db;
    beforeEach(async () => {
        database = new HanraDatabase('test');
    
        await database.initialize();
        await database.migrate();
    
        testModel = require('./model')(database);
    
        db = database.db;
        let r;
    
        // Create user 1
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-usersettings-model-spec-1--user")')
        testUserWithoutSettings = r.lastID;
        // Create user 2
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-usersettings-model-spec-2--user")')
        testUserWithSettings = r.lastID;
    
        r = await db.run(`INSERT INTO HanraUserSettings (ownerId) VALUES (${testUserWithSettings})`);
    });
    
    describe('when the user has no settings', () => {
        it('throws an error', async () => {
            await expect(testModel.getSettings(testUserWithoutSettings)).to.be.rejectedWith(Error);
        });
    });
    
    describe('when the user has settings', () => {
        it('returns settings', async () => {
            const settings = await testModel.getSettings(testUserWithSettings);
            expect(settings).to.be.an('object');
        });
    
        describe('the settings object', () => {
            let settings;
            beforeEach(async () => {
                settings = await testModel.getSettings(testUserWithSettings);
            });
    
            it('has a session size property', () => {
                expect(settings).to.have.property('srSessionSize').that.is.a('number');
            });
    
            it('has a new cards ratio property', () => {
                expect(settings).to.have.property('srSessionNewItemsRatio').that.is.a('number');
            });

            it('has a new cards cutoff date propery', () => {
                expect(settings).to.have.property('srSessionNewCutoffDays').that.is.a('number');
            });
        });
    });
});
