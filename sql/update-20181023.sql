-- UPDATE: 2018-10-23
-- Fix to build link between chat rooms and patients/providers
-- Cast of authorId to UUID in chat_message
-- author_types to indicate message source in chat_message

ALTER TABLE chat_room
    ALTER COLUMN providerId TYPE uuid
	USING providerid::uuid;

ALTER TABLE chat_room 
    RENAME COLUMN providerId TO provider_id;

ALTER TABLE chat_room 
   ADD CONSTRAINT fk_provider_id
   FOREIGN KEY (provider_id) 
   REFERENCES providers(id);

ALTER TABLE chat_room
    ALTER COLUMN patientId TYPE uuid
	USING patientid::uuid;

ALTER TABLE chat_room 
    RENAME COLUMN patientId TO patient_id;

ALTER TABLE chat_room 
   ADD CONSTRAINT fk_patient_id
   FOREIGN KEY (patient_id) 
   REFERENCES patients(id);

ALTER TABLE chat_message
    ALTER COLUMN authorId TYPE uuid
	USING authorid::uuid;

ALTER TABLE chat_message 
    RENAME COLUMN authorId TO author_id;

CREATE TABLE IF NOT EXISTS author_types (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type_name varchar(256) NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_author_types PRIMARY KEY (id)
);

INSERT INTO author_types 
    (id, type_name, creation_time)
VALUES 
    ('862da58f-ac55-4c2d-8e0a-55f43affd844', 'patient', CURRENT_TIMESTAMP);

INSERT INTO author_types 
    (id, type_name, creation_time) 
VALUES 
    ('371ab4f7-641d-4c4a-9b33-cf3b31ee1a9c', 'provider', CURRENT_TIMESTAMP);

ALTER TABLE chat_message ADD COLUMN author_type_id uuid;

ALTER TABLE chat_message 
   ADD CONSTRAINT fk_author_type
   FOREIGN KEY (author_type_id) 
   REFERENCES author_types(id);