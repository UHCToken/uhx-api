
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

 const Transaction = require('./Transaction'),
    uhc = require('../uhc');


/**
 * @class
 * @summary Represents instructions on airdrops
 * @swagger
 * definitions:
 *  Airdrop:
 *      summary: Represents a distirbution of objects to a series of users
 *      allOf:
 *          - $ref: "#/definitions/Transaction"
 *          - properties:
 *              distribution: 
 *                  description: "Identifies the distribution of tokens"
 *                  $ref: "#/definitions/AirdropDistribution"
 *              plan: 
 *                  description: "Identifies the plan to be executed"
 *                  multiple: true
 *                  $ref: "#/definitions/Transaction"
 *              issues: 
 *                  description: "Identifies distribution issues identified as part of the airdrop planning process"
 *                  multiple: true
 *                  $ref: "#/definitions/RuleViolation"
 *                        
 *  AirdropDistribution:
 *      properties:
 *          mode: 
 *              description: >
 *                  Describes the mode of distribution: 
 *                      * `all` - All users
 *                      * `min` - Users who hold a minimum value
 *                      * `forEach` - For every X asset held by a user
 *                      * `user` - To a specific list of users
 *              type: string
 *              enum: [all, min, forEach, user]
 *          min:
 *              description: When mode is set to min, the minimum amount of an asset the user must have
 *              $ref: "#/definitions/MonetaryAmount"
 *          each:
 *              description: When mode is set to forEach, the "each" amount of an asset the user must have to receive 1 of the distribution
 *              $ref: "#/definitions/MonetaryAmount"
 */
module.exports = class Airdrop extends Transaction {

    /**
     * @constructor
     * @summary Creates a new airdrop and binds the methods to this
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.type = 7;
        this.plan = [];
        this.distribution = {
            mode: null,
            min: null,
            each: null
        };
        this.issues = [];
    }

    /**
     * @method
     * @summary Extracts the transaction data from this instance
     */
    toTransactionData() {
        return this._toData();
    }

    /**
     * @method
     * @summary Copies transaction data from this resource
     * @param {*} dbTransaction The transaction data from the database
     */
    fromTransactionData(dbTransaction) {
        return this._fromData(dbTransaction);
    }
}