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
 *      title:
 *        type: string
 *        description: chat title
 *      providerId:
 *        type: string
 *        description: userId of provider
 *      patientId:
 *        type: string
 *        description: userId of patient
 */
module.exports = class ChatRoom extends ModelBase {
  
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
    this.id = dbMessage.id;
    this.title = dbMessage.title;
    this.providerId = dbMessage.providerId;
    this.patientId = dbMessage.patientId;
    return this;
  }

  /**
   * @method
   * @summary convets message to a database model
   */
  toData() {
    return {
      id: this.id,
      title: this.title,
      providerId: this.providerId,
      patientId: this.patientId
    }
  }
}