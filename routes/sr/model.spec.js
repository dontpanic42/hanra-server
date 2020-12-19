const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const HanraDatabase = require('../../database');
const SRModel = require('./model');

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const NUM_CARDS_SET = 20;

describe('SRSession Model', () => {
    let testModel;
    let database;
    let testUser;
    let testSet;
    let settings;
    let db;
    let cardIds;
    beforeEach(async () => {
        database = new HanraDatabase('test');
    
        await database.initialize();
        await database.migrate();
    
        testModel = new SRModel(database);
    
        db = database.db;
        let r;
    
        // Create user 1
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-usersettings-model-spec-1--user")')
        testUser = r.lastID;

        // Create set 1
        r = await db.run(`INSERT INTO HanraSet (ownerId, setName) VALUES (${testUser}, "routes-card-model-spec-1--set")`);
        testSet = r.lastID;

        // Create some cards
        cardIds = [];
        for(let i = 0; i < NUM_CARDS_SET; i++) {
            r = await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
            (${testUser}, ${testSet}, 'test_q_${i}', 'test_a1_${i}', 'test_a2_${i}')`);
            cardIds.push(r.lastID);
        }

        // Setup settings stub
        settings = {};
    });

    describe('getSession', () => {            
        let newCards;
        let revCards;
        let settings;
        let stub;
        let result;
        beforeEach(() => {
            settings = {
                srSessionSize: 10,
                srSessionNewItemsRatio: 0.25
            }
        });

        describe('when there are enough new and review cards', () => {
            beforeEach(async () => {
                // Important: Arrays need to have distinct values so we can 
                // check the mixture of old and new in the suite below
                newCards = [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12];
                revCards = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

                stub = sinon.stub(testModel, 'getSessionCards');
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.NEW)
                    .resolves(newCards);
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.REVIEW)
                    .resolves(revCards);

                result = await testModel.getSession(0, 0, settings);
            });

            it('calls getSessionCards twice', () => {
                expect(stub).to.have.been.calledTwice;
            });

            it('calls getSessionCards with type new', () => {
                expect(stub).to.have.been.calledWith(0, 0, settings, SRModel.SESSION_CARD_TYPE.NEW);
            });

            it('calls getSessionCards with type review', () => {
                expect(stub).to.have.been.calledWith(0, 0, settings, SRModel.SESSION_CARD_TYPE.REVIEW);
            });

            describe('the result', () => {
                // returns the number of items that are in cards as well
                // as in result
                const countCardsIn = (result, cards) => {
                    return cards.reduce((prev, cur) => {
                        return prev += (result.indexOf(cur) == -1)? 0 : 1;
                    }, 0);
                }
                it('contains the correct total amount of cards', () => {
                    expect(result).to.have.lengthOf(settings.srSessionSize);
                });

                it('contains the correct amount of new cards', () => {
                    let expectedNumNew = 3;
                    let actualNumNew = countCardsIn(result, newCards);
                    expect(actualNumNew).to.equal(expectedNumNew);
                });

                it('contains the correct amount of review cards', () => {
                    let expectedNumNew = 7;
                    let actualNumNew = countCardsIn(result, revCards);
                    expect(actualNumNew).to.equal(expectedNumNew);
                });
            });
        });

        describe('when there are not enough new cards', () => {
            beforeEach(async () => {
                // Important: Arrays need to have distinct values so we can 
                // check the mixture of old and new in the suite below
                newCards = [ 0];
                revCards = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

                stub = sinon.stub(testModel, 'getSessionCards');
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.NEW)
                    .resolves(newCards);
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.REVIEW)
                    .resolves(revCards);

                result = await testModel.getSession(0, 0, settings);
            });

            describe('the result', () => {
                // returns the number of items that are in cards as well
                // as in result
                const countCardsIn = (result, cards) => {
                    return cards.reduce((prev, cur) => {
                        return prev += (result.indexOf(cur) == -1)? 0 : 1;
                    }, 0);
                }
                it('still contains the correct total amount of cards', () => {
                    expect(result).to.have.lengthOf(settings.srSessionSize);
                });

                it('contains the correct amount of new cards', () => {
                    let expectedNumNew = 1;
                    let actualNumNew = countCardsIn(result, newCards);
                    expect(actualNumNew).to.equal(expectedNumNew);
                });

                it('is filled to the session size with review cards', () => {
                    let expectedNumNew = 9;
                    let actualNumNew = countCardsIn(result, revCards);
                    expect(actualNumNew).to.equal(expectedNumNew);
                });
            });
        });

        describe('when there are not enough review cards', () => {
            beforeEach(async () => {
                // Important: Arrays need to have distinct values so we can 
                // check the mixture of old and new in the suite below
                newCards = [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12];
                revCards = [13, 14];

                stub = sinon.stub(testModel, 'getSessionCards');
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.NEW)
                    .resolves(newCards);
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.REVIEW)
                    .resolves(revCards);

                result = await testModel.getSession(0, 0, settings);
            });

            describe('the result', () => {
                // returns the number of items that are in cards as well
                // as in result
                const countCardsIn = (result, cards) => {
                    return cards.reduce((prev, cur) => {
                        return prev += (result.indexOf(cur) == -1)? 0 : 1;
                    }, 0);
                }
                it('still contains the correct total amount of cards', () => {
                    expect(result).to.have.lengthOf(settings.srSessionSize);
                });

                it('contains the correct amount of review cards', () => {
                    let expectedNumRev = 2;
                    let actualNumRev = countCardsIn(result, revCards);
                    expect(actualNumRev).to.equal(expectedNumRev);
                });

                it('is filled to the session size with new cards', () => {
                    let expectedNumNew = 8;
                    let actualNumNew = countCardsIn(result, newCards);
                    expect(actualNumNew).to.equal(expectedNumNew);
                });
            });
        });

        describe('when there are neither enough review cards nor new cards', () => {
            beforeEach(async () => {
                // Important: Arrays need to have distinct values so we can 
                // check the mixture of old and new in the suite below
                // This is the worst case, there are neither enough review
                // nor old cards, but there are more new then old (and there are
                // more new cards than the ratio calls for)
                newCards = [ 0,  1, 2, 3, 4, 5];
                revCards = [13, 14];

                stub = sinon.stub(testModel, 'getSessionCards');
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.NEW)
                    .resolves(newCards);
                stub
                    .withArgs(0, 0, settings, SRModel.SESSION_CARD_TYPE.REVIEW)
                    .resolves(revCards);

                result = await testModel.getSession(0, 0, settings);
            });

            describe('the result', () => {
                // returns the number of items that are in cards as well
                // as in result
                const countCardsIn = (result, cards) => {
                    return cards.reduce((prev, cur) => {
                        return prev += (result.indexOf(cur) == -1)? 0 : 1;
                    }, 0);
                }
                it('contains the maximum number of cards possible', () => {
                    expect(result).to.have.lengthOf(newCards.length + revCards.length);
                });

                it('contains the maximum amount of new cards', () => {
                    let expectedNumNew = newCards.length;
                    let actualNumNew = countCardsIn(result, newCards);
                    expect(actualNumNew).to.equal(expectedNumNew);
                });

                it('contains the maximum amount of review cards', () => {
                    let expectedNumRev = revCards.length;
                    let actualNumRev = countCardsIn(result, revCards);
                    expect(actualNumRev).to.equal(expectedNumRev);
                });
            });
        });
    });

    describe('getSessionCards', () => {
        let settings;
        let createCard;
        let createSRItem;
        let userId;
        let setId;
        beforeEach(async () => {
            userId = setId = 1;

            settings = {
                srSessionSize: 10,
                srSessionNewCutoffDays: 2
            }

            // If foreign_key constraints are enabled, this should also 
            // delete all SRItems
            await db.run('DELETE FROM HanraCard');

            createCard = async () => {
                const r = await db.run(`
                INSERT INTO 
                    HanraCard (ownerId, setId, question, answer_l1, answer_l2) 
                VALUES 
                    (${userId}, ${setId}, "a", "b", "c")
                `);

                return r.lastID;
            }

            createSRItem = async (card, type) => {
                let myDate = new Date();
                let nowDate = new Date();
                if(type === 'old') {
                    myDate.setDate(myDate.getDate() - (settings.srSessionNewCutoffDays + 1))
                }

                const r = await db.run(`
                INSERT INTO 
                    HanraSRItem (ownerId, cardId, difficulty, daysBetweenReview, lastPerformanceRating, dateLastReviewed, createdAt) 
                VALUES 
                    (${userId}, ${card}, 0.0, 0.0, 0.0, :lastReviewed, :createdAt)
                `, {
                    ':lastReviewed': nowDate.toISOString(),
                    ':createdAt': myDate.toISOString()
                });

                return r.lastID;
            }
        });

        describe('when requesting cards for which no SRItem exists', () => {
            let numRevCardsWithSRI;
            let numCardsWithoutSRI;
            let newCards;
            let revCards;

            beforeEach(async () => {
                numRevCardsWithSRI = 3;
                numCardsWithoutSRI = 4;
                newCards = [];
                revCards = [];

                // Create some 'old' cards that have an sritem
                for(let i = 0; i < numRevCardsWithSRI; i++) {
                    let c = await createCard();
                    await createSRItem(c, 'old');
                    revCards.push(c);
                }

                for(let i = 0; i < numCardsWithoutSRI; i++) {
                    let c = await createCard();
                    newCards.push(c);
                }
            });

            describe('when requesting new cards', () => {
                beforeEach(async () => {
                    type = SRModel.SESSION_CARD_TYPE.NEW;
                    result = await testModel.getSessionCards(userId, setId, settings, type);
                });

                it('returns the correct number of cards', () => {
                    expect(result).to.have.lengthOf(numCardsWithoutSRI);
                });

                describe('the result', () => {
                    it('contains only the cards without SRI', () => {
                        expect(result.every((e) => {
                            return newCards.indexOf(e.id) != -1;
                        })).to.be.true;
                    });

                    it('has only cards with type property set to new', () => {
                        for(let i = 0; i < result.length; i++) {
                            expect(result[i]).to.be.an('object')
                                .that.has.a.property('type')
                                .that.equals(SRModel.SESSION_CARD_TYPE.NEW);
                        }
                    });
                });
            });

            describe('when requesting rev cards', () => {
                beforeEach(async () => {
                    type = SRModel.SESSION_CARD_TYPE.REVIEW;
                    result = await testModel.getSessionCards(userId, setId, settings, type);
                });

                it('returns the correct number of cards', () => {
                    expect(result).to.have.lengthOf(numRevCardsWithSRI);
                });

                describe('the result', () => {
                    it('contains only the old cards with SRI', () => {
                        expect(result.every((e) => {
                            return revCards.indexOf(e.id) != -1;
                        })).to.be.true;
                    });

                    it('has only cards with type property set to review', () => {
                        for(let i = 0; i < result.length; i++) {
                            expect(result[i]).to.be.an('object')
                                .that.has.a.property('type')
                                .that.equals(SRModel.SESSION_CARD_TYPE.REVIEW);
                        }
                    });
                });
            });
        });

        describe('when requesting cards for which an SRItem exists', () => {
            let numNewCards;
            let numRevCards;
            let newCards;
            let revCards;
            let type;
            let result;
            beforeEach(async () => {
                // New cards + old cards should be below session
                // size for this test, to ensure that the correct result
                // is not just ranom chance. 
                numNewCards = 3;
                numRevCards = 6;
                newCards = [];
                revCards = [];

                // Create some new cards
                for(let i = 0; i < numNewCards; i++) {
                    let c = await createCard();
                    await createSRItem(c, 'new');
                    newCards.push(c);
                }

                // Create some rev cards
                for(let i = 0; i < numRevCards; i++) {
                    let c = await createCard();
                    await createSRItem(c, 'old');
                    revCards.push(c);
                }
            });

            describe('when requesting new cards', () => {
                beforeEach(async () => {
                    type = SRModel.SESSION_CARD_TYPE.NEW;
                    result = await testModel.getSessionCards(userId, setId, settings, type);
                });

                it('returns the correct number of cards', () => {
                    expect(result).to.have.lengthOf(numNewCards);
                });

                it('returns only new cards', () => {
                    expect(result.every((e) => {
                        return newCards.indexOf(e.id) != -1;
                    })).to.be.true;
                });
            });

            describe('when requesting rev cards', () => {
                beforeEach(async () => {
                    type = SRModel.SESSION_CARD_TYPE.REVIEW;
                    result = await testModel.getSessionCards(userId, setId, settings, type);
                });

                it('returns the correct number of cards', () => {
                    expect(result).to.have.lengthOf(numRevCards);
                });

                it('returns only rev cards', () => {
                    expect(result.every((e) => {
                        return revCards.indexOf(e.id) != -1;
                    })).to.be.true;
                });
            })
        });
    });

    describe('upsertSRI', () => {

        describe('when the card was never learned', () => {
            let cardId;
            beforeEach(() => {
                // Grab a 'random' card id
                cardId = cardIds[Math.round(NUM_CARDS_SET / 2)];
            });

            it('does not have an SRItem', async () => {
                const r = await db.get(`SELECT * FROM HanraSRItem WHERE id = ${cardId}`);
                expect(r).to.be.undefined;
            });

            describe('when upsertSRI is called on the card', () => {
                describe('when the card was correct', () => {
                    beforeEach(async () => {
                        await testModel.upsertSRI(testUser, cardId, 1.0);
                    });
    
                    it('creates an SRItem', async () => {
                        const r = await db.get(`SELECT * FROM HanraSRItem WHERE cardId = ${cardId}`);
                        expect(r).to.be.an('object').that.has.property('difficulty');
                    });
    
                    describe('the SRItem that was created', () => {
                        let item;
                        beforeEach(async () => {
                            item = await db.get(`SELECT * FROM HanraSRItem WHERE cardId = ${cardId}`);
                        });
    
                        it('has a difficulty lower than the default', () => {
                            expect(item).to.have.property('difficulty').that.is.below(SRModel.DEFAULT_DIFFICULTY)
                        });
                    });
                });

                describe('when the card was not correct', () => {
                    beforeEach(async () => {
                        await testModel.upsertSRI(testUser, cardId, 0.0);
                    });
    
                    it('creates an SRItem', async () => {
                        const r = await db.get(`SELECT * FROM HanraSRItem WHERE cardId = ${cardId}`);
                        expect(r).to.be.an('object').that.has.property('difficulty');
                    });
    
                    describe('the SRItem that was created', () => {
                        let item;
                        beforeEach(async () => {
                            item = await db.get(`SELECT * FROM HanraSRItem WHERE cardId = ${cardId}`);
                        });
    
                        it('has a difficulty lower than the default', () => {
                            expect(item).to.have.property('difficulty').that.is.above(SRModel.DEFAULT_DIFFICULTY)
                        });
                    });
                });
            });
        });
    });
});
