ALTER TABLE transactions ALTER COLUMN memo TYPE TEXT;

-- TRANSACTION STATUS
CREATE TABLE transaction_state (
    id NUMERIC(1) NOT NULL,
    name VARCHAR(20) NOT NULL,
    CONSTRAINT pk_transaction_state PRIMARY KEY (id)
);

INSERT INTO transaction_state VALUES (-1, 'FAILED');
INSERT INTO transaction_state VALUES (1, 'PENDING');
INSERT INTO transaction_state VALUES (2, 'COMPLETE');
INSERT INTO transaction_state VALUES (3, 'ACTIVE');
INSERT INTO transaction_state VALUES (4, 'HOLD');

ALTER TABLE transactions ADD COLUMN state_id NUMERIC(1) NOT NULL DEFAULT 1;
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_state FOREIGN KEY (state_id) REFERENCES transaction_state(id);
UPDATE transactions SET state_id = COALESCE((SELECT CASE WHEN state <= 2 THEN state ELSE -1 END FROM purchase WHERE purchase.id = transactions.id), -1);
ALTER TABLE purchase DROP COLUMN state CASCADE;


ALTER TABLE transactions ADD COLUMN amount NUMERIC(20,7);
ALTER TABLE transactions ADD COLUMN asset_code VARCHAR(12);
ALTER TABLE purchase DROP COLUMN charge_amount;
ALTER TABLE purchase DROP COLUMN charge_currency; 
ALTER TABLE purchase RENAME COLUMN amount TO quantity;

-- UPDATE REPORTS

CREATE OR REPLACE VIEW rpt_purchase_by_currency AS
    SELECT 
        assets.code, 
        transactions.asset_code as charge_currency, 
        sum(transactions.amount) as total_charge, 
        avg(transactions.amount) as average_charge, 
        count(purchase.id) as num_purchases,
        min(transactions.amount) as smallest_charge,
        max(transactions.amount) as largest_charge,
        sum(purchase.quantity) as amount,
        count(distinct user_id) as num_buyers
    FROM 
        purchase 
        INNER JOIN transactions USING (id)
        INNER JOIN assets ON (asset_id = assets.id)
    WHERE
        state_id = 2
    GROUP BY
        code, charge_currency;

CREATE OR REPLACE VIEW rpt_purchase_by_currency_date AS
    SELECT 
        assets.code, 
        transactions.asset_code as charge_currency, 
        to_char(transactions.transaction_time, 'yyyy-MM-dd') as date,
        sum(amount) as total_charge, 
        avg(amount) as average_charge, 
        count(purchase.id) as num_purchases,
        min(amount) as smallest_charge,
        max(amount) as largest_charge,
        sum(quantity) as amount,
        count(distinct user_id) as num_buyers
    FROM 
        purchase 
        INNER JOIN transactions USING (id)
        INNER JOIN assets ON (asset_id = assets.id)
    WHERE
        state_id = 2
    GROUP BY
        code, charge_currency, date
    ORDER BY 
        date;  
