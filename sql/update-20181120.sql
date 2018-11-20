DROP VIEW IF EXISTS subscription_lookup;

CREATE OR REPLACE VIEW subscription_lookup AS
SELECT
	s.id AS subscription_id,
	s.offering_id,
	s.patient_id,
	u.id AS user_id,
	s.date_next_payment,
	s.date_subscribed,
	s.date_terminated,
	s.auto_renew,
	o.period_in_months,
	og.id AS offering_group_id,
	o.price,
	a.code AS currency,
	s.date_expired
FROM subscriptions s
LEFT JOIN offerings o ON s.offering_id = o.id
LEFT JOIN offering_groups og ON og.id = o.offering_group_id
LEFT JOIN assets a ON a.id = o.asset_id
LEFT JOIN patients p ON p.id = s.patient_id
LEFT JOIN users u ON p.user_id = u.id;

DROP VIEW IF EXISTS offering_lookup;

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
									   'currency_code', a.code,
									   'currency_name', a.name))
	 FROM offerings o
	 LEFT JOIN countries c ON c.id = o.country_id
	 LEFT JOIN assets a ON a.id = o.asset_id
	 WHERE o.id = ANY (SELECT o.id FROM offerings o WHERE o.offering_group_id = og.id)) as offerings
FROM offering_groups og;