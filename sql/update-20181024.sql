-- UPDATE: 2018-10-24
-- Fix to build link between offerings and assets

ALTER TABLE offerings DROP CONSTRAINT fk_offerings_currency;

ALTER TABLE offerings 
    RENAME COLUMN currency_id TO asset_id;

ALTER TABLE offerings 
   ADD CONSTRAINT fk_offerings_assets
   FOREIGN KEY (asset_id) 
   REFERENCES assets(id);