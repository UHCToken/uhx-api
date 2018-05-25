CREATE TABLE IF NOT EXISTS reports (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(32) NOT NULL, -- A HUMAN NAME FOR THE REPORT
    description TEXT, -- ADDITIONAL DESCRIPTION OF THE REPORT
    view_name VARCHAR(64), -- THE NAME OF THE POSTGRESQL VIEW THIS REPORT EXECUTES
    CONSTRAINT pk_reports PRIMARY KEY (id)
);

INSERT INTO reports (id, name, description, view_name) VALUES ('18b4ac9f-1445-4600-af66-18893df6bc7c', 'Purchases by Currency', 'Shows purchases made for each asset type registered by the currency which those purchases were made. <strong>Note:</strong> This data only include purchases made using the websites not stellar transactions', 'rpt_purchase_by_currency');
INSERT INTO reports (id, name, description, view_name) VALUES ('56a253ee-11a9-4911-b6ba-80b1c8d868ef', 'Purchases by Currency/Date', 'Shows purchases made for each asset type registered by the currency which those purchases were made grouped by date. <strong>Note:</strong> This data only include purchases made using the websites not stellar transactions', 'rpt_purchase_by_currency_date');
INSERT INTO reports (id, name, description, view_name) VALUES ('926ed9bf-12ce-4d80-8e10-c42aa40c8b40', 'Sessions by Date', 'Shows the sessions created by date', 'rpt_sessions_by_date');
INSERT INTO reports (id, name, description, view_name) VALUES ('7bb7b70e-aef6-46c0-bf5f-4b283150126f', 'New Users by Date', 'Shows the number of new users registered by date', 'rpt_num_users');
INSERT INTO reports (id, name, description, view_name) VALUES ('1c3b2ea9-935b-4e12-9542-5c15c1cbc8b8', 'Invitations', 'Shows the number invitations including statistics of average claim time', 'rpt_invitations');

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
        to_char(transaction_time, 'yyyy-MM-dd') as date,
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
        code, charge_currency, date
    ORDER BY 
        date;  

CREATE OR REPLACE VIEW rpt_sessions_by_date AS 
    SELECT 
        to_char(not_before, 'YYYY-mm-dd') AS date,
        count(distinct user_id) AS num_users,
        count(distinct id) AS num_sessions
    FROM sessions
    GROUP BY 
        date
    ORDER BY 
        date;

CREATE OR REPLACE VIEW rpt_num_users AS 
    SELECT 
        to_char(creation_time, 'yyyy-MM-dd') AS date,
        count(id) as num_users
    FROM 
        users
    GROUP BY
        date
    ORDER BY 
        date;

CREATE OR REPLACE VIEW rpt_invitations AS
    SELECT 
        to_char(invitations.creation_time, 'yyyy-MM-dd') AS date,
        COUNT(invitations.id) AS num_invitations,
        COUNT(invitations.signup_user_id) AS num_claimed,
        AVG(users.creation_time - invitations.creation_time) AS avg_claim_time
    FROM 
        invitations
        LEFT JOIN users ON (invitations.signup_user_id = users.id)
    GROUP BY
        date
    ORDER BY 
        date;

INSERT INTO permission_sets (id, name, description, created_by) VALUES ('1350145c-b111-4f15-a167-216a92891edd', 'reporting', 'Access to the REPORT resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) 
    VALUES ('044894bd-084e-47bb-9428-dbd80277614a', '1350145c-b111-4f15-a167-216a92891edd', 15);
