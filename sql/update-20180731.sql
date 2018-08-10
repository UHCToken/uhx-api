CREATE TABLE IF NOT EXISTS patients (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(256),
    description VARCHAR(256),
    tel VARCHAR(256),
    fax VARCHAR(256),
    email VARCHAR(256),
    profile_image VARCHAR(75),
    visible BOOLEAN DEFAULT TRUE,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMPTZ,
    deactivation_time TIMESTAMPTZ,
    CONSTRAINT pk_patient PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);