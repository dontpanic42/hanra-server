const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const sinon = require('sinon');
const HanraDatabase = require('../../database');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Set Model', () => {
    let testModel;
    let database;
    let testUser;
    let db;
    beforeEach(async () => {
        database = new HanraDatabase('test');
    
        await database.initialize();
        await database.migrate();
    
        testModel = require('./model')(database);
    
        db = database.db;
        let r;
    
        // Create user 1
        r = await db.run('INSERT INTO HanraUser (userName) VALUES ("routes-set-model-spec-1--user")')
        testUser = r.lastID;
    });

    describe('createSet', () => {
        describe('when setName and setDescription are given', () => {
            let setName;
            let setDescription;
            let result;
            beforeEach(async () => {
                setName = 'foo' + Math.random();
                setDescription = 'bar' + Math.random();
                result = await testModel.createSet(testUser, setName, setDescription);
            });

            it('returns the id of the new set', () => {
                expect(result).to.be.an('object')
                    .that.has.property('setId')
                    .that.is.a('number');
            });

            describe('the new set', () => {
                let set;
                beforeEach(async () => {
                    set = await db.get(`SELECT * FROM HanraSet WHERE id = ${result.setId}`);
                });

                it('exists', () => {
                    expect(set).to.be.an('object').that.is.not.undefined;
                });

                it('contains the setName', () => {
                    expect(set).to.have.property('setName').that.equals(setName);
                });

                it('contains the setDescription', () => {
                    expect(set).to.have.property('setDescription').that.equals(setDescription);
                });
            });
        });

        describe('when only setName is given', () => {
            let setName;
            let setDescription;
            let result;
            beforeEach(async () => {
                setName = 'foo' + Math.random();
                result = await testModel.createSet(testUser, setName);
            });

            describe('the new set', () => {
                let set;
                beforeEach(async () => {
                    set = await db.get(`SELECT * FROM HanraSet WHERE id = ${result.setId}`);
                });

                it('exists', () => {
                    expect(set).to.be.an('object').that.is.not.undefined;
                });

                it('contains the setName', () => {
                    expect(set).to.have.property('setName').that.equals(setName);
                });

                it('does not contain a value for setDescription', () => {
                    expect(set.setDescription).to.be.null;
                });
            });
        });
    });
});