DROP VIEW rpt_purchase_by_currency ;
DROP VIEW rpt_purchase_by_currency_date ;

CREATE OR REPLACE VIEW rpt_purchase_by_currency AS
    SELECT 
        assets.code, 
        purchase.charge_currency, 
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
        charge_currency, 
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
