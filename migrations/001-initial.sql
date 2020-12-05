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

    CONSTRAINT HanraCards_fk_ownerId FOREIGN KEY (ownerId)
        REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT HanraCards_fk_setId FOREIGN KEY (setId)
        REFERENCES HanraSet (id) ON UPDATE CASCADE ON DELETE CASCADE
)

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE HanraCard;
DROP TABLE HanraSet;
DROP TABLE HanraUser;