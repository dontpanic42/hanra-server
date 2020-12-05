--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------


-- Users -----------------------------------------------------------------------
INSERT INTO HanraUser (userName) VALUES ('Default User');
INSERT INTO HanraUser (userName) VALUES ('User 2');

-- Sets ------------------------------------------------------------------------
INSERT INTO HanraSet (ownerId, setName, setDescription) VALUES (1, 'Wörter', 'Einzelne Vokabeln aus dem Kurs');
INSERT INTO HanraSet (ownerId, setName, setDescription) VALUES (1, 'Sätze', 'Wichtige Schlüsselsätze');

-- Cards -----------------------------------------------------------------------
-- Example Words
INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
    (1, 1, 'Lernen', 'xuéxí', '学习'),
    (1, 1, 'Foo', 'antwort 1', 'antwort 2'),
    (1, 1, 'Lieben', 'aì', '爱');

-- Example Sentences
INSERT INTO HanraCard (ownerId, setId, question, answer_l1, answer_l2) VALUES
    (1, 2, 'Ich liebe dich.', 'wǒ aí nǐ', '我爱你'),
    (1, 2, 'Es freut mich dich kennen zu lernen.', 'rènshi nǐ wǒ hěn gāoxing', '认识你我很高兴');

-- SRItems ---------------------------------------------------------------------

INSERT INTO HanraSRItem (ownerId, cardId, difficulty, daysBetweenReview, lastPerformanceRating) VALUES 
    (1, 1, 0.3, 3, 0.6),
    (1, 2, 0.3, 3, 0.6);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------