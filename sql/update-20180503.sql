-- 2018-05-03 UPDATE

CREATE TABLE IF NOT EXISTS asset_quote (
    id UUID NOT NULL DEFAULT uuid_generate_v4(), -- THE UNIQUE IDENTIFIER FOR THE QUOTE
    asset_id UUID NOT NULL, -- THE ASSET BEING QUOTED
    from_code VARCHAR(12) NOT NULL, -- THE CODE OF THE CURRENCY AGAINST WHICH THE QUOTE WAS SECURED
    rate NUMERIC(20, 7) NOT NULL, -- THE RATE WHICH WAS ESTABLISHED
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE DATE THE QUOTE WAS CREATED
    expiry TIMESTAMPTZ NOT NULL, -- THE TIME WHEN THE OFFER WILL EXPIRE
    CONSTRAINT pk_asset_quote PRIMARY KEY (id),
    CONSTRAINT fk_asset_quote_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT ck_asset_quote_expiry CHECK (expiry > creation_time)
);

-- ADD PO BOX
ALTER TABLE users ADD COLUMN po_box VARCHAR(36);
ALTER TABLE invitations ADD COLUMN po_box VARCHAR(36);

-- IDENTIFIES THE APPLICATION GRANT TYPES WHICH ARE PERMITTED FOR AN APPLICATION
CREATE TABLE IF NOT EXISTS application_grant_type (
    application_id UUID NOT NULL, -- THE APPLICATION TO WHICH THE GRANT TYPE APPLIES
    grant_type VARCHAR(32) NOT NULL, -- THE GRANT TYPE WHICH THE APPLICATION IS ALLOWED TO HAVE
    CONSTRAINT pk_application_grant_type PRIMARY KEY (application_id, grant_type),
    CONSTRAINT pk_application_grant_type_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT ck_application_grant_type CHECK (grant_type IN ('password', 'authorization_code', 'refresh', 'client_credentials'))
);
