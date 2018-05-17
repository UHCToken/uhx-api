-- STATES THAT A PURCHASE CAN BE UNDER
CREATE TABLE IF NOT EXISTS purchase_state (
    id NUMERIC(1) NOT NULL,
    code VARCHAR(8) NOT NULL UNIQUE,
    description VARCHAR(32) NOT NULL,
    CONSTRAINT pk_purchase_state PRIMARY KEY (id)
);

INSERT INTO purchase_state (id, code, description) VALUES (1, 'NEW', 'New / Uncharged');
INSERT INTO purchase_state (id, code, description) VALUES (2, 'COMPLETE', 'Completed');
INSERT INTO purchase_state (id, code, description) VALUES (3, 'CANCEL', 'Cancelled');
INSERT INTO purchase_state (id, code, description) VALUES (4, 'REJECT', 'Rejected');
INSERT INTO purchase_state (id, code, description) VALUES (5, 'HOLD', 'On-Hold');
INSERT INTO purchase_state (id, code, description) VALUES (6, 'ACTIVE', 'Active');

-- CREATES THE FIAT PURCHASE TABLE
-- NB: THIS TABLE IS USED FOR TRACKING FUNDS RECEIVED AND TOKENS DISTRIBUTED
CREATE TABLE IF NOT EXISTS purchase (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- THE USER WHICH MADE THE PURCHASE
    quote_id UUID NOT NULL, -- THE QUOTE THAT WAS USED AS THE BASIS FOR THIS TRANSACTION
    charge_amount NUMERIC(20, 7) NOT NULL, -- THE AMOUNT IN charge_currency THAT WAS RECEIVED
    charge_currency VARCHAR(6) NOT NULL, -- THE CURRENCY IN WHICH charge_amount IS EXPRESSED
    asset_id UUID NOT NULL, -- THE ASSET THAT WAS PURCHASED
    dist_wallet_id UUID, -- THE WALLET WHICH WAS ASSETS WERE DISTRIBUTED FROM
    amount NUMERIC(20, 7) NOT NULL, -- THE AMOUNT OF ASSETS THAT WERE TRANSFERRED TO THE ACCOUNT
    memo VARCHAR(28), -- A TEXTUAL MEMO THAT WAS CREATED
    ref VARCHAR(256), -- A REFERENCE WHICH POINTS TO THE SOURCE OF THE TRANSACTION EITHER ON THE BLOCKCHAIN OR IN FIAT
    escrow VARCHAR(256), -- IF THE FUNDS WERE PLACED INTO ESCROW, THEN THE ESCROW ACCOUNT INFORMATION FROM THE BLOCKCHAIN
    escrow_time INTERVAL NOT NULL DEFAULT '0 DAY'::INTERVAL, -- IF IN ESCROW WHAT IS THE HOLD ON THESE FUNDS?
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THE PURCHASE WAS RECORDED
    created_by UUID NOT NULL, -- THE USER THAT CREATED THE PURCHASE, COULD BE A USER OR AN ADMINISTRATOR WHO IS RECORDING AN AIRDROP
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    transaction_time TIMESTAMPTZ, -- THE TIME THE TRANSACTION ACTUALLY WAS PROCESSED
    state NUMERIC(1) NOT NULL,
    CONSTRAINT pk_purchase PRIMARY KEY (id),
    CONSTRAINT fk_purchase_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_purchase_quote FOREIGN KEY (quote_id) REFERENCES asset_quote(id),
    CONSTRAINT fk_purchase_state FOREIGN KEY (state) REFERENCES purchase_state(id),
    CONSTRAINT fk_purchase_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_purchase_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT ck_purchase_updated CHECK (updated_time IS NULL AND updated_by IS NULL OR updated_by IS NOT NULL AND updated_time IS NOT NULL)
);
