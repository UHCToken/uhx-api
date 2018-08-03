-- UPDATE: 2018-07-23
--  * ADDS PROVIDER TABLES

CREATE TABLE IF NOT EXISTS providers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(256) NOT NULL,
    description VARCHAR(256),
    tel VARCHAR(256),
    fax VARCHAR(256),
    email VARCHAR(256),
    profile_image VARCHAR(75),
    visible BOOLEAN DEFAULT TRUE,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ,
    deactivation_time TIMESTAMPTZ,
    CONSTRAINT pk_provider PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS provider_addresses (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    address_name VARCHAR(256) NOT NULL,
    tel VARCHAR(256),
    fax VARCHAR(256),
    street VARCHAR(256),
    unit_suite VARCHAR(128),
    city VARCHAR(256),
    state_prov VARCHAR(16),
    country VARCHAR(2),
    postal_zip VARCHAR(16) NOT NULL,
    provider_id UUID NOT NULL,
    visible BOOLEAN DEFAULT TRUE,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ,
    deactivation_time TIMESTAMPTZ,
    CONSTRAINT pk_provider_address PRIMARY KEY (id),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS service_types (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    type_name VARCHAR(128) NOT NULL,
    description VARCHAR(256),
    deactivation_time TIMESTAMPTZ,
    CONSTRAINT pk_service_type PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS provider_types (
    provider_id UUID NOT NULL,
    service_type UUID NOT NULL,
    CONSTRAINT pk_provider_service_type PRIMARY KEY (provider_id, service_type),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_provider_service_type FOREIGN KEY (service_type) REFERENCES service_types(id)
);

CREATE TABLE IF NOT EXISTS provider_address_types (
    provider_address_id UUID NOT NULL,
    service_type UUID NOT NULL,
    CONSTRAINT pk_provider_address_service_type PRIMARY KEY (provider_address_id, service_type),
    CONSTRAINT fk_provider FOREIGN KEY (provider_address_id) REFERENCES provider_addresses(id),
    CONSTRAINT fk_provider_address_service_type FOREIGN KEY (service_type) REFERENCES service_types(id)
);

CREATE TABLE IF NOT EXISTS provider_address_services (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL,
    address_id UUID NOT NULL,
    service_type UUID NOT NULL,
    service_name VARCHAR(128) NOT NULL,
    description VARCHAR(256) NOT NULL,
    cost NUMERIC(20, 7) NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ,
    deactivation_time TIMESTAMPTZ,
    CONSTRAINT pk_provider_service PRIMARY KEY (id),
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id),
    CONSTRAINT fk_provider_address FOREIGN KEY (address_id) REFERENCES provider_addresses(id),
    CONSTRAINT fk_provider_service_type FOREIGN KEY (service_type) REFERENCES service_types(id)
);

INSERT INTO service_types (type_name) VALUES 
    ('Family Doctor'),
    ('Chiropractor'),
    ('Dentist');

INSERT INTO groups (id, name, created_by) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', 'Providers', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO groups (id, name, created_by) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', 'Patients', '3c673456-23b1-4263-9deb-df46770852c9');