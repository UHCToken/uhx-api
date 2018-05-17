CREATE TABLE IF NOT EXISTS wallet_network (
    id NUMERIC(1) NOT NULL, -- THE NETWORK
    name VARCHAR(36) NOT NULL, -- THE NAME OF THE NETWORK
    CONSTRAINT pk_wallet_network PRIMARY KEY (id)
);

INSERT INTO wallet_network VALUES (1, 'STELLAR');
INSERT INTO wallet_network VALUES (2, 'ETHERIUM');

ALTER TABLE wallets ADD COLUMN network_id NUMERIC(1);
ALTER TABLE wallets ADD CONSTRAINT fk_wallet_network_id FOREIGN KEY (network_id) REFERENCES wallet_network(id);

ALTER TABLE wallets ADD COLUMN user_id uuid;
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id);

-- MIGRATE WALLETS
UPDATE wallets SET network_id = 1, user_id = (SELECT id FROM users WHERE wallet_id = wallets.id);
ALTER TABLE users DROP COLUMN wallet_id CASCADE;
ALTER TABLE wallets ALTER COLUMN network_id SET NOT NULL;

ALTER TABLE wallet_network ADD COLUMN symbol VARCHAR(3);
UPDATE wallet_network SET symbol = 'STR' WHERE id = 1;
UPDATE wallet_network SET symbol = 'ETH' WHERE id = 2;
ALTER TABLE wallet_network ALTER COLUMN symbol SET NOT NULL;