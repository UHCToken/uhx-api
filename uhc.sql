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
	name VARCHAR(256) NOT NULL,
	password VARCHAR(256) NOT NULL,
	password_salt VARCHAR(256),
    invalid_login INT NOT NULL DEFAULT 0,
    last_login TIMESTAMPTZ,
    lockout TIMESTAMPTZ, -- THE TIME THAT THE ACCOUNT IS LOCKED UNTIL
	email VARCHAR(256),
	email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    nickname VARCHAR(256),
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
CREATE TABLE IF NOT EXISTS application_permission (
    application_id UUID NOT NULL, 
    permission_set_id UUID NOT NULL, -- THE PERMISSION SET
    acl_flags INT NOT NULL DEFAULT 0, -- REPRESENTS THE ACL FLAGS (THESE ARE UNIX STYLE)
    CONSTRAINT pk_application_permission PRIMARY KEY (application_id, permission_set_id),
    CONSTRAINT fk_application_permission_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT fk_application_permission_permission_set FOREIGN KEY (permission_set_id) REFERENCES permission_sets(id)
);

-- REPRESENTS A SINGLE SESSION - A SESSION IS A COMBINATION OF A USER USING AN APPLICATION 
CREATE TABLE IF NOT EXISTS sessions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, 
    application_id UUID NOT NULL,
    not_before TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- THE TIME THE SESSION STARTED
    not_after TIMESTAMPTZ NOT NULL, -- THE EXPIRATION TIME (NOT AFTER) OF THE SESSION
    refresh_token VARCHAR(256), -- IF THE SESSION CAN BE EXTENDED AUTOMATICALLY, THE REFRESH TOKEN TO USE
    CONSTRAINT pk_sessions PRIMARY KEY (id),
    CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sessions_application FOREIGN KEY (application_id) REFERENCES applications(id)
);