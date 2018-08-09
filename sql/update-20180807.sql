-- UPDATE: 2018-08-07
--  * Adding chat_room and chat_message tables

CREATE TABLE chat_room (
  c_id varchar(255) NOT NULL,
  c_namespace text,
  c_title text NOT NULL,
  c_providerId text NOT NULL,
  c_patientId text NOT NULL,
  PRIMARY KEY (c_id)
);

CREATE TABLE chat_message (
  cm_id varchar(255) NOT NULL,
  cm_chatroom_id varchar(255) NOT NULL,
  cm_author text NOT NULL,
  cm_datesent timestamp NOT NULL,
  cm_viewedstatus varchar(20) NOT NULL,
  cm_body varchar(500),
  PRIMARY KEY (cm_id)
);