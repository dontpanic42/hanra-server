--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE HanraUser (
    id          INTEGER PRIMARY KEY,
    userName    TEXT    NOT NULL
);


CREATE TABLE HanraSet (
    id              INTEGER PRIMARY KEY,
    ownerId         INTEGER NOT NULL,
    setName         TEXT    NOT NULL,
    setDescription  TEXT,

    CONSTRAINT HanraSet_fk_ownerId FOREIGN KEY (ownerId)
        REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE HanraCard (
    id          INTEGER PRIMARY KEY,
    ownerId     INTEGER NOT NULL,
    setId       INTEGER NOT NULL,
    question    TEXT NOT NULL,
    answer_l1   TEXT NOT NULL,
    answer_l2   TEXT NOT NULL,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT HanraCards_fk_ownerId FOREIGN KEY (ownerId)
        REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT HanraCards_fk_setId FOREIGN KEY (setId)
        REFERENCES HanraSet (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE HanraSRItem (
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

-- Create unique index on ownerId and cardId so we can do 'INSERT OR REPLACE INTO...'
CREATE UNIQUE INDEX idx_unique_sri ON HanraSRItem (ownerId, cardId);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE HanraSRItem;
DROP TABLE HanraCard;
DROP TABLE HanraSet;
DROP TABLE HanraUser;