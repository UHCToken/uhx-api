-- UPDATE: 2018-08-08
-- AUTHOR: Neel Reddy
--  * ADDS SUBSCRIPTION_PAYMENTS TABLE

DROP TABLE IF EXISTS subscription_payments;

-- LIST OF SUBSCRIPTIONS THAT HAVE BEEN PAID
CREATE TABLE IF NOT EXISTS subscription_payments (
	id UUID NOT NULL DEFAULT uuid_generate_v4(),
	subscription_id UUID NOT NULL, -- THE ID OF THE SUBSCRIPTION
  patient_id UUID NOT NULL, -- THE PATIENT WHO PAID FOR THE SUBSCRIPTION
  date_paid DATE, -- THE DATE THAT THE PAYMENT WAS MADE
  offering_id UUID NOT NULL, -- THE OFFERING THAT WAS PAID FOR
  price NUMERIC(20, 7) NOT NULL, -- PRICE OF THE SUBSCRIPTION
  currency VARCHAR(50) NOT NULL, -- THE CURRENCY THE SUB WAS PAID FOR IN
	CONSTRAINT pk_subscription_payments PRIMARY KEY (id),
  CONSTRAINT fk_subscription_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  CONSTRAINT fk_subscription_payments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_subscription_payments_offering FOREIGN KEY (offering_id) REFERENCES offerings(id)
);
