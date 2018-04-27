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

 const ModelBase = require('./ModelBase'),
    User = require('./User');

/**
 * @class
 * @extends {ModelBase}
 * @summary Represents a contract or a promise to transact something between two or more UHC users
 * @swagger
 * definitions:
 *  Contract:
 *      properties:
 *          originUserId:
 *              type: string
 *              description: The user which is creating this instance of the contract
 *          destUserId:
 *              type: string
 *              description: The id of the user which is expected to fulfill this contract (the payor for example)
 *          originUser:
 *              $ref: "#/definitions/User"
 *          destUser:
 *              $ref: "#/definitions/User"
 *          type:
 *              type: string
 *              description: "The type of contract to be constructed. This can be fetched using the /Contract metadata on the API. Examples include: Request for Payment, Recurring Payment, Escrow, etc."
 *          startDate: 
 *              type: Date
 *              description: The date when the contract is scheduled to become active
 *          endDate:
 *              type: Date
 *              description: The date when the contract expires
 *          immutable:
 *              type: boolean
 *              description: Indicates whether the contract can be cancelled or updated
 *          recurrence:
 *              type: string
 *              description: The recurrence of the contract action
 *              enum:
 *                  - 1w
 *                  - 2w
 *                  - 0.5mo
 *                  - 1mo
 *                  - 1a
 *          state:
 *              type: string
 *              description: The state of the contract
 *              enum:
 *                  - pending
 *                  - active
 *                  - completed
 *                  - canceled
 *          action:
 *              type: any
 *              description: Parameters which are defined by the type of contract indicating the actions to be taken
 */
module.exports = class Contract extends ModelBase {

    /**
     * @constructor
     * @summary Creates a new instance of a contract
     * @param {User} originUser The user which is originating this contract
     * @param {User} destUser The user(s) which are party to this contract
     * @param {string} type The contract template to be used (identifies the type of Stellar transactions to be created)
     * @param {Date} startDate The date when the contract is to become valid
     * @param {Date} endDate The date when the contract expires
     * @param {boolean} immutable Indicates whether the contract is immutable
     * @param {string} recurrence The recurrence of the contract (when it should be executed: example 1w, 1mo, 2w)
     * @param {*} action Details to be attached to the contract such as an invoice, subscription, etc.
     */
    constructor(originUser, destUser, type, startDate, endDate, immutable, recurrence, action) {

    }

}
