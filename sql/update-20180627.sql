-- UPDATE: 2018-06-27
--  * ADDS INVOICES TABLE
--  * ADDS BALANCES TABLE

CREATE TABLE IF NOT EXISTS invoices (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    invoice_id VARCHAR(32) UNIQUE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    code VARCHAR(6) NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry TIMESTAMPTZ, 
    status_code NUMERIC(2) NOT NULL,
    status_desc VARCHAR(32) NOT NULL,
    payor_id UUID NOT NULL,
    CONSTRAINT pk_invoice PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (payor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS balances (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid UNIQUE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    currency VARCHAR(6) NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivation_time TIMESTAMPTZ, 
    CONSTRAINT pk_balances PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO wallet_network VALUES (3, 'BITCOIN', 'btc');