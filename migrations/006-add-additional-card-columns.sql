--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

-- Here we just add a new column "createdAt" to the HanraSRItem table
-- this is a bigger problem, since sqlite only accepts constant default
-- values with ALTER TABLE. Since we want a dynamic timestamp by default,
-- we need to copy the table into a new one (with the target format) and
-- then delete the old one and rename the new one...

-- Create a new table in the target format

-- PRAGMA foreign_keys = OFF;

-- Add new columns for new items
ALTER TABLE HanraCard ADD COLUMN answerMeasurePinyin    TEXT;
ALTER TABLE HanraCard ADD COLUMN answerMeasureHanzi     TEXT;
ALTER TABLE HanraCard ADD COLUMN answerExample          TEXT;

-- Rename existing columns so that this table doesn't become an
-- unmanageable mess
ALTER TABLE HanraCard RENAME COLUMN answer_l1 TO answerWordPinyin;
ALTER TABLE HanraCard RENAME COLUMN answer_l2 TO answerWordHanzi;

-- CREATE TABLE HanraCardNew (
--     id                      INTEGER PRIMARY KEY,
--     ownerId                 INTEGER NOT NULL,
--     setId                   INTEGER NOT NULL,
--     question                TEXT NOT NULL,
--     answerWordPinyin        TEXT NOT NULL,
--     answerWordHanzi         TEXT NOT NULL,
--     answerMeasurePinyin    TEXT,
--     answerMeasureHanzi     TEXT,
--     answerExample           TEXT,
--     createdAt               DATETIME DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT HanraCards_fk_ownerId FOREIGN KEY (ownerId)
--         REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE,
--     CONSTRAINT HanraCards_fk_setId FOREIGN KEY (setId)
--         REFERENCES HanraSet (id) ON UPDATE CASCADE ON DELETE CASCADE
-- );

-- -- Copy all the data from the 'old' table into the new table
-- INSERT INTO 
--     HanraCardNew (
--         id,
--         ownerId,
--         setId,
--         question,
--         answerWordPinyin,
--         answerWordHanzi,
--         createdAt
--     )
-- SELECT
--     id,
--     ownerId,
--     setId,
--     question,
--     answer_l1,
--     answer_l2,
--     createdAt
-- FROM
--     HanraCard;

-- -- Delete the old table
-- DROP TABLE HanraCard;

-- -- Rename the new table to the old table's name
-- ALTER TABLE HanraCardNew RENAME TO HanraCard;

-- PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

-- Cannot really downmigrate added columns - would need to copy & recreate the
-- card table, but that instead would cascade deletes to SR Item etc., so we'll
-- just undo the rename and live with the unused columns
ALTER TABLE HanraCard RENAME COLUMN answerWordPinyin    TO answer_l1;
ALTER TABLE HanraCard RENAME COLUMN answerWordHanzi     TO answer_l2;


-- PRAGMA foreign_keys = OFF;

-- -- Create a new table in the target format
-- CREATE TABLE HanraCardNew (
--     id          INTEGER PRIMARY KEY,
--     ownerId     INTEGER NOT NULL,
--     setId       INTEGER NOT NULL,
--     question    TEXT NOT NULL,
--     answer_l1   TEXT NOT NULL,
--     answer_l2   TEXT NOT NULL,
--     createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT HanraCards_fk_ownerId FOREIGN KEY (ownerId)
--         REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE,
--     CONSTRAINT HanraCards_fk_setId FOREIGN KEY (setId)
--         REFERENCES HanraSet (id) ON UPDATE CASCADE ON DELETE CASCADE
-- );

-- -- Copy all the data from the 'old' table into the new table
-- INSERT INTO 
--     HanraCardNew (
--         id,
--         ownerId,
--         setId,
--         question,
--         answer_l1,
--         answer_l2,
--         createdAt
--     )
-- SELECT
--     id,
--     ownerId,
--     setId,
--     question,
--     answerWordPinyin,
--     answerWordHanzi,
--     createdAt
-- FROM
--     HanraCard;
    
-- -- Delete the old table
-- DROP TABLE HanraCard;

-- -- Rename the new table to the old table's name
-- ALTER TABLE HanraCardNew RENAME TO HanraCard;

-- PRAGMA foreign_keys = ON;