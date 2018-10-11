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
    uhx = require('../uhx');

/**
 * @class
 * @summary Represents a balance in the UHX data store
 * @swagger
 * definitions:
 *  Balance:
 *      properties:
 *          id:
 *              type: string
 *              description: The unique identifier for the balance
 *          user_id:
 *              type: string
 *              description: The user the balance belongs to
 *          balance:
 *              type: number
 *              description: The balance of the currency type
 *          currency:
 *              $ref: string
 *              description: The type of currency
 */
module.exports = class Balance extends ModelBase {

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
     * @summary Parses the specified dbBalance into a Balance instance
     * @param {*} dbBalance The balance instance as represented in the database
     * @return {Balance} The updated balance instance
     */
    fromData(dbBalance) {
        this.id = dbBalance.id;
        this.userId = dbBalance.user_id;
        this.amount = dbBalance.amount;
        this.currency = dbBalance.currency;
        this.creationTime = dbBalance.creation_time;
        this.updatedTime = dbBalance.updated_time;
        this.deactivationTime = dbBalance.deactivation_time;
        return this;
    }

    /**
     * @method
     * @summary Converts this balance into a data model balance
     */
    toData() {
        return {
            id : this.id,
            user_id : this.userId,
            amount : this.amount,
            currency : this.currency
        };
    }

    /**
     * @method
     * @summary Represents this object as JSON
     */
    toJSON() {
        return {
            id : this.id,
            userId : this.user_id,
            amount : this.amount,
            currency : this.currency
        }
    }
}
