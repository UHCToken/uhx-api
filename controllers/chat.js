'use strict';

/**
 * Copyright 2018 Universal Health Coin
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
 * IN THE SOFTWARE.
 * 
 * Developed on behalf of Universal Health Coin by the Mohawk mHealth & eHealth Development & Innovation Centre (MEDIC)
 */

const ChatMessage = require('../model/ChatMessage'),
  ChatRoom = require('../model/ChatRoom'),
  http = require('http'),
  io = require('socket.io')(http),
  security = require('../security'),
  exception = require('../exception'),
  uhx = require('../uhx');

/**
 * @class
 * @summary Represents Chat Object, with socket.io for listening, and routes for getting/creating chatrooms and chats
 */
module.exports.ChatApiResource = class ChatApiResource {

  get routes() {
    return {
      permission_group: "user",
      routes: [
        {
          "path": "chat/:uid",
          "get" : {
              demand: security.PermissionType.LIST,
              method: this.getChatRooms
          },
          "post" : {
              demand: security.PermissionType.WRITE,
              method: this.createChatRoom
          }
        },
        {
          "path": "chat/:cid/messages",
          "get" : {
              demand: security.PermissionType.LIST,
              method: this.getChatMessages
          },
          "post" : {
              demand: security.PermissionType.WRITE,
              method: this.createChatMessage
          }
        },
        {
          "path": "listen/:cid",
          "get" : {
              demand: security.PermissionType.LIST,
              method: this.initChatSocket
          }
        }
      ]
    }  
  }


  /**
   * @method
   * @summary: Initiates the web socket activity. 
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async initChatSocket(req, res) {

    //Create unique chatroom namespace from chatID
    let chat = io.of(req.params.chatRoomId)
    //Web sockets listening...
    chat.listen(8080);  //TODO: Configure Port

    chat.on('connection', (socket) => {
      console.log('-------------------connected and stuff--------------------');

      socket.on('SEND_MESSAGE', function(data){

        let chatMessageFromData = {
          id: data.chatMessage.id,
          chatRoomId: data.chatMessage.chatRoomId,
          author: data.chatMessage.author,
          dateSent: data.chatMessage.dateSent,
          viewedStatus: data.chatMessage.viewedStatus.toString(),
          body: data.chatMessage.body 
        }

        //Create new Room or Message
        let chatMessage = new ChatMessage().copy(chatMessageFromData);

        //Emit to chat
        chat.emit('RECEIVE_MESSAGE', data);

      })

      socket.on('disconnect', () => {
          console.log('user disconnected')
          //TODO: Program disconnect stuff
          // socket.removeAllListeners('send message');
          // socket.removeAllListeners('disconnect');
          // io.removeAllListeners('connection');
      })
    });
  }

  /**
   * @method
   * @summary Get a list of chatrooms that a user is a part of 
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async getChatRooms(req, res) {
    if(!req.params.uid)
        throw new exception.Exception("Missing chat user id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    res.status(200).json(await uhx.Repositories.chatRepository.getChatRooms(req.params.uid));
    return true;
  }

  /**
   * @method
   * @summary Creates a new chat room
   * @param {Express.Request} req The HTTP request fromthis client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async createChatRoom(req, res) {
    if(!req.body)
      throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

    let chatRoom = new ChatRoom().copy(req.body.chatRoom)
    //Create unique chatroom ID
    chatroom.id = `${new Date(MM/DD/YYYY)}${chatroom.providerId}${chatRoom.patientId}`
    res.status(201).json(uhx.Repositories.chatRepository.createChatRoom(chatRoom));
    return true;
  }


  /**
   * @method
   * @summary Creates a new chat message
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async createChatMessage(req, res) {
    if(!req.body)
      throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

    let chatRoomId = req.body.chatRoomId;
    let chatMessage = new ChatMessage().copy(req.body.chatMessage)
    res.status(201).json(uhx.Repositories.chatRepository.createChatMessage(chatRoomId, chatMessage));
    return true;
  }

  /**
   * @method
   * @summary Gets chat messages associated with a particular chat room
   * @param {Express.Request} req http req from the client
   * @param {Express.Response} res The HTTP response going to the client
   */
  async getChatMessages(req, res) {
    if(!req.params.cid)
        throw new exception.Exception("Missing chat room id parameter", exception.ErrorCodes.MISSING_PROPERTY);

    try {
      res.status(200).json(await uhx.Repositories.chatRepository.getChatMessages(req.params.cid));
      return true;
    }
    catch (e) {
      throw new exception.Exception('There is an error.... ', exception.ErrorCodes.UNKNOWN);
    }
  }
}
