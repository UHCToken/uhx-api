-- UPDATE: 2018-08-08
-- AUTHOR: Neel Reddy
--  * ADDS SUBSCRIPTION_SERVICES TABLE
--  * ADDS OFFERINGS TABLE
--  * ADDS SERVICE_BUNDLES TABLE
--  * ADDS SUBSCRIPTIONS TABLE

DROP VIEW IF EXISTS subscription_lookup;
DROP VIEW IF EXISTS offering_lookup;
DROP TABLE IF EXISTS service_bundles;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS fields_required_for_service;
DROP TABLE IF EXISTS offerings;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS possible_user_fields;
DROP TABLE IF EXISTS offering_groups;
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
CREATE TABLE IF NOT EXISTS offering_groups (
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	name TEXT, -- NAME OF THE OFFERING GROUP
  description TEXT, -- DESCRIPTION OF THE OFFERING GROUP
	is_visible BOOLEAN, -- WHETHER THE USER CAN SEE THIS OFFERING GROUP
  CONSTRAINT pk_offering_groups PRIMARY KEY (id)
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
	code VARCHAR(2), -- COUNTRY CODE
  CONSTRAINT pk_countries PRIMARY KEY (id)
);

-- SPECIFIC OFFERINGS
CREATE TABLE IF NOT EXISTS offerings (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  offering_group_id UUID, -- ID OF THE OFFERING
  country_id UUID, -- ID OF THE COUNTRY OFFERED WITHIN
  currency_id UUID, -- ID OF THE CURRENCY TYPE OF THE OFFER
  price NUMERIC(20, 7), -- PRICE OF THE SERVICE BUNDLE
  period_in_months SMALLINT, -- DURATION OF THE OFFERING IN MONTHS
  CONSTRAINT pk_offerings PRIMARY KEY (id),
  CONSTRAINT fk_offering_offering_group FOREIGN KEY (offering_group_id) REFERENCES offering_groups(id),
  CONSTRAINT fk_offerings_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_offerings_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
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
	offering_group_id UUID NOT NULL, -- ID OF THE PRICE OFFERING FOR THE SERVICE BUNDLE
	subscription_service_id UUID NOT NULL, -- ID OF THE SUBSCRIPTION SERVICE
	CONSTRAINT pk_service_bundle PRIMARY KEY (offering_group_id, subscription_service_id),
	CONSTRAINT fk_service_bundle_offering_group FOREIGN KEY (offering_group_id) REFERENCES offering_groups(id),
	CONSTRAINT fk_service_bundle_service FOREIGN KEY (subscription_service_id) REFERENCES subscription_services(id)
);

-- LIST OF USERS AND THEIR SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	offering_id UUID NOT NULL, -- OFFERING THAT THE USER HAS PURCHASED
	patient_id UUID NOT NULL, -- ID OF THE PATIENT THAT BOUGHT THE SERVICE
	date_next_payment DATE, -- DATE OF NEXT BILLING REQUEST
	date_subscribed DATE, -- DATE WHEN SUBSCRIPTION STARTS
	date_terminated DATE, -- DATE WHEN SUBSCRIPTION ENDS
  auto_renew BOOLEAN, -- 1 FOR ENABLED, 0 FOR DISABLED
	CONSTRAINT pk_subscription PRIMARY KEY (id),
	CONSTRAINT fk_subscription_offering FOREIGN KEY (offering_id) REFERENCES offerings(id),
	CONSTRAINT fk_subscription_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE OR REPLACE VIEW offering_lookup AS
-- OFFERINGS
SELECT
	og.id, og.name, og.description, og.is_visible,
	-- ARRAY OF SERVICES OFFERED
	(SELECT json_agg(row_to_json(s))
	 FROM subscription_services s
	 WHERE s.id = ANY (SELECT sb.subscription_service_id FROM service_bundles sb WHERE sb.offering_group_id = og.id)) as services,
	-- ARRAY OF OFFERING
	(SELECT json_agg(json_build_object('id', o.id,
									   'price', o.price,
									   'period_in_months', o.period_in_months,
									   'country_code', c.code,
									   'country_name', c.name,
									   'currency_code', cur.code,
									   'currency_symbol', cur.symbol,
									   'currency_name', cur.long_name))
	 FROM offerings o
	 LEFT JOIN countries c ON c.id = o.country_id
	 LEFT JOIN currencies cur ON cur.id = o.currency_id
	 WHERE o.id = ANY (SELECT o.id FROM offerings o WHERE o.offering_group_id = og.id)) as offerings
FROM offering_groups og;

CREATE OR REPLACE VIEW subscription_lookup AS
SELECT
	s.id AS subscription_id,
	s.offering_id,
	s.patient_id,
	s.date_next_payment,
	s.date_subscribed,
	s.date_terminated,
	s.auto_renew,
	o.period_in_months,
	og.id AS offering_group_id
FROM subscriptions s
LEFT JOIN offerings o ON s.offering_id = o.id
LEFT JOIN offering_groups og ON og.id = o.offering_group_id;
