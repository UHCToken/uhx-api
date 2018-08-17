-- UPDATE: 2018-08-17
-- * Added telephone extension columns to patients and providers
-- * Added countries to countries table
-- * Added new permission sets (patients, providers, chat, service types)

INSERT INTO permission_sets (id, name, description, created_by) VALUES ('1836f5e7-c0b2-4d3c-8da5-df50cd46040e', 'patient', 'Access to the patient resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('22c8ebb1-d488-4b52-8dfc-95697bc65c8b', 'provider', 'Access to the provider resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('066e692f-8369-4d1d-b2b6-cb899d817e62', 'providerAddress', 'Access to the provider address resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('e3d6f6b6-b81f-47d3-abfc-cf2fbc5f934e', 'providerService', 'Access to the provider service resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('e75a8a23-9abe-408c-8a8b-80769632e4db', 'chat', 'Access to the chat resource', '3c673456-23b1-4263-9deb-df46770852c9');
INSERT INTO permission_sets (id, name, description, created_by) VALUES ('a0479c91-ed6a-490e-8e75-95d281ba60b7', 'serviceType', 'Access to the service type resource', '3c673456-23b1-4263-9deb-df46770852c9');

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
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('4339ef73-25e7-43fd-9080-8f7eb55182eb', 'a0479c91-ed6a-490e-8e75-95d281ba60b7', 22);

INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', '1836f5e7-c0b2-4d3c-8da5-df50cd46040e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', '22c8ebb1-d488-4b52-8dfc-95697bc65c8b', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', '066e692f-8369-4d1d-b2b6-cb899d817e62', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', 'e3d6f6b6-b81f-47d3-abfc-cf2fbc5f934e', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', 'e75a8a23-9abe-408c-8a8b-80769632e4db', 22);
INSERT INTO group_permissions (group_id, permission_set_id, acl_flags) VALUES ('285cb044-bf99-4409-b418-7edc5c012ded', 'a0479c91-ed6a-490e-8e75-95d281ba60b7', 22);

-- ADD TEL EXT COLUMN TO PROVIDERS AND PATIENTS
ALTER TABLE providers ADD COLUMN tel_ext VARCHAR(64);
ALTER TABLE provider_addresses ADD COLUMN tel_ext VARCHAR(64);
ALTER TABLE patients ADD COLUMN tel_ext VARCHAR(64);

-- ADD COUNTRIES TO COUNTRIES TABLE
INSERT INTO countries (name, code) VALUES
('Afghanistan','af'),
('Aland Islands','ax'),
('Albania','al'),
('Algeria','dz'),
('American Samoa','as'),
('Andorra','ad'),
('Angola','ao'),
('Anguilla','ai'),
('Antigua','ag'),
('Argentina','ar'),
('Armenia','am'),
('Aruba','aw'),
('Australia','au'),
('Austria','at'),
('Azerbaijan','az'),
('Bahamas','bs'),
('Bahrain','bh'),
('Bangladesh','bd'),
('Barbados','bb'),
('Belarus','by'),
('Belgium','be'),
('Belize','bz'),
('Benin','bj'),
('Bermuda','bm'),
('Bhutan','bt'),
('Bolivia','bo'),
('Bosnia','ba'),
('Botswana','bw'),
('Bouvet Island','bv'),
('Brazil','br'),
('British Virgin Islands','vg'),
('Brunei','bn'),
('Bulgaria','bg'),
('Burkina Faso','bf'),
('Burma','mm'),
('Burundi','bi'),
('Caicos Islands','tc'),
('Cambodia','kh'),
('Cameroon','cm'),
('Canada','ca'),
('Cape Verde','cv'),
('Cayman Islands','ky'),
('Central African Republic','cf'),
('Chad','td'),
('Chile','cl'),
('China','cn'),
('Christmas Island','cx'),
('Cocos Islands','cc'),
('Colombia','co'),
('Comoros','km'),
('Congo','cd'),
('Congo Brazzaville','cg'),
('Cook Islands','ck'),
('Costa Rica','cr'),
('Cote Divoire','ci'),
('Croatia','hr'),
('Cuba','cu'),
('Cyprus','cy'),
('Czech Republic','cz'),
('Denmark','dk'),
('Djibouti','dj'),
('Dominica','dm'),
('Dominican Republic','do'),
('Ecuador','ec'),
('Egypt','eg'),
('El Salvador','sv'),
('Equatorial Guinea','gq'),
('Eritrea','er'),
('Estonia','ee'),
('Ethiopia','et'),
('Europeanunion','eu'),
('Falkland Islands','fk'),
('Faroe Islands','fo'),
('Fiji','fj'),
('Finland','fi'),
('France','fr'),
('French Guiana','gf'),
('French Polynesia','pf'),
('French Territories','tf'),
('Gabon','ga'),
('Gambia','gm'),
('Georgia','ge'),
('Germany','de'),
('Ghana','gh'),
('Gibraltar','gi'),
('Greece','gr'),
('Greenland','gl'),
('Grenada','gd'),
('Guadeloupe','gp'),
('Guam','gu'),
('Guatemala','gt'),
('Guinea','gn'),
('Guinea-Bissau','gw'),
('Guyana','gy'),
('Haiti','ht'),
('Heard Island','hm'),
('Honduras','hn'),
('Hong Kong','hk'),
('Hungary','hu'),
('Iceland','is'),
('India','in'),
('Indian Ocean Territory','io'),
('Indonesia','id'),
('Iran','ir'),
('Iraq','iq'),
('Ireland','ie'),
('Israel','il'),
('Italy','it'),
('Jamaica','jm'),
('Jan Mayen','sj'),
('Japan','jp'),
('Jordan','jo'),
('Kazakhstan','kz'),
('Kenya','ke'),
('Kiribati','ki'),
('Kuwait','kw'),
('Kyrgyzstan','kg'),
('Laos','la'),
('Latvia','lv'),
('Lebanon','lb'),
('Lesotho','ls'),
('Liberia','lr'),
('Libya','ly'),
('Liechtenstein','li'),
('Lithuania','lt'),
('Luxembourg','lu'),
('Macau','mo'),
('Macedonia','mk'),
('Madagascar','mg'),
('Malawi','mw'),
('Malaysia','my'),
('Maldives','mv'),
('Mali','ml'),
('Malta','mt'),
('Marshall Islands','mh'),
('Martinique','mq'),
('Mauritania','mr'),
('Mauritius','mu'),
('Mayotte','yt'),
('Mexico','mx'),
('Micronesia','fm'),
('Moldova','md'),
('Monaco','mc'),
('Mongolia','mn'),
('Montenegro','me'),
('Montserrat','ms'),
('Morocco','ma'),
('Mozambique','mz'),
('Namibia','na'),
('Nauru','nr'),
('Nepal','np'),
('Netherlands','nl'),
('Netherlandsantilles','an'),
('New Caledonia','nc'),
('New Guinea','pg'),
('New Zealand','nz'),
('Nicaragua','ni'),
('Niger','ne'),
('Nigeria','ng'),
('Niue','nu'),
('Norfolk Island','nf'),
('North Korea','kp'),
('Northern Mariana Islands','mp'),
('Norway','no'),
('Oman','om'),
('Pakistan','pk'),
('Palau','pw'),
('Palestine','ps'),
('Panama','pa'),
('Paraguay','py'),
('Peru','pe'),
('Philippines','ph'),
('Pitcairn Islands','pn'),
('Poland','pl'),
('Portugal','pt'),
('Puerto Rico','pr'),
('Qatar','qa'),
('Reunion','re'),
('Romania','ro'),
('Russia','ru'),
('Rwanda','rw'),
('Saint Helena','sh'),
('Saint Kitts and Nevis','kn'),
('Saint Lucia','lc'),
('Saint Pierre','pm'),
('Saint Vincent','vc'),
('Samoa','ws'),
('San Marino','sm'),
('Sandwich Islands','gs'),
('Sao Tome','st'),
('Saudi Arabia','sa'),
('Senegal','sn'),
('Serbia','cs'),
('Serbia','rs'),
('Seychelles','sc'),
('Sierra Leone','sl'),
('Singapore','sg'),
('Slovakia','sk'),
('Slovenia','si'),
('Solomon Islands','sb'),
('Somalia','so'),
('South Africa','za'),
('South Korea','kr'),
('Spain','es'),
('Sri Lanka','lk'),
('Sudan','sd'),
('Suriname','sr'),
('Swaziland','sz'),
('Sweden','se'),
('Switzerland','ch'),
('Syria','sy'),
('Taiwan','tw'),
('Tajikistan','tj'),
('Tanzania','tz'),
('Thailand','th'),
('Timorleste','tl'),
('Togo','tg'),
('Tokelau','tk'),
('Tonga','to'),
('Trinidad','tt'),
('Tunisia','tn'),
('Turkey','tr'),
('Turkmenistan','tm'),
('Tuvalu','tv'),
('U.A.E.','ae'),
('Uganda','ug'),
('Ukraine','ua'),
('United Kingdom','gb'),
('United States','us'),
('Uruguay','uy'),
('US Minor Islands','um'),
('US Virgin Islands','vi'),
('Uzbekistan','uz'),
('Vanuatu','vu'),
('Vatican City','va'),
('Venezuela','ve'),
('Vietnam','vn'),
('Wallis and Futuna','wf'),
('Western Sahara','eh'),
('Yemen','ye'),
('Zambia','zm'),
('Zimbabwe','zw');
