INSERT INTO GROUPS(id, name, created_by) VALUES ('a219447e-70a0-415c-b681-7a21ce80bffb', 'PROVIDERS', '3c673456-23b1-4263-9deb-df46770852c9');

CREATE TABLE IF NOT EXISTS service_invoices (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    amount NUMERIC(20, 7) NOT NULL,
    info VARCHAR(256),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    completion_time TIMESTAMPTZ,
    expiry TIMESTAMPTZ,
    user_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    CONSTRAINT pk_service_invoice PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES users(id),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);