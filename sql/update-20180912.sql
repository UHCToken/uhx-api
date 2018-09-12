CREATE OR REPLACE VIEW karis_daily_reports AS
	SELECT 
		sub.id, sub.patient_id, sub.date_subscribed, sub.date_terminated
	FROM service_bundles AS sb
	LEFT JOIN offerings o 
		ON sb.offering_group_id = o.offering_group_id
	LEFT JOIN subscriptions sub 
		ON sub.offering_id = o.id
	WHERE subscription_service_id = (SELECT id FROM subscription_services WHERE name = 'Karis') 
	AND sub.id IS NOT NULL
	AND date_terminated IS NULL OR date_terminated = CURRENT_DATE
	GROUP BY sub.id;
	
CREATE OR REPLACE VIEW karis_monthly_reports AS
	SELECT 
		sub.id, sub.patient_id, sub.date_subscribed, sub.date_terminated
	FROM service_bundles AS sb
	LEFT JOIN offerings o 
		ON sb.offering_group_id = o.offering_group_id
	LEFT JOIN subscriptions sub 
		ON sub.offering_id = o.id
	WHERE subscription_service_id = (SELECT id FROM subscription_services WHERE name = 'Karis') 
	AND sub.id IS NOT NULL
	AND date_terminated IS NULL OR (date_terminated >= CURRENT_DATE - INTERVAL '1 month' AND date_terminated <= CURRENT_DATE - INTERVAL '1 day')
	GROUP BY sub.id;
	
CREATE OR REPLACE VIEW teladoc_daily_reports AS
	SELECT 
		sub.id, sub.patient_id, sub.date_subscribed, sub.date_terminated
	FROM service_bundles AS sb
	LEFT JOIN offerings o 
		ON sb.offering_group_id = o.offering_group_id
	LEFT JOIN subscriptions sub 
		ON sub.offering_id = o.id
	WHERE subscription_service_id = (SELECT id FROM subscription_services WHERE name = 'Teladoc') 
	AND sub.id IS NOT NULL
	AND date_terminated IS NULL OR date_terminated = CURRENT_DATE
	GROUP BY sub.id;

CREATE OR REPLACE VIEW teladoc_monthly_reports AS
	SELECT 
		sub.id, sub.patient_id, sub.date_subscribed, sub.date_terminated
	FROM service_bundles AS sb
	LEFT JOIN offerings o 
		ON sb.offering_group_id = o.offering_group_id
	LEFT JOIN subscriptions sub 
		ON sub.offering_id = o.id
	WHERE subscription_service_id = (SELECT id FROM subscription_services WHERE name = 'Teladoc') 
	AND sub.id IS NOT NULL
	AND date_terminated IS NULL OR (date_terminated >= CURRENT_DATE - INTERVAL '1 month' AND date_terminated <= CURRENT_DATE - INTERVAL '1 day')
	GROUP BY sub.id;
	 

