ALTER TABLE asset_offer DROP CONSTRAINT ck_asset_sale_sell;
ALTER TABLE asset_offer ADD CONSTRAINT ck_asset_sale_sell CHECK (stop_date IS NULL OR stop_date > start_date)