-- UPDATE: 2018-07-11
--  * ADDS INVOICE PERMISSIONS

INSERT INTO permission_sets (id, name, description, created_by) VALUES ('3b0bc9c5-3a4a-4903-ade5-f140519d917e', 'invoice', 'Access to the INVOICE resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('330d2fb4-ba61-4b48-a0a1-8162a4708e96', '3b0bc9c5-3a4a-4903-ade5-f140519d917e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('044894bd-084e-47bb-9428-dbd80277614a', '3b0bc9c5-3a4a-4903-ade5-f140519d917e', 15);