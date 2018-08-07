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
  pg = require('pg');

/**
 * Init web socket for chat
 */
module.exports = class Chat {

  constructor() {
    io.listen(8080);
    initMessageSocket();
  }


  initMessageSocket = () => {
    // socket.listen(uhx.Config.api.port);
    io.on('connection', (socket) => {
      console.log('-------------------connected and stuff--------------------');
      socket.on('SEND_MESSAGE', function(data){

        let chatRoomFromData = {
          id: data.chatRoom.id,
          namespace: data.chatRoom.namespace,
          title: data.chatRoom.title,
          members: data.chatRoom.members.map( m=>m )
        }
        let chatMessageFromData = {
          id: data.chatMessage.id,
          chatRoomId: data.chatMessage.chatRoomId,
          author: data.chatMessage.author,
          dateSent: data.chatMessage.dateSent,
          viewedStatus: data.chatMessage.viewedStatus.toString(),
          body: data.chatMessage.body 
        }

        console.log('received message')
        console.log(data);
        //TODO Put data in model
        let chatRoom = new ChatRoom().copy(chatRoomFromData);
        let chatMessage = new ChatMessage().copy(chatMessageFromData);

        console.log(chatRoom);
        console.log(chatMessage);
        
        //TODO: Database callf

        //Emit
        io.emit('RECEIVE_MESSAGE', data);
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
  
}
 