-- UPDATE: 2018-10-23
-- Fix to build link between chat rooms and patients/providers

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