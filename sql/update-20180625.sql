-- UPDATE: 2018-06-25
--  * ADDS INVOICES TABLE

CREATE TABLE IF NOT EXISTS invoices (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    invoice_id VARCHAR(32) UNIQUE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    code VARCHAR(6) NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry TIMESTAMPTZ, 
    status_code NUMBER(2) NOT NULL,
    status_desc VARCHAR(32) NOT NULL,
    payor_id UUID NOT NULL,
    CONSTRAINT pk_invoice PRIMARY KEY (id),
    CONSTRAINT fk_purchase_user FOREIGN KEY (payor_id) REFERENCES users(id),
);