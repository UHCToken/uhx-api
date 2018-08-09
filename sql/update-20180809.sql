-- UPDATE: 2018-08-08
--  * ADDS SUBSCRIPTION_SERVICES TABLE
--  * ADDS OFFERINGS TABLE
--  * ADDS SERVICE_BUNDLES TABLE
--  * ADDS SUBSCRIPTIONS TABLE

DROP TABLE IF EXISTS service_bundles;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS fields_required_for_service;
DROP TABLE IF EXISTS country_offerings;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS possible_user_fields;
DROP TABLE IF EXISTS offerings;
DROP TABLE IF EXISTS subscription_services;

-- LIST OF SUBSCRIPTION SERVICES
CREATE TABLE IF NOT EXISTS subscription_services (
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	name VARCHAR(256), -- THE NAME OF THE SERVICE BEING OFFERED
	description TEXT, -- DESCRIPTION OF THE SERVICE PROVIDER
	group_id VARCHAR(256), -- ID GIVEN BY PROVIDER WHICH IDENTIFIES THE SERVICE INTERNALLY,
	website VARCHAR(256), -- LINK TO THE SERVICE WEBSITE
	phone VARCHAR(256), -- SERVICES CONTACT NUMBER
	CONSTRAINT pk_services PRIMARY KEY (id)
);

-- USED TO STORE PRICES OF SERVICE BUNDLES
CREATE TABLE IF NOT EXISTS offerings (
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
  description TEXT, -- DESCRIPTION OF THE OFFERING
  CONSTRAINT pk_offerings PRIMARY KEY (id)
);

-- USED TO STORE ALL POSSIBLE PATIENT FIELDS NEEDED FOR SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS possible_user_fields (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name VARCHAR(256), -- NAME OF THE REQUIRED FIELD
  CONSTRAINT pk_possible_user_fields PRIMARY KEY (id)
);

-- STORES CURRENCIES USED TO PAY FOR SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS currencies (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  code VARCHAR(50), -- CURRENCY CODE (USD, BTC, UhX, etc)
  long_name VARCHAR(256), -- LONG NAME OF THE CURRENCY
  symbol VARCHAR(10), -- UNICODE SYMBOL FOR THE CURRENCY
  CONSTRAINT pk_currencies PRIMARY KEY (id)
);

-- STORES COUNTRIES WHEREIN SUBSCRIPTIONS ARE OFFERED
CREATE TABLE IF NOT EXISTS countries (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name VARCHAR(256), -- NAME OF THE COUNTRY
  CONSTRAINT pk_countries PRIMARY KEY (id)
);

-- COUNTRIES ASSOCIATED TO THE OFFERINGS THEREIN
CREATE TABLE IF NOT EXISTS country_offerings (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  offering_id UUID, -- ID OF THE OFFERING
  country_id UUID, -- ID OF THE COUNTRY OFFERED WITHIN
  currency_id UUID, -- ID OF THE CURRENCY TYPE OF THE OFFER
  price NUMERIC(20, 7), -- PRICE OF THE SERVICE BUNDLE
  period_in_months SMALLINT, -- DURATION OF THE OFFERING IN MONTHS
  CONSTRAINT pk_country_offerings PRIMARY KEY (id),
  CONSTRAINT fk_country_offerings_offering FOREIGN KEY (offering_id) REFERENCES offerings(id),
  CONSTRAINT fk_country_offerings_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_country_offerings_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- REQUIRED FIELDS FOR SPECIFIC SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS fields_required_for_service (
  subscription_service_id UUID NOT NULL,
  user_field_id UUID NOT NULL,
  CONSTRAINT pk_fields_required_for_service PRIMARY KEY (subscription_service_id, user_field_id),
  CONSTRAINT fk_fields_required_for_service_subscription FOREIGN KEY (subscription_service_id) REFERENCES subscription_services(id),
  CONSTRAINT fk_fields_required_for_service_field FOREIGN KEY (user_field_id) REFERENCES possible_user_fields(id)
);

-- ASSOCIATION TABLE LINKING PRICE OFFERINGS TO THE SERVICES THEY PROVIDE
CREATE TABLE IF NOT EXISTS service_bundles (
	offering_id UUID NOT NULL, -- ID OF THE PRICE OFFERING FOR THE SERVICE BUNDLE
	subscription_service_id UUID NOT NULL, -- ID OF THE SUBSCRIPTION SERVICE
	CONSTRAINT pk_service_bundle PRIMARY KEY (offering_id, subscription_service_id),
	CONSTRAINT fk_service_bundle_offering FOREIGN KEY (offering_id) REFERENCES offerings(id),
	CONSTRAINT fk_service_bundle_service FOREIGN KEY (subscription_service_id) REFERENCES subscription_services(id)
);

-- LIST OF USERS AND THEIR SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	offering_id UUID NOT NULL, -- OFFERING THAT THE USER HAS PURCHASED
	patient_id UUID NOT NULL, -- ID OF THE PATIENT THAT BOUGHT THE SERVICE
	date_next_payment TIMESTAMPTZ, -- DATE OF NEXT BILLING REQUEST
	date_subscribed TIMESTAMPTZ, -- DATE WHEN SUBSCRIPTION STARTS
	date_terminated TIMESTAMPTZ, -- DATE WHEN SUBSCRIPTION ENDS
  auto_renew BOOLEAN, -- 1 FOR ENABLED, 0 FOR DISABLED
	CONSTRAINT pk_subscription PRIMARY KEY (id),
	CONSTRAINT fk_subscription_offering FOREIGN KEY (offering_id) REFERENCES offerings(id),
	CONSTRAINT fk_subscription_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);
