-- Created On: 2018-10-22
-- Updated On: 2018-11-06
-- Generates sample data for subscriptions related to Karis, Teladoc

-- Generate groups for offerings

INSERT INTO offering_groups 
    (id, name, description, is_visible) 
VALUES 
    ('02121aab-a391-4def-a9df-100007650018', 'UhX Season Pass', 'UhX Season Pass. Very Exciting. Wow!', true);

INSERT INTO offering_groups 
    (id, name, description, is_visible) 
VALUES 
    ('b749c932-8fc4-49bc-ac9c-7bace7463c96', 'Test Offering Group', 'Test offering group with only two services: Karis and TeleDocs.', true);

INSERT INTO offering_groups 
    (id, name, description, is_visible) 
VALUES 
    ('f027d1e4-4dca-47bf-9d10-c5cb30d12081', 'US Special Offering', 'This offering group contains only US offerings.', true);

INSERT INTO offering_groups 
    (id, name, description, is_visible) 
VALUES 
    ('ce997904-4ac4-4f7f-84d0-8c2ba519eb0c', 'Canada Only Offering Group', 'This offering group contains only Canada offerings.', true);

-- Generate offerings for subscriptions

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'b749c932-8fc4-49bc-ac9c-7bace7463c96', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 200.0000000, 4);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', 'ce997904-4ac4-4f7f-84d0-8c2ba519eb0c', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 15.0000000, 1);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', 'b749c932-8fc4-49bc-ac9c-7bace7463c96', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 55.0000000, 1);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'ce997904-4ac4-4f7f-84d0-8c2ba519eb0c', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 40.0000000, 4);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', '02121aab-a391-4def-a9df-100007650018', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 80.0000000, 6);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', '02121aab-a391-4def-a9df-100007650018', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 120.0000000, 12);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'f027d1e4-4dca-47bf-9d10-c5cb30d12081', 'c2071227-8596-4f2c-8347-fd6bc5b816e2', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 300.0000000, 12);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'ce997904-4ac4-4f7f-84d0-8c2ba519eb0c', 'a6af2cbd-847c-4b4f-84de-107c6356edf0', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 100.0000000, 12);

INSERT INTO offerings 
    (id, offering_group_id, country_id, asset_id, price, period_in_months) 
VALUES 
    ('e007d801-128b-4109-8e53-95d6f489f910', 'f027d1e4-4dca-47bf-9d10-c5cb30d12081', 'c2071227-8596-4f2c-8347-fd6bc5b816e2', 'e01241fa-14ac-4041-8db6-579f8eeb779d', 160.0000000, 4);

-- Generate users for subscriptions

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('7afb4f20-015f-4f2d-b614-e8a62db691bf', 'g7015737@nwytg.net', '$2a$06$m9tMhZc5sHGaD4i4nzY8M.l6bJvqhFTOQgs.4FFNqjC2R0q5BYfhq', 0, '2018-10-25 10:26:34.537-04', NULL, 'g7015737@nwytg.net', true, 'Ron', 'Ron', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '08054', '2018-10-24 14:51:18.388522-04', '2018-10-25 10:26:34.58413-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('c89313f8-9c2e-4bd3-ba35-b98dfcf79ccc', 'cjg12362@nbzmr.com', '$2a$06$KQmwYonOGLPK.uK6BvcxuugLfE0R9Z7HOzjRh4fg7HbHhbMBSEHoa', 0, '2018-10-25 10:25:30.514-04', NULL, 'cjg12362@nbzmr.com', true, 'Bob', 'Bob', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '54220', '2018-10-24 14:56:27.041993-04', '2018-10-25 10:25:30.559505-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('92f9b15c-a70a-42a7-8683-eaa21000a310', 'gzh50940@ebbob.com', '$2a$06$ap26c0w0Kh2w2.DbhT1Eu.91NQnTYzRv9EAlD50VSkYcG2uh7SiLO', 0, '2018-10-25 10:23:59.132-04', NULL, 'gzh50940@ebbob.com', true, 'Greg', 'Greg', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '54911', '2018-10-24 14:58:48.977336-04', '2018-10-25 10:23:59.181507-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('82b8b856-2d4a-486a-9968-08edbb7911e5', 'eys58851@awsoo.com', '$2a$06$ncZb8LS/At7VuYpvlWtO7O0Mv3grO/tE7TV0pIKJ1AN/.wtu7018C', 0, '2018-10-25 10:00:41.043-04', NULL, 'eys58851@awsoo.com', true, 'Jen', 'Jen', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '34203', '2018-10-24 15:00:25.11712-04', '2018-10-25 10:00:41.08989-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('24b1c1af-5cfe-4464-b549-6e575ec4a571', 'olh47575@nbzmr.com', '$2a$06$oK0liPkg3bf69SJXTyh6GOuQm6tfBc7agSBnmLj2eXgldznIloOza', 0, '2018-10-24 15:49:07.477-04', NULL, 'olh47575@nbzmr.com', true, 'Phil', 'Phil', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '30180', '2018-10-24 15:05:27.652964-04', '2018-10-24 15:49:07.525032-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('f6fd40e3-e401-4c3c-8de0-6cbe6744440b', 'cqn39471@ebbob.com', '$2a$06$wUS.jdnSeBcrYaiwdGttmuY5XVlvslQZTZXAXoUfIgXAqj9Rfcany', 0, '2018-10-24 16:04:37.527-04', NULL, 'cqn39471@ebbob.com', true, 'Rachel', 'Rachel', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '43026', '2018-10-24 15:07:17.564349-04', '2018-10-24 16:04:37.570968-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('8f3c600b-993d-426f-836f-0045fb01c20f', 'poi12310@ebbob.com', '$2a$06$TR.vkV81w6qUzTekmZMls.UeLSeJ2cnzUPhsKEM/ngGsYWohOVsoq', 0, '2018-10-24 16:06:30.842-04', NULL, 'poi12310@ebbob.com', true, 'Dan', 'Man', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '06450', '2018-10-24 15:08:35.788511-04', '2018-10-24 16:06:30.886726-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('a832c6b7-bf71-4452-82c3-235016c901be', 'cwb05063@ebbob.com', '$2a$06$jLEz8jb5AGzM0UPzXxvoZe44DhPnLpkPxCO6bgUNHF7D0x4.sFXOq', 0, '2018-10-25 09:57:56.953-04', NULL, 'cwb05063@ebbob.com', true, 'Tom', 'Tom', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '95008', '2018-10-24 15:04:16.832394-04', '2018-10-25 09:57:56.997133-04', NULL, NULL, NULL, NULL);

INSERT INTO users
    (id, name, password, invalid_login, last_login, lockout, email, email_verified, given_name, family_name, description, tel, tel_verified, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tfa_method, po_box, profile_image)
VALUES
    ('c9c0de1b-a3a3-4320-8fe8-5e5703aab27a', 'qcl91610@awsoo.com', '$2a$06$68Lgc1EKNb4MTk4ebpabyu89lGHsRddSOMEByOrkYjrFNmVmgp37.', 0, '2018-10-25 10:00:23.183-04', NULL, 'qcl91610@awsoo.com', true, 'Mary', 'Mary', NULL, NULL, false, NULL, NULL, NULL, NULL, 'US', '32068', '2018-10-24 15:03:07.542264-04', '2018-10-25 10:00:23.227659-04', NULL, NULL, NULL, NULL);

-- Generate patients for subscriptions

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('18c2bf0b-1217-4527-a910-e2bd03d219b0', '24b1c1af-5cfe-4464-b549-6e575ec4a571', 'Phil', 'Phil', NULL, NULL, 'olh47575@nbzmr.com', NULL, 'male', '1987-12-31', NULL, NULL, '2832 Randleman Rd', NULL, 'Greensboro', 'North Carolina', 'US', '27406', '2018-10-24 15:50:33.440128-04', '2018-10-24 16:03:08.422437-04', NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', 'f6fd40e3-e401-4c3c-8de0-6cbe6744440b', 'Rachel', 'Rachel', NULL, NULL, 'cqn39471@ebbob.com', NULL, 'female', '1966-05-08', NULL, NULL, '2136 Everett Rd', NULL, 'East Freedom', 'Pennsylvania', 'US', '16637', '2018-10-24 16:05:53.09352-04', NULL, NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('8431e51f-2987-4d7f-9a41-1966406ed883', '8f3c600b-993d-426f-836f-0045fb01c20f', 'Dan', 'Man', NULL, NULL, 'poi12310@ebbob.com', NULL, 'male', '1995-05-05', NULL, NULL, '33129 Harvey Escalante Rd', NULL, 'Los Fresnos', 'Texas', 'US', '78566', '2018-10-24 16:07:28.062499-04', NULL, NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('a9492de2-8036-46c3-a7fc-6ce1f199d057', 'a832c6b7-bf71-4452-82c3-235016c901be', 'Tom', 'Tom', NULL, NULL, 'cwb05063@ebbob.com', NULL, 'male', '1945-11-11', NULL, NULL, '22426 143rd Ave', NULL, 'Springfield Gardens', 'New York', 'US', '11413', '2018-10-24 15:48:44.959724-04', '2018-10-25 09:58:53.032482-04', NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('a1ac0145-134b-4394-b538-9cd312a68608', 'c9c0de1b-a3a3-4320-8fe8-5e5703aab27a', 'Mary', 'Mary', NULL, NULL, 'qcl91610@awsoo.com', NULL, 'female', '1990-04-15', NULL, NULL, '217 Elk Springs Rd', NULL, 'Oakland', 'Kentucky', 'US', '42159', '2018-10-24 15:46:24.887911-04', '2018-10-25 09:59:58.745192-04', NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('3632e183-da25-41e6-bd86-0fda5c5a7de1', '82b8b856-2d4a-486a-9968-08edbb7911e5', 'Jen', 'Jen', NULL, NULL, 'eys58851@awsoo.com', NULL, 'female', '1975-08-08', NULL, NULL, '5800 Maybrook Ct', NULL, 'Glen Allen', 'Virginia', 'US', '23059', '2018-10-24 15:41:51.551313-04', '2018-10-25 10:06:29.215153-04', NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('d85de29f-0480-40f9-bf50-a66b58180618', '92f9b15c-a70a-42a7-8683-eaa21000a310', 'Greg', 'Greg', NULL, NULL, 'gzh50940@ebbob.com', NULL, 'male', '1969-06-27', NULL, NULL, '172 Porters Bridge Rd', NULL, 'Colora', 'Maryland', 'US', '21917', '2018-10-24 15:40:29.274586-04', '2018-10-25 10:25:07.53086-04', NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('b3a1ddee-7968-4320-8946-6e74f0384728', 'c89313f8-9c2e-4bd3-ba35-b98dfcf79ccc', 'Bob', 'Bob', NULL, NULL, 'cjg12362@nbzmr.com', NULL, 'male', '1950-07-12', NULL, NULL, '3822 Potomac St', NULL, 'Groveport', 'Ohio', 'US', '43125', '2018-10-24 15:39:11.129677-04', '2018-10-25 10:26:05.289117-04', NULL, NULL);

INSERT INTO patients
    (id, user_id, given_name, family_name, tel, fax, email, profile_image, gender, dob, history, sensitivities, street, unit_suite, city, state_prov, country, postal_zip, creation_time, updated_time, deactivation_time, tel_ext)
VALUES
    ('a9ed3e9d-d90b-487b-b305-190da182ef52', '7afb4f20-015f-4f2d-b614-e8a62db691bf', 'Ron', 'Ron', NULL, NULL, 'g7015737@nwytg.net', NULL, 'male', '1900-01-01', NULL, NULL, '110 Miller St', NULL, 'Sidon', 'Mississsippi', 'US', '38954', '2018-10-24 15:37:00.611839-04', '2018-10-25 10:27:56.705024-04', NULL, NULL);

-- Offering @ 51a3b344-daa9-476f-b044-bb98f60bc21a (1 Month)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', '8431e51f-2987-4d7f-9a41-1966406ed883', '2018-11-01', '2018-10-01', null, true, '2018-10-31');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', null, '2018-09-01', '2018-10-01', false, '2018-09-30');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', '18c2bf0b-1217-4527-a910-e2bd03d219b0', '2018-10-15', '2018-09-15', '2018-10-14', true, '2018-10-14');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', null, '2018-10-23', null, false, '2018-11-22');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', 'a1ac0145-134b-4394-b538-9cd312a68608', '2018-11-22', '2018-10-22', null, true, '2018-11-21');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', '3632e183-da25-41e6-bd86-0fda5c5a7de1', null, '2018-10-23', null, false, '2018-11-22');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', 'd85de29f-0480-40f9-bf50-a66b58180618', '2018-09-30', '2018-08-30', '2018-09-29', true, '2018-09-29');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('51a3b344-daa9-476f-b044-bb98f60bc21a', 'b3a1ddee-7968-4320-8946-6e74f0384728', null, '2018-08-14', '2018-09-14', false, '2018-09-13');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ 561455e8-6706-44b0-b1e1-9c3b27a1726c (12 Month)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', 'a9ed3e9d-d90b-487b-b305-190da182ef52', '2019-09-01', '2018-09-01', null, true, '2019-08-30');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', 'b3a1ddee-7968-4320-8946-6e74f0384728', null, '2018-05-27', null, false, '2019-05-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', 'd85de29f-0480-40f9-bf50-a66b58180618', '2018-09-15', '2017-09-15', '2018-09-15', true, '2018-09-14');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', '3632e183-da25-41e6-bd86-0fda5c5a7de1', null, '2018-09-27', null, false, '2019-09-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', 'a1ac0145-134b-4394-b538-9cd312a68608', '2019-10-22', '2018-10-22', null, true, '2019-11-21');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', null, '2017-10-29', null, false, '2018-10-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', '18c2bf0b-1217-4527-a910-e2bd03d219b0', '2018-09-30', '2017-08-30', '2018-09-29', true, '2018-09-29');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', null, '2017-10-14', '2018-10-14', false, '2018-10-13');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('561455e8-6706-44b0-b1e1-9c3b27a1726c', '8431e51f-2987-4d7f-9a41-1966406ed883', '2018-09-23', '2017-09-23', '2018-09-22', true, '2018-09-22');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ 88c30f5f-0fe1-44f6-9b77-882080feb17f (6 Months)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', '2018-09-01', '2018-03-01', '2018-09-01', true, '2018-08-31');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', '18c2bf0b-1217-4527-a910-e2bd03d219b0', null, '2018-04-27', '2018-10-27', false, '2018-10-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', '2019-03-19', '2018-09-19', null, true, '2019-03-18');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', 'a1ac0145-134b-4394-b538-9cd312a68608', null, '2018-06-07', null, false, '2018-12-06');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', '3632e183-da25-41e6-bd86-0fda5c5a7de1', '2019-04-29', '2018-10-29', null, true, '2019-04-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', 'd85de29f-0480-40f9-bf50-a66b58180618', null, '2018-04-27', '2018-10-28', false, '2018-10-27');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', 'b3a1ddee-7968-4320-8946-6e74f0384728', '2019-05-01', '2018-10-31', null, true, '2019-04-30');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('88c30f5f-0fe1-44f6-9b77-882080feb17f', 'a9ed3e9d-d90b-487b-b305-190da182ef52', null, '2018-10-30', null, false, '2019-04-29');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ 1bb91334-1d68-493f-b165-c4ee798c85d7 (4 Months)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', '2018-09-01', '2018-05-01', '2018-09-01', true, '2018-08-31');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', '18c2bf0b-1217-4527-a910-e2bd03d219b0', null, '2018-06-27', '2018-10-27', false, '2018-10-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', '2019-01-19', '2018-09-19', null, true, '2019-01-18');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'a1ac0145-134b-4394-b538-9cd312a68608', null, '2018-08-07', null, false, '2018-12-06');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', '3632e183-da25-41e6-bd86-0fda5c5a7de1', '2019-03-01', '2018-10-29', null, true, '2019-02-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'd85de29f-0480-40f9-bf50-a66b58180618', null, '2018-06-27', '2018-10-28', false, '2018-10-27');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'b3a1ddee-7968-4320-8946-6e74f0384728', '2019-03-01', '2018-10-31', null, true, '2019-02-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'a9ed3e9d-d90b-487b-b305-190da182ef52', null, '2018-10-30', null, false, '2019-02-28');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ e007d801-128b-4109-8e53-95d6f489f910 (4 Months)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', '2018-09-01', '2018-05-01', '2018-09-01', true, '2018-08-31');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', '18c2bf0b-1217-4527-a910-e2bd03d219b0', null, '2018-06-27', '2018-10-27', false, '2018-10-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', '2019-01-19', '2018-09-19', null, true, '2019-01-18');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'a1ac0145-134b-4394-b538-9cd312a68608', null, '2018-08-07', null, false, '2018-12-06');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', '3632e183-da25-41e6-bd86-0fda5c5a7de1', '2019-03-01', '2018-10-29', null, true, '2019-02-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'd85de29f-0480-40f9-bf50-a66b58180618', null, '2018-06-27', '2018-10-28', false, '2018-10-27');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'b3a1ddee-7968-4320-8946-6e74f0384728', '2019-03-01', '2018-10-31', null, true, '2019-02-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1bb91334-1d68-493f-b165-c4ee798c85d7', 'a9ed3e9d-d90b-487b-b305-190da182ef52', null, '2018-10-30', null, false, '2019-02-28');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ ae0a9ca3-1870-4eb1-a84f-03a64f1232bf (12 Months)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'a9ed3e9d-d90b-487b-b305-190da182ef52', '2019-09-17', '2018-09-17', null, true, '2019-09-16');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'b3a1ddee-7968-4320-8946-6e74f0384728', null, '2018-10-29', null, false, '2019-10-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'd85de29f-0480-40f9-bf50-a66b58180618', '2018-09-24', '2017-09-24', '2018-09-24', true, '2018-09-23');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', '3632e183-da25-41e6-bd86-0fda5c5a7de1', null, '2018-10-27', null, false, '2019-10-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'a1ac0145-134b-4394-b538-9cd312a68608', '2019-08-22', '2018-08-22', null, true, '2019-08-21');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', null, '2017-08-29', '2018-08-29', false, '2018-08-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', '18c2bf0b-1217-4527-a910-e2bd03d219b0', '2018-12-30', '2017-12-30', null, true, '2018-12-29');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', null, '2017-10-14', '2018-10-14', false, '2018-10-13');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('ae0a9ca3-1870-4eb1-a84f-03a64f1232bf', '8431e51f-2987-4d7f-9a41-1966406ed883', '2018-10-23', '2017-10-23', '2018-10-22', true, '2018-10-22');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ 0bb5cff3-da37-4be5-96ba-3780b7093e55 (1 Month)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', '8431e51f-2987-4d7f-9a41-1966406ed883', '2018-11-01', '2018-10-01', null, true, '2018-10-31');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', null, '2018-09-01', '2018-10-01', false, '2018-09-30');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', '18c2bf0b-1217-4527-a910-e2bd03d219b0', '2018-10-15', '2018-09-15', '2018-10-14', true, '2018-10-14');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', null, '2018-10-23', null, false, '2018-11-22');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', 'a1ac0145-134b-4394-b538-9cd312a68608', '2018-11-22', '2018-10-22', null, true, '2018-11-21');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', '3632e183-da25-41e6-bd86-0fda5c5a7de1', null, '2018-10-23', null, false, '2018-11-22');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', 'd85de29f-0480-40f9-bf50-a66b58180618', '2018-09-30', '2018-08-30', '2018-09-29', true, '2018-09-29');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('0bb5cff3-da37-4be5-96ba-3780b7093e55', 'b3a1ddee-7968-4320-8946-6e74f0384728', null, '2018-08-14', '2018-09-14', false, '2018-09-13');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ 1f5d02bc-1b6b-4217-a4ec-d1ed2412e283 (4 Months)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', '2018-09-18', '2018-05-18', '2018-09-17', true, '2018-08-17');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', '18c2bf0b-1217-4527-a910-e2bd03d219b0', null, '2018-06-05', '2018-10-05', false, '2018-10-04');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', '2019-01-27', '2018-09-27', null, true, '2019-01-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'a1ac0145-134b-4394-b538-9cd312a68608', null, '2018-08-03', null, false, '2018-12-02');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', '3632e183-da25-41e6-bd86-0fda5c5a7de1', '2019-03-01', '2018-10-29', null, true, '2019-02-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'd85de29f-0480-40f9-bf50-a66b58180618', null, '2018-06-27', '2018-10-28', false, '2018-10-27');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'b3a1ddee-7968-4320-8946-6e74f0384728', '2019-02-25', '2018-10-25', null, true, '2019-02-24');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('1f5d02bc-1b6b-4217-a4ec-d1ed2412e283', 'a9ed3e9d-d90b-487b-b305-190da182ef52', null, '2018-08-14', null, false, '2018-12-13');

-- -------------------------------------------------------------------------------------------------------

-- Offering @ 8a73d848-97b0-4715-9b6d-dd394c36c0f6 (12 Months)

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'a9ed3e9d-d90b-487b-b305-190da182ef52', '2019-09-17', '2018-09-17', null, true, '2019-09-16');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'b3a1ddee-7968-4320-8946-6e74f0384728', null, '2018-10-29', null, false, '2019-10-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'd85de29f-0480-40f9-bf50-a66b58180618', '2018-09-24', '2017-09-24', '2018-09-24', true, '2018-09-23');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', '3632e183-da25-41e6-bd86-0fda5c5a7de1', null, '2018-10-27', null, false, '2019-10-26');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'a1ac0145-134b-4394-b538-9cd312a68608', '2019-08-22', '2018-08-22', null, true, '2019-08-21');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'a9492de2-8036-46c3-a7fc-6ce1f199d057', null, '2017-08-29', '2018-08-29', false, '2018-08-28');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', '18c2bf0b-1217-4527-a910-e2bd03d219b0', '2018-12-30', '2017-12-30', null, true, '2018-12-29');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', 'dcfe1335-0f94-4dd5-a8f0-94157ea2ae5e', null, '2017-10-14', '2018-10-14', false, '2018-10-13');

INSERT INTO subscriptions
    (offering_id, patient_id, date_next_payment, date_subscribed, date_terminated, auto_renew, date_expired)
VALUES
    ('8a73d848-97b0-4715-9b6d-dd394c36c0f6', '8431e51f-2987-4d7f-9a41-1966406ed883', '2018-10-23', '2017-10-23', '2018-10-22', true, '2018-10-22');

-- -------------------------------------------------------------------------------------------------------