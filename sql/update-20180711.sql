INSERT INTO GROUPS(id, name, created_by) VALUES ('a219447e-70a0-415c-b681-7a21ce80bffb', 'PROVIDERS', '3c673456-23b1-4263-9deb-df46770852c9');

CREATE TABLE IF NOT EXISTS care_relationships (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    status varchar(256) NOT NULL,
    completion_time TIMESTAMPTZ,
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    CONSTRAINT pk_care_relationship PRIMARY KEY (id),
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_invoice_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS care_plans (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    info VARCHAR(256),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    total numeric(20,7) NOT NULL,
    completion_time TIMESTAMPTZ,
    updated_time TIMESTAMPTZ, 
    updated_by UUID,
    care_relationship_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    status varchar(256) NOT NULL,
    CONSTRAINT pk_care_plan PRIMARY KEY (id),
    CONSTRAINT fk_care_relationship FOREIGN KEY (care_relationship_id) REFERENCES care_relationships(id),
    CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_asset_id FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_care_plan_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS care_services (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(20, 7) NOT NULL,
    code VARCHAR(256) NOT NULL,
    name VARCHAR(256),
    info VARCHAR(256),
    created_by UUID NOT NULL,
    care_plan_id UUID NOT NULL,
    CONSTRAINT pk_care_service_id PRIMARY KEY (id),
    CONSTRAINT fk_care_plan FOREIGN KEY (care_plan_id) REFERENCES care_plans(id),
    CONSTRAINT fk_care_service_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);
