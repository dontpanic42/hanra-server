const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const sinon = require('sinon');
const HanraDatabase = require('../../database');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Random Model', () => {
    let testModel;
    let database;
    let testUser;
    let testSet;
    let newCardIds;
    let oldCardIds;
    let testSettings;
    let model;
    let NUM_NEW_CARDS_SET;
    let NUM_OLD_CARDS_SET;
    let db;
    beforeEach(async () => {
        database = new HanraDatabase('test');
    
        await database.initialize();
        await database.migrate();
    
        model = require('./model');
        testModel = new model(database);
    
        db = database.db;
        let r;

        // Create user 1
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-usersettings-model-spec-1--user")')
        testUser = r.lastID;

        // Create set 1
        r = await db.run(`INSERT INTO HanraSet (ownerId, setName) VALUES (${testUser}, "routes-card-model-spec-1--set")`);
        testSet = r.lastID;

        testSettings = { srSessionNewCutoffDays: 2 };

        // Create some cards
        NUM_NEW_CARDS_SET = 3;
        newCardIds = [];
        for(let i = 0; i < NUM_NEW_CARDS_SET; i++) {
            r = await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
            (${testUser}, ${testSet}, 'test_q_${i}', 'test_a1_${i}', 'test_a2_${i}')`);
            newCardIds.push(r.lastID);
        }

        NUM_OLD_CARDS_SET = 10;
        oldCardIds = [];
        for(let i = 0; i < NUM_OLD_CARDS_SET; i++) {
            r = await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2, createdAt) VALUES
            (${testUser}, ${testSet}, 'test_q_${i}', 'test_a1_${i}', 'test_a2_${i}', datetime('now','-5 day','localtime'))`);
            oldCardIds.push(r.lastID);
        }
    });

    describe('getRandomCard', () => {

        describe('when calling without type', async () => {
            let results;

            beforeEach(async () => {
                
                results = [];
                for(let i = 0; i < 20; i++) {
                    const card = await testModel.getRandomCard(testUser, testSet, testSettings);
                    results.push(card.id);
                }
            });

            describe('the resulting objects', () => {
                let numOldCards;
                let numNewCards;

                beforeEach(() => {
                    numNewCards = results.reduce((prev, cur) => {
                        return (newCardIds.indexOf(cur) !== -1)? prev + 1 : prev;
                    }, 0);

                    numOldCards = results.reduce((prev, cur) => {
                        return (oldCardIds.indexOf(cur) !== -1)? prev + 1 : prev;
                    }, 0);
                });

                it('contains old cards', () => {
                    expect(numOldCards).to.be.greaterThan(0);
                });

                it('contains new cards', () => {
                    expect(numNewCards).to.be.greaterThan(0);
                });
            });
        });

        describe('when calling with type "ALL"', async () => {
            let results;

            beforeEach(async () => {
                
                results = [];
                for(let i = 0; i < 20; i++) {
                    const card = await testModel.getRandomCard(testUser, testSet, testSettings, model.RANDOM_CARD_TYPE.ALL);
                    results.push(card.id);
                }
            });

            describe('the resulting objects', () => {
                let numOldCards;
                let numNewCards;

                beforeEach(() => {
                    numNewCards = results.reduce((prev, cur) => {
                        return (newCardIds.indexOf(cur) !== -1)? prev + 1 : prev;
                    }, 0);

                    numOldCards = results.reduce((prev, cur) => {
                        return (oldCardIds.indexOf(cur) !== -1)? prev + 1 : prev;
                    }, 0);
                });

                it('contains old cards', () => {
                    expect(numOldCards).to.be.greaterThan(0);
                });

                it('contains new cards', () => {
                    expect(numNewCards).to.be.greaterThan(0);
                });
            });
        });

        describe('when calling with type "NEW"', async () => {
            let results;

            beforeEach(async () => {
                
                results = [];
                for(let i = 0; i < 20; i++) {
                    const card = await testModel.getRandomCard(testUser, testSet, testSettings, model.RANDOM_CARD_TYPE.NEW);
                    if(card) {
                        results.push(card.id);
                    }
                }
            });

            describe('the resulting objects', () => {
                let numOldCards;
                let numNewCards;

                beforeEach(() => {
                    numNewCards = results.reduce((prev, cur) => {
                        return (newCardIds.indexOf(cur) !== -1)? prev + 1 : prev;
                    }, 0);

                    numOldCards = results.reduce((prev, cur) => {
                        return (oldCardIds.indexOf(cur) !== -1)? prev + 1 : prev;
                    }, 0);
                });

                it('contains no old cards', () => {
                    expect(numOldCards).to.equal(0);
                });

                it('contains new cards', () => {
                    expect(numNewCards).to.be.greaterThan(0);
                });
            });
        });
    });
});