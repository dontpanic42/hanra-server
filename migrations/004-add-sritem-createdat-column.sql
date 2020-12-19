--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

-- Here we just add a new column "createdAt" to the HanraSRItem table
-- this is a bigger problem, since sqlite only accepts constant default
-- values with ALTER TABLE. Since we want a dynamic timestamp by default,
-- we need to copy the table into a new one (with the target format) and
-- then delete the old one and rename the new one...

-- Create a new table in the target format

PRAGMA foreign_keys = OFF;

CREATE TABLE HanraSRItemNew (
    id                      INTEGER PRIMARY KEY,
    ownerId                 INTEGER NOT NULL,
    cardId                  INTEGER NOT NULL,
    difficulty              DOUBLE NOT NULL,
    daysBetweenReview       DOUBLE NOT NULL,
    lastPerformanceRating   DOUBLE NOT NULL,
    dateLastReviewed        DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- This is the actaully new column
    createdAt               DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT HanraSRItem_fk_ownerId FOREIGN KEY (ownerId)
        REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT HanraSRItem_fk_cardId FOREIGN KEY (cardId)
        REFERENCES HanraCard (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Copy all the data from the 'old' table into the new table
INSERT INTO 
    HanraSRItemNew (
        ownerId,
        cardId,
        difficulty,
        daysBetweenReview,
        lastPerformanceRating,
        dateLastReviewed
    )
SELECT
    ownerId,
    cardId,
    difficulty,
    daysBetweenReview,
    lastPerformanceRating,
    dateLastReviewed
FROM
    HanraSRItem;

-- Delete the old table
DROP TABLE HanraSRItem;

-- Rename the new table to the old table's name
ALTER TABLE HanraSRItemNew RENAME TO HanraSRItem;

-- Re-create unique index on ownerId and cardId so we can do 'INSERT OR REPLACE INTO...'
CREATE UNIQUE INDEX idx_unique_sri ON HanraSRItem (ownerId, cardId);

-- For existing SRitems, copy the card creation date to the SRItem
UPDATE
    HanraSRItem
SET
    createdAt = (
        SELECT
            createdAt
        FROM
            HanraCard
        WHERE
            id = HanraSRItem.cardId
    );

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

PRAGMA foreign_keys = OFF;

-- Create a new table in the target format
CREATE TABLE HanraSRItemNew (
    id                      INTEGER PRIMARY KEY,
    ownerId                 INTEGER NOT NULL,
    cardId                  INTEGER NOT NULL,
    difficulty              DOUBLE NOT NULL,
    daysBetweenReview       DOUBLE NOT NULL,
    lastPerformanceRating   DOUBLE NOT NULL,
    dateLastReviewed        DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT HanraSRItem_fk_ownerId FOREIGN KEY (ownerId)
        REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT HanraSRItem_fk_cardId FOREIGN KEY (cardId)
        REFERENCES HanraCard (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Copy all the data from the 'old' table into the new table
INSERT INTO 
    HanraSRItemNew (
        ownerId,
        cardId,
        difficulty,
        daysBetweenReview,
        lastPerformanceRating,
        dateLastReviewed
    )
SELECT
    ownerId,
    cardId,
    difficulty,
    daysBetweenReview,
    lastPerformanceRating,
    dateLastReviewed
FROM
    HanraSRItem;
    
-- Delete the old table
DROP TABLE HanraSRItem;

-- Rename the new table to the old table's name
ALTER TABLE HanraSRItemNew RENAME TO HanraSRItem;

-- Re-create unique index on ownerId and cardId so we can do 'INSERT OR REPLACE INTO...'
CREATE UNIQUE INDEX idx_unique_sri ON HanraSRItem (ownerId, cardId);

PRAGMA foreign_keys = ON;