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
 * @property {string} patientId The user id of the patient
 * @property {string} offeringId The offering id of the subscription
 * @property {string} offeringGroupId The offering group id of the subscription
 * @property {Date} dateSubscribed The date the subscription begins
 * @property {Date} dateTerminated The date the subscription will end
 * @property {Date} dateNextPayment The date of the next billing period
 * @property {number} monthsRemaining The number of months remaining for the given subscription
 * @property {boolean} autoRenew Represents if the billing cycle is auto-renewed
 * @swagger
 * definitions:
 *  Subscription:
 *      properties:
 *          id: 
 *              type: string
 *              description: The unique identifier for the subscription
 *          patientId:
 *              type: string
 *              description: The id of the patient
 *          offeringId:
 *              type: string
 *              description: The id of the group of services this subscription is subscribed to
 *          offeringGroupId:
 *              type: string
 *              description: The id of the group offering this subscription is subscribed to
 *          dateSubscribed:
 *              type: Date
 *              description: The date the subscription began
 *          dateTerminated:
 *              type: Date
 *              description: The date the subscription ends
 *          dateNextPayment:
 *              type: Date
 *              description: The date of the next billing period
 *          monthsRemaining:
 *              type: number
 *              description: The number of months remaining for the given subscription
 *          autoRenew:
 *              type: boolean
 *              description: Represents if the billing cycle is auto-renewed
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
        this.id = dbSubscription.subscription_id;
        this.patientId = dbSubscription.patient_id;
        this.offeringId = dbSubscription.offering_id;
        this.offeringGroupId = dbSubscription.offering_group_id;
        this.dateSubscribed = dbSubscription.date_subscribed !== null ? dbSubscription.date_subscribed.toLocaleString() : null;
        this.dateTerminated = dbSubscription.date_terminated !== null ? dbSubscription.date_terminated.toLocaleString() : null;
        this.dateNextPayment = dbSubscription.date_next_payment !== null ? dbSubscription.date_next_payment.toLocaleString() : null;
        // this.monthsRemaining = dbSubscription.months_remaining;
        this.autoRenew = dbSubscription.auto_renew;
        return this;
    }

    /**
     * @method
     * @summary Converts this subscription into a data model subscription
     */
    toData() {
        return {
            id : this.id,
            patient_id : this.patientId,
            offering_id: this.offeringId,
            offering_group_id: this.offeringGroupId,
            date_subscribed: this.dateSubscribed,
            date_terminated: this.dateTerminated,
            date_next_payment: this.dateNextPayment,
            // months_remaining: this.monthsRemaining,
            auto_renew: this.autoRenew
        };
    }

    /**
     * @method
     * @summary Represents this object as JSON
     */
    toJSON() {
        return {
            id : this.id,
            patientId : this.patientId,
            offeringId: this.offeringId,
            offeringGroupId: this.offeringGroupId,
            dateSubscribed: this.dateSubscribed,
            dateTerminated: this.dateTerminated,
            dateNextPayment: this.dateNextPayment,
            // monthsRemaining: this.monthsRemaining,
            autoRenew: this.autoRenew
        }
    }
}
