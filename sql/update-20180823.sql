-- UPDATE: 2018-08-23
-- * Update to permission sets for patients

UPDATE group_permissions SET acl_flags = '2' WHERE group_id = '285cb044-bf99-4409-b418-7edc5c012ded' AND permission_set_id = '22c8ebb1-d488-4b52-8dfc-95697bc65c8b';
UPDATE group_permissions SET acl_flags = '2' WHERE group_id = '285cb044-bf99-4409-b418-7edc5c012ded' AND permission_set_id = '066e692f-8369-4d1d-b2b6-cb899d817e62';
UPDATE group_permissions SET acl_flags = '2' WHERE group_id = '285cb044-bf99-4409-b418-7edc5c012ded' AND permission_set_id = 'e3d6f6b6-b81f-47d3-abfc-cf2fbc5f934e';