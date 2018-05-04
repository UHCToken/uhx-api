-- UPDATE: 2018-04-27
--  * ADDS TFA_METHOD TO USER TABLE
--  * ADDS TIMESTAMP INFO TO WALLETS TABLE
--  * CREATES CONTRACT TABLE

CREATE TABLE tfa_methods (
    id NUMERIC(2) NOT NULL,
    name VARCHAR(32) UNIQUE NOT NULL,
    moduleName VARCHAR(256) NOT NULL, -- THE NAME OF THE MODULE WHICH HANDLES THE TFA MECHANISM
    display VARCHAR(256) NOT NULL, -- THE DISPLAY NAME OF THE TFA METHOD
    CONSTRAINT pk_tfa_methods PRIMARY KEY (id)
);

INSERT INTO tfa_methods (id, name, moduleName, display) VALUES (1, 'sms', './tfa/SmsTfaMechansim', 'Send me a Text Message');
INSERT INTO tfa_methods (id, name, moduleName, display) VALUES (2, 'email', './tfa/EmailTfaMechansim', 'Send me an E-Mail');

-- ALTER TABLE USERS TO USE TFA METHOD
ALTER TABLE users ADD COLUMN tfa_method NUMERIC(2);

-- ADD TIMESTAMP DATA TO WALLETS
ALTER TABLE wallets ADD COLUMN creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE wallets ADD COLUMN updated_time TIMESTAMPTZ;
ALTER TABLE wallets ADD COLUMN deactivation_time TIMESTAMPTZ;