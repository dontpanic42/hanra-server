--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

-- Forgot to initially enable foreign key constraints when opening the db
-- (sqlite defaults to 'off'!), so we need to do some cleanup on the db...

DELETE FROM 
    HanraSRItem 
WHERE 
    NOT EXISTS (
        SELECT 
            * 
        FROM 
            HanraCard 
        WHERE 
            HanraCard.id = HanraSRItem.cardId
    )

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

-- cannot down migrate since it's a delete only migration