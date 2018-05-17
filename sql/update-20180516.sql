-- TYPES OF TRANSACTIONS MADE 
CREATE TABLE IF NOT EXISTS transaction_type (
    id NUMERIC(1) NOT NULL,
    code VARCHAR(8) NOT NULL, 
    description VARCHAR(48) NOT NULL,
    CONSTRAINT pk_transaction_type PRIMARY KEY (id)
);

INSERT INTO transaction_type (id, code, description) VALUES (1, 'PAYMENT', 'Payment from one user to another');
INSERT INTO transaction_type (id, code, description) VALUES (2, 'PURCHASE', 'Payment made in a FIAT for an asset');
INSERT INTO transaction_type (id, code, description) VALUES (3, 'TRUST', 'A change of trust has been completed');
INSERT INTO transaction_type (id, code, description) VALUES (4, 'REFUND', 'A refund is being made to a user');
INSERT INTO transaction_type (id, code, description) VALUES (5, 'DEPOSIT', 'A deposit was made to the user');
INSERT INTO transaction_type (id, code, description) VALUES (6, 'MANAGE', 'Account management function');
INSERT INTO transaction_type (id, code, description) VALUES (7, 'AIRDROP', 'An air-drop from the distributor');

-- SEQUENCE ID
CREATE SEQUENCE transactions_seq_id START WITH 1 INCREMENT BY 1;

-- A SUPPLEMENTAL TRANSACTION RECORD WHICH RECORDS ADDITIONAL INFORMATION
-- ABOUT THE TRANSFER OF FUNDS MADE BY THIS API ONTO THOSE TRANSACTIONS
-- MADE BY THE BLOCKCHAIN
CREATE TABLE IF NOT EXISTS transactions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    payor_wallet_id UUID NOT NULL, -- THE WALLET WHICH MADE THE PAYMENT
    payee_wallet_id UUID NOT NULL, -- THE WALLET OF THE PAYEE
    type_id NUMERIC(1) NOT NULL, -- THE TYPE OF TRANSACTION THIS REALLY REPRESENTS
    batch_id UUID NOT NULL DEFAULT uuid_generate_v4(), -- IF THIS TRANSACTION IS PART OF A LARGER TRANSACTION
    memo VARCHAR(28), -- A TEXTUAL MEMO THAT WAS CREATED
    ref VARCHAR(256), -- A REFERENCE WHICH POINTS TO THE SOURCE OF THE TRANSACTION EITHER ON THE BLOCKCHAIN OR IN FIAT
    escrow VARCHAR(256), -- IF THE FUNDS WERE PLACED INTO ESCROW, THEN THE ESCROW ACCOUNT INFORMATION FROM THE BLOCKCHAIN
    escrow_time INTERVAL NOT NULL DEFAULT '0 DAY'::INTERVAL, -- IF IN ESCROW WHAT IS THE HOLD ON THESE FUNDS?
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THE PURCHASE WAS RECORDED
    created_by UUID NOT NULL, -- THE USER THAT CREATED THE PURCHASE, COULD BE A USER OR AN ADMINISTRATOR WHO IS RECORDING AN AIRDROP
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    transaction_time TIMESTAMPTZ, -- THE TIME THE TRANSACTION ACTUALLY WAS PROCESSED
    seq_id NUMERIC(20) UNIQUE NOT NULL DEFAULT nextval('transactions_seq_id'),
    CONSTRAINT pk_transaction PRIMARY KEY (id),
    CONSTRAINT fk_transaction_payor_id FOREIGN KEY (payor_wallet_id) REFERENCES wallets(id),
    CONSTRAINT fk_transaction_payee_wallet_id FOREIGN KEY (payee_wallet_id) REFERENCES wallets(id),
    CONSTRAINT fk_transaction_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_transaction_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_transaction_type FOREIGN KEY (type_id) REFERENCES transaction_type(id),
    CONSTRAINT ck_transaction_updated CHECK (updated_time IS NULL AND updated_by IS NULL OR updated_by IS NOT NULL AND updated_time IS NOT NULL)
);

CREATE INDEX idx_transactions_batch ON transactions(batch_id);

-- MIGRATE PURHCASES AS TRANSACTIONS
INSERT INTO transactions (id, payor_wallet_id, payee_wallet_id, type_id, memo, ref, escrow, escrow_time, creation_time, created_by, transaction_time)
    SELECT purchase.id, dist_wallet_id, wallets.id, 2, memo, ref, escrow, escrow_time, purchase.creation_time, created_by, transaction_time
    FROM
        purchase
        INNER JOIN users ON (user_id = users.id)
        INNER JOIN wallets ON (wallet_id = wallets.id);
ALTER TABLE purchase DROP COLUMN ref;
ALTER TABLE purchase DROP COLUMN escrow;
ALTER TABLE purchase DROP COLUMN escrow_time;
ALTER TABLE purchase DROP COLUMN memo;

ALTER TABLE purchase ADD CONSTRAINT fk_purchase_transaction_id FOREIGN KEY (id) REFERENCES transactions(id);

CREATE INDEX transaction_id_sha_idx ON transactions(digest(id::text, 'sha256'));
CREATE INDEX transaction_batch_id_sha_idx ON transactions(digest(batch_id::text, 'sha256'));
