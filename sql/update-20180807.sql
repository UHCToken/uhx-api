-- UPDATE: 2018-08-07
--  * Adding chat_room and chat_message tables

CREATE TABLE chat_room (
  id varchar(255) NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  providerId text NOT NULL,
  patientId text NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE chat_message (
  id varchar(255) NOT NULL DEFAULT uuid_generate_v4(),
  chatroom_id varchar(255) NOT NULL,
  authorId text NOT NULL,
  authorName text NOT NULL,
  datesent timestamp NOT NULL,
  viewedstatus varchar(20) NOT NULL,
  body varchar(500),
  PRIMARY KEY (id)
);