-- Table: public.wallets

-- DROP TABLE public.wallets;

ALTER TABLE wallets ADD COLUMN network VARCHAR(36);
ALTER TABLE wallets ADD COLUMN user_id uuid;
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id);