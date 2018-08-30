

INSERT INTO users(id, name, password, email)
    VALUES ('5ffd56be-d2a2-4abc-93e3-056cc679232d', 'PatientSigner', crypt('temp', gen_salt('bf')), 'PatientSigner');
    INSERT INTO users(id, name, password, email)
    VALUES ('891ab26a-3c2c-4c41-bcb5-0612f1cff939', 'ProviderSigner', crypt('temp', gen_salt('bf')), 'ProviderSigner');
    INSERT INTO users(id, name, password, email)
    VALUES ('610be8a6-dcf2-4e0f-8e83-7f340f6792ca', 'Escrow', crypt('temp', gen_salt('bf')), 'Escrow');




INSERT INTO wallets(
            address, seed, user_id, network_id)
    VALUES ('GAYZRQNBY4D5LCOTTA43HKFYN75NLS2HTJZPFYBGEPKZPLSILFS3IYA7', 'SBFZ2YMD3XBV6ZOGOPZKC3TB3MPHKIBQ4423L6HDT5B2W5VC37PYF4C6', '5ffd56be-d2a2-4abc-93e3-056cc679232d', 1);
    INSERT INTO wallets(
            address, seed, user_id, network_id)
    VALUES ('GBVU54TEIQSZZ6NLZW7SGJSMCNUDNVQS6DVQ34N7QTMKM4I4XJQCXBBB', 'SCMVBSPN2ZV5IUPZQX3F322IENCZG7X5RVH54SWTTPNI4AKBOUXRLJFR', '891ab26a-3c2c-4c41-bcb5-0612f1cff939', 1);
    INSERT INTO wallets(
            address, seed, user_id, network_id)
    VALUES ('GDAG67TQB37SSAB663NMBBC5K5BDZGSGDW75N3VQCZMTTT2N4UGN7KZ5', 'SDSKQB4KAU7UAFHJZZZ2Q3WYRKUCVHSSGD4IK4PVVP4QXGYSUVYSX2LF', '610be8a6-dcf2-4e0f-8e83-7f340f6792ca', 1);




