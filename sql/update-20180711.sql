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
    transaction_id UUID,
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    CONSTRAINT pk_service_invoice PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES users(id),
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS services (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(20, 7) NOT NULL,
    code VARCHAR(256) NOT NULL,
    info VARCHAR(256),
    asset_id UUID NOT NULL,
    created_by UUID NOT NULL,
    service_invoice_id UUID NOT NULL,
    CONSTRAINT pk_service_id PRIMARY KEY (id),
    CONSTRAINT fk_service_invoice FOREIGN KEY (service_invoice_id) REFERENCES service_invoices(id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id)
)

INSERT INTO permission_sets (id, name, description, created_by) VALUES ('3b0bc9c5-3a4a-4903-ade5-f140519d917e', 'invoice', 'Access to the INVOICE resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '3b0bc9c5-3a4a-4903-ade5-f140519d917e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('044894bd-084e-47bb-9428-dbd80277614a', '3b0bc9c5-3a4a-4903-ade5-f140519d917e', 15);
