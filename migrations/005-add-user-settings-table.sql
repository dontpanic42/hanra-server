--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE HanraUserSettings (
    id          INTEGER PRIMARY KEY,
    ownerId     INTEGER NOT NULL,

    -- SR Item settings
    srSessionSize           INTEGER DEFAULT 20,
    srSessionNewItemsRatio  DOUBLE  DEFAULT 0.25,
    srSessionNewCutoffDays  INTEGER DEFAULT 14,

    CONSTRAINT HanraCards_fk_ownerId FOREIGN KEY (ownerId)
        REFERENCES HanraUser (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create unique index for us to be able to upsert without knowing the id
CREATE UNIQUE INDEX idx_unique_userettings ON HanraUserSettings (ownerId);

-- Create default entries for our two default users.
INSERT INTO HanraUserSettings (ownerId) VALUES (1);
INSERT INTO HanraUserSettings (ownerId) VALUES (2);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE HanraUserSettings;
