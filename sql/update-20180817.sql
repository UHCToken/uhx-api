INSERT INTO permission_sets (id, name, description, created_by) VALUES ('1836f5e7-c0b2-4d3c-8da5-df50cd46040e', 'patient', 'Access to the patient resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('22c8ebb1-d488-4b52-8dfc-95697bc65c8b', 'provider', 'Access to the provider resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('066e692f-8369-4d1d-b2b6-cb899d817e62', 'providerAddress', 'Access to the provider address resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('e3d6f6b6-b81f-47d3-abfc-cf2fbc5f934e', 'providerService', 'Access to the provider service resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('e75a8a23-9abe-408c-8a8b-80769632e4db', 'chat', 'Access to the chat resource', '3c673456-23b1-4263-9deb-df46770852c9');

INSERT INTO group_permissions (group_id, permission_set_id, acl_flags)
	SELECT '044894bd-084e-47bb-9428-dbd80277614a', id, 15
	FROM permission_sets
	WHERE NOT EXISTS (
		SELECT TRUE 
		FROM group_permissions
		WHERE group_id = '044894bd-084e-47bb-9428-dbd80277614a'
		AND permission_set_id = permission_sets.id
	);
	
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', '1836f5e7-c0b2-4d3c-8da5-df50cd46040e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', '22c8ebb1-d488-4b52-8dfc-95697bc65c8b', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', '066e692f-8369-4d1d-b2b6-cb899d817e62', 31);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', 'e3d6f6b6-b81f-47d3-abfc-cf2fbc5f934e', 31);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', 'e75a8a23-9abe-408c-8a8b-80769632e4db', 22);

INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', '1836f5e7-c0b2-4d3c-8da5-df50cd46040e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', '22c8ebb1-d488-4b52-8dfc-95697bc65c8b', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', '066e692f-8369-4d1d-b2b6-cb899d817e62', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', 'e3d6f6b6-b81f-47d3-abfc-cf2fbc5f934e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', 'e75a8a23-9abe-408c-8a8b-80769632e4db', 22);