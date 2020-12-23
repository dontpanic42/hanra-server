const { expect } = require('chai');
const sinon = require('sinon');
const HanraDatabase = require('../../database');

describe('Cards Model', () => {
    let testModel;
    let testUser1;
    let testUser2;
    let set1;
    let set2;
    let db;
    let database;
    const NUM_CARDS_SET_1 = 20;
    const NUM_CARDS_SET_2 = 3;
    beforeEach(async () => {
        database = new HanraDatabase('test');
        
        await database.initialize();
        await database.migrate();
        
        testModel = require('./model')(database);
        
        db = database.db;
        let r;
        
        // Create user 1
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-card-model-spec-1--user")')
        testUser1 = r.lastID;
        // Create user 2
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-card-model-spec-2--user")')
        testUser2 = r.lastID;
        
        // Create set 1
        r = await db.run('INSERT INTO HanraSet (ownerId, setName) VALUES (1, "routes-card-model-spec-1--set")');
        set1 = r.lastID;
        // Create set 2
        r = await db.run('INSERT INTO HanraSet (ownerId, setName) VALUES (2, "routes-card-model-spec-2--set")');
        set2 = r.lastID;
        
        // Create some random cards
        for(let i = 0; i < NUM_CARDS_SET_1; i++) {
            await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
            (${testUser1}, ${set1}, 'test_q_${i}', 'test_a1_${i}', 'test_a2_${i}')`);
        }
        
        for(let i = 0; i < NUM_CARDS_SET_2; i++) {
            await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
            (${testUser2}, ${set2}, 'test_q_${i}', 'test_a1_${i}', 'test_a2_${i}')`);
        }
    });
    
    describe('updateCard', () => {
        let cardId;
        let getCard;
        let newq, newa1, newa2;
        beforeEach(async () => {
            const r = await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
            (${testUser1}, ${set1}, 'test_q_d', 'test_a1_d', 'test_a2_d')`);
            cardId = r.lastID;
            getCard = async () => {  return await db.get(`SELECT * FROM HanraCard WHERE id = ${cardId}`); };
            newq = 'question-foo';
            newa1 = 'answer1-foo';
            newa2 = 'answer2-foo';
        });
        
        describe('when the owner is correct', () => {
            let user;
            beforeEach(() => {
                user = testUser1;
            });
            
            describe('when updating the card', async () => {
                it('updates the values', async () => {
                    const r = await testModel.updateCard(user, cardId, newq, newa1, newa2);
                    
                    expect(r.numUpdated).to.equal(1);
                    
                    const c = await getCard();
                    
                    expect(c).to.have.property('question').that.equals(newq);
                    expect(c).to.have.property('answer_l1').that.equals(newa1);
                    expect(c).to.have.property('answer_l2').that.equals(newa2);
                });
            });
            
            describe('when the card does not exist', () => {
                let cardId;
                beforeEach(() => {
                    cardId = 9999;
                });            
                
                it('returns zero updated', async () => {
                    const r = await testModel.updateCard(user, cardId, newq, newa1, newa2);
                    
                    expect(r.numUpdated).to.equal(0);
                });
            });
        });
        
        describe('when the owner is not correct', () => {
            let user;
            beforeEach(() => {
                user = testUser2;
            });
            
            describe('when updating the card', async () => {
                it('does not update the values', async () => {
                    const r = await testModel.updateCard(user, cardId, newq, newa1, newa2);
                    
                    expect(r.numUpdated).to.equal(0);
                    
                    const c = await getCard();
                    
                    expect(c).to.have.property('question').that.not.equals(newq);
                    expect(c).to.have.property('answer_l1').that.not.equals(newa1);
                    expect(c).to.have.property('answer_l2').that.not.equals(newa2);
                });
            });
        });
    });
    
    describe('deleteCard', () => {
        let cardId;
        let getNumCards;
        let getCardIsPresent;
        beforeEach(async () => {
            const r = await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
            (${testUser1}, ${set1}, 'test_q_d', 'test_a1_d', 'test_a2_d')`);
            cardId = r.lastID;
            
            getNumCards = async () => {return (await db.get(`SELECT COUNT(*) as c FROM HanraCard`)).c;}
            getCardIsPresent = async () => {return (await db.get(`SELECT COUNT(*) as c FROM HanraCard WHERE id = ${cardId}`)).c == 1;}
        });
        
        describe('when the owner is correct', () => {
            it('deletes the given card', async () => {
                let numCardsBefore = await getNumCards();
                let r = await testModel.deleteCard(testUser1, cardId);
                let numCardsAfter = await getNumCards();
                let cardIsPresent = await getCardIsPresent();
                
                expect(numCardsAfter).to.equal(numCardsBefore - 1);
                expect(r.numDeleted).to.equal(1);
                expect(cardIsPresent).to.be.false;
            });
        });
        
        describe('when the owner is not correct', () => {
            it('does not delete the given card', async () => {
                let numCardsBefore = await getNumCards();
                let r = await testModel.deleteCard(testUser2, cardId);
                let numCardsAfter = await getNumCards();
                let cardIsPresent = await getCardIsPresent();
                
                expect(numCardsAfter).to.equal(numCardsBefore);
                expect(r.numDeleted).to.equal(0);
                expect(cardIsPresent).to.be.true;
            });
        });
        
        describe('when the card does not exist', () => {
            let cardId;
            beforeEach(() => {
                cardId = 99999999;
            });
            
            it('does not delete anything', async () => {
                let numCardsBefore = await getNumCards();
                let r = await testModel.deleteCard(testUser1, 9999);
                let numCardsAfter = await getNumCards();
                let cardIsPresent = await getCardIsPresent();
                
                expect(numCardsAfter).to.equal(numCardsBefore);
                expect(r.numDeleted).to.equal(0);
                expect(cardIsPresent).to.be.true;
            });
        });
    });
    
    describe('getAllCards', () => {
        describe('with query string part of question', () => {
            const QUERYSTRING = 'fooobar';
            
            beforeEach(async () => {
                await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
                (${testUser1}, ${set1}, 'test_${QUERYSTRING}q_x', 'test_a1_x', 'test_a2_x')`);
            });
            
            it('returns correct number of cards', async () => {
                const result = await testModel.getAllCards(testUser1, set1, QUERYSTRING, 0, 100);
                expect(result).to.have.property('cards').that.has.lengthOf(1);
            });
        });
        
        describe('with query string part of answer line 1', () => {
            const QUERYSTRING = 'fooobar';
            
            beforeEach(async () => {
                await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
                (${testUser1}, ${set1}, 'test_q_x', 'test_a1${QUERYSTRING}_x', 'test_a2_x')`);
            });
            
            it('returns correct number of cards', async () => {
                const result = await testModel.getAllCards(testUser1, set1, QUERYSTRING, 0, 100);
                expect(result).to.have.property('cards').that.has.lengthOf(1);
            });
        });
        
        describe('with query string part of answer line 2', () => {
            const QUERYSTRING = 'fooobar';
            
            beforeEach(async () => {
                await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
                (${testUser1}, ${set1}, 'test_q_x', 'test_a1_x', 'test_a2${QUERYSTRING}_x')`);
            });
            
            it('returns correct number of cards', async () => {
                const result = await testModel.getAllCards(testUser1, set1, QUERYSTRING, 0, 100);
                expect(result).to.have.property('cards').that.has.lengthOf(1);
            });
        });
        
        describe('with query string part of answer line 2', () => {
            it('returns no cards', async () => {
                const result = await testModel.getAllCards(testUser1, set1, 'blah-does-not-exist', 0, 100);
                expect(result).to.have.property('cards').that.has.lengthOf(0);
            });
        });
        
        describe('with empty query string', () => {
            it('returns a list of cards', async () => {
                const result = await testModel.getAllCards(testUser1, set1, '', 0, 100);
                expect(result).to.have.property('cards').that.has.lengthOf(NUM_CARDS_SET_1)
            });
            
            it('has only the expected fields in the cards fields', async () => {
                const result = await testModel.getAllCards(testUser1, set1, '', 0, 100);
                
                result.cards.forEach((card) => {
                    // Ensure that only the expected keys are there
                    expect(card).to.have.all.keys('id', 'owner', 'set', 'question', 'answerLine1', 'answerLine2');
                });
            });        
            
            it('has values in the cards fields', async () => {
                const result = await testModel.getAllCards(testUser1, set1, '', 0, 100);
                
                result.cards.forEach((card) => {
                    expect(card).to.have.property('id').that.is.a('number');
                    expect(card).to.have.property('owner').that.equals(testUser1);
                    expect(card).to.have.property('set').that.equals(set1);
                    expect(card).to.have.property('question').that.is.not.empty;
                    expect(card).to.have.property('answerLine1').that.is.not.empty;
                    expect(card).to.have.property('answerLine2').that.is.not.empty;
                });
            });
            
            describe('with only one page as result', () => {
                let result;
                let expectedPageSize;
                beforeEach(async () => {
                    expectedPageSize = NUM_CARDS_SET_1 + 10; 
                    result = await testModel.getAllCards(testUser1, set1, '', 0, expectedPageSize);
                });
                
                it('returns the correct page size', () => {
                    expect(result).to.have.property('pageSize').that.equals(expectedPageSize);
                });
                
                it('returns the correct page', () => {
                    expect(result)
                        .to.have.property('page')
                        .that.is.a('number')
                        .that.equals(0);
                });
                
                it('returns the number of pages', () => {
                    expect(result)
                        .to.have.property('numPages')
                        .that.is.a('number')
                        .that.equals(1);
                });
            });
            
            describe('with multiple pages as result', () => {
                let result;
                let expectedPageSize;
                let page;
                beforeEach(async () => {
                    expectedPageSize = 10; 
                    page = 1;
                    result = await testModel.getAllCards(testUser1, set1, '', page, expectedPageSize);
                });
                
                it('returns the correct page size', () => {
                    expect(result).to.have.property('pageSize').that.equals(expectedPageSize);
                });
                
                it('returns the correct page', () => {
                    expect(result).to.have.property('page').that.equals(page);
                });
                
                it('returns the number of pages', () => {
                    let expected = Math.ceil(NUM_CARDS_SET_1 / parseFloat(expectedPageSize));
                    expect(result)
                        .to.have.property('numPages')
                        .that.is.a('number')
                        .that.equals(expected);
                });

                it('returns the total number of cards', () => {
                    let expected = NUM_CARDS_SET_1;
                    expect(result)
                        .to.have.property('numCards')
                        .that.is.a('number')
                        .that.equals(expected);
                });
                
                it('returns the correct number of cards', () => {
                    expect(result)
                        .to.have.property('cards')
                        .that.has.lengthOf(expectedPageSize);
                });
                
                describe('when the page does not exist', () => {
                    beforeEach(async () => {
                        expectedPageSize = 10; 
                        page = 20;
                        result = await testModel.getAllCards(testUser1, set1, '', page, expectedPageSize);
                    });
                    
                    it('returns no cards', () => {
                        expect(result).to.have.property('cards').that.has.lengthOf(0);
                    });
                });
            });
        });
    });
    
    describe('countAllCards', () => {
        describe('with empty query string', () => {
            it('returns correct numItems', async () => {
                const result = await testModel.countAllCards(testUser1, set1, '');
                expect(result).to.equal(NUM_CARDS_SET_1);
            });
        });
        
        describe('with query string part of question', () => {
            const QUERYSTRING = 'fooobar';
            
            beforeEach(async () => {
                await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
                (${testUser1}, ${set1}, 'test_${QUERYSTRING}q_x', 'test_a1_x', 'test_a2_x')`);
            });
            
            it('returns correct numItems', async () => {
                const result = await testModel.countAllCards(testUser1, set1, QUERYSTRING);
                expect(result).to.equal(1);
            });
        });
        
        describe('with query string part of answer line 1', () => {
            const QUERYSTRING = 'fooobar';
            
            beforeEach(async () => {
                await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
                (${testUser1}, ${set1}, 'test_q_x', 'test_a1${QUERYSTRING}_x', 'test_a2_x')`);
            });
            
            it('returns correct numItems', async () => {
                const result = await testModel.countAllCards(testUser1, set1, QUERYSTRING);
                expect(result).to.equal(1);
            });
        });
        
        describe('with query string part of answer line 2', () => {
            const QUERYSTRING = 'fooobar';
            
            beforeEach(async () => {
                await db.run(`INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
                (${testUser1}, ${set1}, 'test_q_x', 'test_a1_x', 'test_a2${QUERYSTRING}_x')`);
            });
            
            it('returns correct numItems', async () => {
                const result = await testModel.countAllCards(testUser1, set1, QUERYSTRING);
                expect(result).to.equal(1);
            });
        });
    });

    describe('createCard', () => {
        let question;
        let answer1;
        let answer2;
        let result;
        beforeEach(async () => {
            question = 'question' + Math.random();
            answer1 = 'a1' + Math.random();
            answer2 = 'a2' + Math.random();
            result = await testModel.createCard(testUser1, set1, question, answer1, answer2)
        });

        it('returns the card id', () => {
            expect(result)
                .to.be.an('object')
                .that.has.property('cardId')
                .that.is.a('number');
        });

        describe('the created card', () => {
            let card;
            beforeEach(async () => {
                card = await db.get(`SELECT * FROM HanraCard WHERE id = ${result.cardId}`);
            });

            it('contains the question', () => {
                expect(card)
                    .to.be.an('object')
                    .that.has.property('question')
                    .that.equals(question);
            });

            it('contains the answer 1', () => {
                expect(card)
                    .to.be.an('object')
                    .that.has.property('answer_l1')
                    .that.equals(answer1);
            });

            it('contains the answer 2', () => {
                expect(card)
                    .to.be.an('object')
                    .that.has.property('answer_l2')
                    .that.equals(answer2);
            });
        });
    });
})