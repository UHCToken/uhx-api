/**
 * Universal Health Coin Database
 * Copyright (C) 2018, Universal Health Coin
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Original Authors: Justin Fyfe (justin-fyfe), Rory Yendt (RoryYendt)
 * Original Date: 2018-04-20
 * 
 * This file contains the primary schema for the UHC API
 * 
 */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS wallets(
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	address varchar(256) NOT NULL,
	seed varchar(256) NOT NULL,	
    CONSTRAINT pk_wallets PRIMARY KEY (id)
);

-- REPRESENTS AN INDIVIDUAL WHO USES THE UHC SERVICE
-- TODO: DETERMINE WHICH OF THESE FIELDS ARE MANDATORY
CREATE TABLE IF NOT EXISTS users(
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	name VARCHAR(256) UNIQUE NOT NULL,
	password VARCHAR(256) NOT NULL,
	invalid_login INT NOT NULL DEFAULT 0,
	last_login TIMESTAMPTZ,
	lockout TIMESTAMPTZ, -- THE TIME THAT THE ACCOUNT IS LOCKED UNTIL
	email VARCHAR(256),
	email_verified BOOLEAN NOT NULL DEFAULT FALSE,
	given_name VARCHAR(256),
	family_name VARCHAR(256),
	description VARCHAR(256),
	tel VARCHAR(256),
	tel_verified BOOLEAN NOT NULL DEFAULT FALSE,
	street VARCHAR(256),
	unit_suite VARCHAR(128),
	city VARCHAR(256),
	state_prov VARCHAR(16),
	country VARCHAR(2),
	postal_zip VARCHAR(16),
	wallet_id uuid,
	creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_time TIMESTAMPTZ,
	deactivation_time TIMESTAMPTZ,
	CONSTRAINT pk_users PRIMARY KEY (id),
	CONSTRAINT fk_users_wallets FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- REPRESENTS A USER INVITATION TO JOIN THE SERVICE
CREATE TABLE IF NOT EXISTS invitations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email VARCHAR(256) NOT NULL, -- THE E-MAIL ADDRESS OF THE invitee
    given_name VARCHAR(256),
    family_name VARCHAR(256),
    tel VARCHAR(256),
	street VARCHAR(256),
	unit_suite VARCHAR(128),
	city VARCHAR(256),
	state_prov VARCHAR(16),
	country VARCHAR(2),
	postal_zip VARCHAR(16),
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL, 
	expiration_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP + '7 DAY'::INTERVAL,
    claim_token VARCHAR(256) UNIQUE NOT NULL, -- THE TOKEN TO CLAIM
    claim_time TIMESTAMPTZ, -- THE TIME THAT THE INVITE WAS CONSUMED
    deactivation_time TIMESTAMPTZ, -- THE TIME THE INVITATION WAS RESCINDED
    signup_user_id UUID, 
    CONSTRAINT pk_invitations PRIMARY KEY (id),
    CONSTRAINT fk_invitations_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_invitations_signup_user FOREIGN KEY (signup_user_id) REFERENCES users(id)
);

-- INVITATION EMAIL INDEX
CREATE UNIQUE INDEX ix_invitations_email ON invitations(email) WHERE deactivation_time IS NULL;

-- REPRESENTS CLAIMS ABOUT A USER
CREATE TABLE IF NOT EXISTS user_claims(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    claim_type VARCHAR(256) NOT NULL, -- THE TYPE OF CLAIM EXAMPLE: FACEBOOK AUTH, RESET TOKEN
    claim_value VARCHAR(256) NOT NULL, -- THE VALUE OF THE CLAIM
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry TIMESTAMPTZ, -- WHEN PRESENT THE EXPIRATION OF THIS CLAIM
    user_id uuid NOT NULL, -- THE USER TO WHICH THE CLAIM BELONGS
    CONSTRAINT pk_user_claims PRIMARY KEY (id),
    CONSTRAINT fk_user_claims_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX user_claim_name_value_idx ON user_claims(user_id, claim_type) WHERE expiry IS NULL;


-- REPRESENTS CLAIMS ABOUT A USER
CREATE TABLE IF NOT EXISTS invitation_claims(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    claim_type VARCHAR(256) NOT NULL, -- THE TYPE OF CLAIM EXAMPLE: FACEBOOK AUTH, RESET TOKEN
    claim_value VARCHAR(256) NOT NULL, -- THE VALUE OF THE CLAIM
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry TIMESTAMPTZ, -- WHEN PRESENT THE EXPIRATION OF THIS CLAIM
    invitation_id uuid NOT NULL, -- THE USER TO WHICH THE CLAIM BELONGS
    CONSTRAINT pk_invitation_claims PRIMARY KEY (id),
    CONSTRAINT fk_invitation_claims_user FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);

CREATE UNIQUE INDEX invitation_claim_name_value_idx ON invitation_claims(invitation_id, claim_type) WHERE expiry IS NULL;

-- REPRESENTS EXTERNAL IDENTITIES 
CREATE TABLE IF NOT EXISTS user_identity (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    provider VARCHAR(256) NOT NULL, -- THE PROVIDER (FACEBOOK, GOOGLE, IDENTITYMIND, ETC)
    key VARCHAR(256) NOT NULL,  -- THE KEY THAT THE EXTERNAL PROVIDER KNOWS THE USER AS
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THAT THE OBJECT WAS CREATED
    user_id uuid NOT NULL, -- THE USER TO WHICH THE IDENTITY BELONGS
    CONSTRAINT pk_user_identity PRIMARY KEY (id),
    CONSTRAINT fk_user_identity_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- GROUPS OF USERS
CREATE TABLE IF NOT EXISTS groups (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(16) NOT NULL, -- THE NAME OF THE GROUP
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THAT THE OBJECT WAS CREATED
    created_by UUID NOT NULL, -- THE USER WHICH CREATED THE GROUP
    updated_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS UPDATED
    updated_by UUID, -- THE USER WHICH UPDATED THE OBJECT
    deactivation_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS DEACTIVATED
    deactivated_by UUID, -- THE USER WHICH DEACTIVATED THE OBJECT
    CONSTRAINT pk_group PRIMARY KEY (id),
    CONSTRAINT fk_group_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_group_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_group_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id)
);

-- USER <> GROUP ASSOCIATION
CREATE TABLE IF NOT EXISTS user_group (
    user_id UUID NOT NULL,
    group_id UUID NOT NULL,
    CONSTRAINT pk_user_group PRIMARY KEY (user_id, group_id),
    CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_group_group FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- REPRESENTS A SET OF PERMISSIONS THAT CAN BE APPLIED
CREATE TABLE IF NOT EXISTS permission_sets (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(256) UNIQUE NOT NULL,  -- A UNIQUE NAME FOR THE PERMISSION SET
    description TEXT,  -- THE DESCRIPTION OF THE PERMISSION SET
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THAT THE OBJECT WAS CREATED
    created_by UUID NOT NULL, -- THE USER WHICH CREATED THE GROUP
    updated_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS UPDATED
    updated_by UUID, -- THE USER WHICH UPDATED THE OBJECT
    deactivation_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS DEACTIVATED
    deactivated_by UUID, -- THE USER WHICH DEACTIVATED THE OBJECT
    CONSTRAINT pk_permission PRIMARY KEY (id),
    CONSTRAINT fk_permission_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_permission_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_permission_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id)
);

-- ASSOCIATES GROUPS TO PERMISSION SETS
CREATE TABLE IF NOT EXISTS group_permissions (
    group_id UUID NOT NULL, 
    permission_set_id UUID NOT NULL, -- THE PERMISSION SET
    acl_flags INT NOT NULL DEFAULT 0, -- REPRESENTS THE ACL FLAGS (THESE ARE UNIX STYLE)
    CONSTRAINT pk_group_permission PRIMARY KEY (group_id, permission_set_id),
    CONSTRAINT fk_group_permission_group FOREIGN KEY (group_id) REFERENCES groups(id),
    CONSTRAINT fk_group_permission_permission_set FOREIGN KEY (permission_set_id) REFERENCES permission_sets(id)
);

-- REPRESENTS OAUTH APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id UUID NOT NULL DEFAULT uuid_generate_v4(), 
    name VARCHAR(256) UNIQUE NOT NULL, -- REPRESENTS THE NAME OF THE APPLICATION
    secret VARCHAR(256) NOT NULL, -- REPRESENTS THE APPLICATION SECRET
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THAT THE OBJECT WAS CREATED
    invalid_login INT NOT NULL DEFAULT 0,
    last_login TIMESTAMPTZ,
    lockout TIMESTAMPTZ, -- THE TIME THAT THE ACCOUNT IS LOCKED UNTIL
    created_by UUID NOT NULL, -- THE USER WHICH CREATED THE GROUP
    updated_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS UPDATED
    updated_by UUID, -- THE USER WHICH UPDATED THE OBJECT
    deactivation_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS DEACTIVATED
    deactivated_by UUID, -- THE USER WHICH DEACTIVATED THE OBJECT
    CONSTRAINT pk_application PRIMARY KEY (id),
    CONSTRAINT fk_application_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_application_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_application_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id)    
);

-- ASSOCIATES APPLICATIONS TO THEIR PERMISSIONS
CREATE TABLE IF NOT EXISTS application_permissions (
    application_id UUID NOT NULL, 
    permission_set_id UUID NOT NULL, -- THE PERMISSION SET
    acl_flags INT NOT NULL DEFAULT 0, -- REPRESENTS THE ACL FLAGS (THESE ARE UNIX STYLE)
    client_only BOOLEAN NOT NULL DEFAULT FALSE, -- WHEN TRUE INDICATES THAT A CLIENT_GRANT CAN ACCESS THIS
    CONSTRAINT pk_application_permission PRIMARY KEY (application_id, permission_set_id),
    CONSTRAINT fk_application_permission_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT fk_application_permission_permission_set FOREIGN KEY (permission_set_id) REFERENCES permission_sets(id)
);

-- ASSOCIATES AN APPLICATION WITH A USER AND THE PERMISSION THEY GRANT TO THAT APPLICATION
CREATE TABLE IF NOT EXISTS application_user_consent (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    user_id UUID NOT NULL,
    permission_set_id UUID NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rescinded_time TIMESTAMPTZ,
    CONSTRAINT pk_application_user_consent PRIMARY KEY (id),
    CONSTRAINT fk_application_user_consent_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT fk_application_user_consent_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_application_user_consent_permission FOREIGN KEY (permission_set_id) REFERENCES permission_sets(id)
);

-- REPRESENTS A SINGLE SESSION - A SESSION IS A COMBINATION OF A USER USING AN APPLICATION 
CREATE TABLE IF NOT EXISTS sessions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, 
    application_id UUID NOT NULL,
    not_before TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THE SESSION STARTED
    not_after TIMESTAMPTZ NOT NULL, -- THE EXPIRATION TIME (NOT AFTER) OF THE SESSION
    scope VARCHAR(256) NOT NULL,
    refresh_token VARCHAR(256), -- IF THE SESSION CAN BE EXTENDED AUTOMATICALLY, THE REFRESH TOKEN TO USE
    ip_addr VARCHAR(256), -- THE IP ADDRESS OF THE REMOTE  SESSION
    CONSTRAINT pk_sessions PRIMARY KEY (id),
    CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sessions_application FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- A LIST OF ASSETS CLASSES WHICH THIS SERVICE CAN INTERACT WITH
CREATE TABLE IF NOT EXISTS assets (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(12) NOT NULL UNIQUE, -- THE ASSET CODE
    name VARCHAR(32) NOT NULL, -- ASSET TYPE CODE
    description TEXT NOT NULL, -- THE DESCRIPTION OF THE ASSET
    issuer VARCHAR(256) NOT NULL, -- THE ISSUING ACCOUNT
    display_decimals NUMERIC(2) NOT NULL DEFAULT 2, -- DISPLAY DECIMALS
    img VARCHAR(256), -- A LINK TO THE IMAGE
    dist_wallet_id UUID NOT NULL, -- THE DISTRIBUTION WALLET ID
    kyc_req BOOLEAN NOT NULL DEFAULT FALSE,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL, -- THE USER WHICH CREATED THE GROUP
    updated_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS UPDATED
    updated_by UUID, -- THE USER WHICH UPDATED THE OBJECT
    deactivation_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS DEACTIVATED
    deactivated_by UUID, -- THE USER WHICH DEACTIVATED THE OBJECT
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_assets PRIMARY KEY (id),
    CONSTRAINT fk_asset_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_asset_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_asset_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id),
    CONSTRAINT fk_asset_dist_wallet_id FOREIGN KEY (dist_wallet_id) REFERENCES wallets(id)
);

-- LINKS ASSETS TO A SCHEDULE WHICH IDENTIFIES FIXED RATES AND LIMITS
-- EXAMPLES:
--  (BETWEEN 2018-06-01 AND 2018-06-30) OR (SELL @ 0.2 USD) FROM WALLET AAAAAA
--  (BETWEEN 2018-07-04 AND 2018-07-31) OR (SELL @ 0.4 USD) FROM WALLET BBBBBB
CREATE TABLE IF NOT EXISTS asset_offer (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL, -- THE ASSET TYPE
    start_date DATE, -- THE START DATE OF THE SCHEDULE
    stop_date DATE, -- THE STOP DATE OF THE SCHEDULE
    wallet_id UUID NOT NULL, -- THE WALLET FROM WHICH ASSETS SHOULD BE PURCHASED DURING THIS OFFER
    price NUMERIC(20, 7), -- THE OFFER DURING THIS SCHEDULE (IF NULL NO FIXED EXCHANGE) 
    price_code VARCHAR(12), -- THE OFFER CODE ()
    amount NUMERIC(20, 7), -- WHEN POPULATED AND START DATE HAS PASSED THE BALANCE OF THE ACCOUNT SHOULD BE X 
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL, -- THE USER WHICH CREATED THE GROUP
    updated_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS UPDATED
    updated_by UUID, -- THE USER WHICH UPDATED THE OBJECT
    deactivation_time TIMESTAMPTZ, -- THE TIME THAT THE OBJECT WAS DEACTIVATED
    deactivated_by UUID, -- THE USER WHICH DEACTIVATED THE OBJECT
    is_public BOOLEAN NOT NULL DEFAULT TRUE, -- IF TRUE LIST THE SALE ON THE DEX
    offer_id VARCHAR(256), -- THE OFFER ID CREATED ON THE STELLAR BLOCKCHAIN
    CONSTRAINT pk_asset_sale PRIMARY KEY (id),
    CONSTRAINT fk_asset_sale_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
    CONSTRAINT fk_asset_sale_wallet_id FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    CONSTRAINT ck_asset_sale_sell  CHECK (stop_date IS NULL OR (stop_date > start_date AND stop_date > CURRENT_DATE)),
    CONSTRAINT ck_asset_sale_sell_code CHECK (price IS NULL OR price_code IS NOT NULL),
    CONSTRAINT fk_asset_sale_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_asset_sale_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_asset_sale_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id)
);


-- CREATE ADMIN
INSERT INTO users (id, name, password, email) VALUES ('3c673456-23b1-4263-9deb-df46770852c9', 'admin@test.com',crypt('UniversalHealthCoinAdmin', gen_salt('bf')), 'admin@test.com');

-- CREATE APP_USER
INSERT INTO users (id, name, password) VALUES (uuid_nil(), 'NILUSER', crypt(uuid_generate_v4()::TEXT, gen_salt('bf')));

-- CREATE GROUPS 
INSERT INTO groups (id, name, created_by) VALUES ('044894bd-084e-47bb-9428-dbd80277614a', 'Administrators', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO groups (id, name, created_by) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', 'Users', '3c673456-23b1-4263-9deb-df46770852c9');

-- ASSIGN ADMIN <> ADMINISTRATORS
INSERT INTO user_group (user_id, group_id) VALUES ('3c673456-23b1-4263-9deb-df46770852c9', '044894bd-084e-47bb-9428-dbd80277614a');

-- CREATE DEFAULT PERMISSION SETS
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('29b52e3b-52d6-4108-bb6e-f4c692cb4145', 'user', 'Access to the user resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('c428ff6a-0d07-424f-802b-b51a040d023b', 'wallet', 'Access to the user resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('5245dff0-9b79-4ddb-b3bd-9dd733afd678', 'purchase', 'Access to the FIAT resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('608844ca-b98a-47f5-b834-d7fded513945', 'application', 'Access to the APPLICATION resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('20a97388-5b6a-43e7-ac07-911ceee7e0d6', 'asset', 'Access to the CONTRACT resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('3fc7cbc7-58ca-40fa-9d17-060dbf180e0b', 'group', 'Access to the GROUP resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('17e4de1c-4fd3-49ea-b394-90ddb5ccac38', 'permission', 'Access to the PERMISSION resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('76818f0a-2caa-4c46-83f5-064248001821', 'invitation', 'Access to the INVITATION resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('5e61b3dd-6b06-43d7-9d7f-839b30b6c496', 'transaction', 'Access to the TRANSACTION resource', '3c673456-23b1-4263-9deb-df46770852c9');

-- ASSIGN DEFAULT PERMISSIONS

-- ADMINS = RWXL ON ALL 
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags)
	SELECT '044894bd-084e-47bb-9428-dbd80277614a', id, 15
	FROM permission_sets
	WHERE NOT EXISTS (
		SELECT TRUE 
		FROM group_permissions
		WHERE group_id = '044894bd-084e-47bb-9428-dbd80277614a'
		AND permission_set_id = permission_sets.id
	);

-- USERS 
--	USER - RW OWNER
--	WALLET - RWXL OWNER
--	FIAT - RWXL OWNER	
--	CONTRACT - RWL OWNER
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '29b52e3b-52d6-4108-bb6e-f4c692cb4145', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', 'c428ff6a-0d07-424f-802b-b51a040d023b', 31);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '5245dff0-9b79-4ddb-b3bd-9dd733afd678', 31);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '20a97388-5b6a-43e7-ac07-911ceee7e0d6', 11);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '76818f0a-2caa-4c46-83f5-064248001821', 4);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '5e61b3dd-6b06-43d7-9d7f-839b30b6c496', 31);

-- CREATE A TEST USER
INSERT INTO users (name, password, email) VALUES ('bob@test.com',crypt('Test123', gen_salt('bf')), 'bob@test.com');

-- INSERT INTO wallets (id, address, seed) VALUES ('61b2c165-15b2-4bc7-9bf1-d94ee390c38c', 'address', 'seed') Address and seed of distributer account

INSERT INTO user_group (user_id, group_id)
	SELECT id, '330d2fb4-ba61-4b48-a0a1-8162a4708e96' 
	FROM users
	WHERE name = 'bob@test.com';

-- CREATE TEST APPLICATION FOR FIDDLER
INSERT INTO applications (id, name, secret, created_by) VALUES ('4fc15664-b152-4e6b-a852-b2aab0f05e05', 'fiddler', crypt('fiddler', gen_salt('bf')), '3c673456-23b1-4263-9deb-df46770852c9');
-- FIDDLER GRANT ALL 
INSERT INTO application_permissions (application_id, permission_set_id, acl_flags, client_only)
	SELECT '4fc15664-b152-4e6b-a852-b2aab0f05e05', id, 31, false
	FROM permission_sets;
