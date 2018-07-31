INSERT INTO GROUPS(id, name, created_by) VALUES ('a219447e-70a0-415c-b681-7a21ce80bffb', 'PROVIDERS', '3c673456-23b1-4263-9deb-df46770852c9');

CREATE TABLE IF NOT EXISTS care_relationships (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    status varchar(256) NOT NULL,
    completion_time TIMESTAMPTZ,
    user_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    CONSTRAINT pk_care_relationship PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES users(id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS care_plans (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    info VARCHAR(256),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    completion_time TIMESTAMPTZ,
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    care_relationship_id UUID NOT NULL,
    CONSTRAINT pk_care_plan PRIMARY KEY (id),
    CONSTRAINT fk_care_relationship FOREIGN KEY (care_relationship_id) REFERENCES care_relationships(id),
    CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_care_plan_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS care_services (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(20, 7) NOT NULL,
    code VARCHAR(256) NOT NULL,
    info VARCHAR(256),
    asset_id UUID NOT NULL,
    created_by UUID NOT NULL,
    care_plan_id UUID NOT NULL,
    CONSTRAINT pk_care_service_id PRIMARY KEY (id),
    CONSTRAINT fk_care_plan FOREIGN KEY (care_plan_id) REFERENCES care_plans(id),
    CONSTRAINT fk_care_service_created_by FOREIGN KEY (created_by) REFERENCES users(id)
)

INSERT INTO permission_sets (id, name, description, created_by) VALUES ('3b0bc9c5-3a4a-4903-ade5-f140519d917e', 'invoice', 'Access to the INVOICE resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '3b0bc9c5-3a4a-4903-ade5-f140519d917e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('044894bd-084e-47bb-9428-dbd80277614a', '3b0bc9c5-3a4a-4903-ade5-f140519d917e', 15);
