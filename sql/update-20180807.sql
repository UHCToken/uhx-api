-- UPDATE: 2018-08-07
--  * Adding chat_room and chat_message tables

CREATE TABLE chat_room (
  c_id varchar(255) NOT NULL auto_increment,
  c_namespace varchar(255) NOT NULL,
  c_title text NOT NULL,
  c_members text[] NOT NULL
  PRIMARY KEY (c_id)
);

CREATE TABLE chat_messages (
  cm_id varchar(255) NOT NULL auto_increment,
  cm_chatroom_id varchar(255) NOT NULL,
  cm_author text NOT NULL,
  cm_datesent datetime NOT NULL,
  cm_viewedstatus varchar(20) NOT NULL,
  cm_body varchar(500),
  PRIMARY KEY (cm_id)
);