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

const ModelBase = require('./ModelBase');

/**
 * @class
 * @summary represents a message header
 * @swagger
 * definitions:
 *  MessageHeader:
 *    properties:
 *      id:
 *        type: string
 *        description: unique identifier for messageHeader
 *      fromUser:
 *        type: Date
 *        description: User sending the message
 *      fromUserID:
 *        type: string
 *        description: ID of user sending the message
 *      toUser
 *        type: string
 *        description: user receiving the message
 *      toUserID
 *        type: string
 *        description: ID of user receiving the message
 */
module.exports = class MessageHeader extends ModelBase {
  
  /**
   * @constructor
   */
  constructor() {
    super();
    this.fromData = this.fromData.bind(this);
    this.toData = this.toData.bind(this);
  }

  /**
   * @method
   * @summary converts database asset message to this model
   * @param {*} dbMessage the message
   */
  fromData(dbMessage) {
    this.id = this.dbMessage.id;
    this.fromUser = this.dbMessage.fromUser;
    this.fromUserID = this.dbMessage.fromUserID;
    this.toUser = this.dbMessage.toUser;
    this.toUserID = this.dbMessage.toUserID;
    return this;
  }

  /**
   * @method
   * @summary convets message to a database model
   */
  toData() {
    return {
      id: this.id,
      fromUser: this.fromUser,
      fromUserID: this.fromUserID,
      toUser: this.toUser,
      toUserID: this.toUserID
    }
  }
}