CREATE TABLE IF NOT EXISTS reports (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(32) NOT NULL, -- A HUMAN NAME FOR THE REPORT
    description TEXT, -- ADDITIONAL DESCRIPTION OF THE REPORT
    view_name VARCHAR(64), -- THE NAME OF THE POSTGRESQL VIEW THIS REPORT EXECUTES
    CONSTRAINT pk_reports PRIMARY KEY (id)
);

INSERT INTO reports (id, name, description, view_name) VALUES ('18b4ac9f-1445-4600-af66-18893df6bc7c', 'Purchases by Currency', 'Shows purchases made for each asset type registered by the currency which those purchases were made. <strong>Note:</strong> This data only include purchases made using the websites not stellar transactions', 'rpt_purchase_by_currency');
INSERT INTO reports (id, name, description, view_name) VALUES ('56a253ee-11a9-4911-b6ba-80b1c8d868ef', 'Purchases by Currency/Date', 'Shows purchases made for each asset type registered by the currency which those purchases were made grouped by date. <strong>Note:</strong> This data only include purchases made using the websites not stellar transactions', 'rpt_purchase_by_currency_date');

CREATE OR REPLACE VIEW rpt_purchase_by_currency AS
    SELECT 
        assets.code, 
        charge_currency, 
        sum(charge_amount) as total_charge, 
        avg(charge_amount) as average_charge, 
        count(purchase.id) as num_purchases,
        min(charge_amount) as smallest_charge,
        max(charge_amount) as largest_charge,
        sum(amount) as amount,
        count(distinct user_id) as num_buyers
    FROM 
        purchase 
        INNER JOIN assets ON (asset_id = assets.id)
    WHERE
        state = 2
    GROUP BY
        code, charge_currency;

CREATE OR REPLACE VIEW rpt_purchase_by_currency_date AS
    SELECT 
        assets.code, 
        charge_currency, 
        to_char(transaction_time, 'yyyy-MM-dd') as date,
        sum(charge_amount) as total_charge, 
        avg(charge_amount) as average_charge, 
        count(purchase.id) as num_purchases,
        min(charge_amount) as smallest_charge,
        max(charge_amount) as largest_charge,
        sum(amount) as amount,
        count(distinct user_id) as num_buyers
    FROM 
        purchase 
        INNER JOIN assets ON (asset_id = assets.id)
    WHERE
        state = 2
    GROUP BY
        code, charge_currency, date
    ORDER BY 
        date;  

INSERT INTO permission_sets (id, name, description, created_by) VALUES ('1350145c-b111-4f15-a167-216a92891edd', 'reporting', 'Access to the REPORT resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) 
    VALUES ('044894bd-084e-47bb-9428-dbd80277614a', '1350145c-b111-4f15-a167-216a92891edd', 15);
