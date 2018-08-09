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
 * @class Subscription
 * @summary Represents a users subscription to a service
 * @property {string} id The identifier for the subscription
 * @property {string} userId The user id of the patient
 * @property {string} offeringId The offering id of the subscription
 * @property {Date} startingDate The date the subscription begins
 * @property {Date} terminationDate The date the subscription will end
 * @property {Date} nextBillingDate The date of the next billing period
 * @property {number} monthsRemaining The number of months remaining for the given subscription
 * @swagger
 * definitions:
 *  Subscription:
 *      properties:
 *          id: 
 *              type: string
 *              description: The unique identifier for the subscription
 *          userId:
 *              type: string
 *              description: The user id of the patient
 *          offeringId:
 *              type: string
 *              description: The id of the group of services this subscription is subscribed to
 *          startingDate:
 *              type: Date
 *              description: The date the subscription began
 *          terminationDate:
 *              type: Date
 *              description: The date the subscription ends
 *          nextBillingDate:
 *              type: Date
 *              description: The date of the next billing period
 *          monthsRemaining:
 *              type: number
 *              description: The number of months remaining for the given subscription
 */
module.exports = class Subscription extends ModelBase {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.toJSON = this.toJSON.bind(this);
    }

    /**
     * @method
     * @summary Parses the specified dbSubscription into a Subscription instance
     * @param {*} dbSubscription The subscription instance as represented in the database
     * @return {Subscription} The updated subscription instance
     */
    fromData(dbSubscription) {
        this.id = dbSubscription.id;
        this.userId = dbSubscription.user_id;
        this.offeringId = dbSubscription.offering_id;
        this.startingDate = dbSubscription.starting_date;
        this.terminationDate = dbSubscription.termination_date;
        this.nextBillingDate = dbSubscription.next_billing_date;
        this.monthsRemaining = dbSubscription.months_remaining;
        return this;
    }

    /**
     * @method
     * @summary Converts this subscription into a data model subscription
     */
    toData() {
        return {
            id : this.id,
            user_id : this.userId,
            offering_id: this.offeringId,
            starting_date: this.startingDate,
            termination_date: this.terminationDate,
            next_billing_date: this.nextBillingDate,
            months_remaining: this.monthsRemaining
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
            offeringId: this.offering_id,
            startingDate: this.starting_date,
            terminationDate: this.termination_date,
            nextBillingDate: this.next_billing_date,
            monthsRemaining: this.months_remaining
        }
    }
}
