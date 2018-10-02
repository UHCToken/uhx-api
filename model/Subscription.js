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
 * @property {Date} dateTerminated The date the subscription was terminated
 * @property {Date} dateExpired The date the subscription will end
 * @property {Date} dateNextPayment The date of the next billing period
 * @property {number} periodInMonths The number of months remaining
 * @property {boolean} autoRenew Represents if the billing cycle is auto-renewed
 * @property {number} price The cost of the subscription for the given offering
 * @property {string} currency The currency code for the given offering
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
 *          userId:
 *              type: string
 *              desription: The id of the user associated with this patient
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
 *              description: The date the subscription was manually terminated
 *          dateNextPayment:
 *              type: Date
 *              description: The date of the next billing period
 *          periodInMonths:
 *              type: number
 *              description: The number of months between subscription payments
 *          price:
 *              type: number
 *              description: The amount paid for the subscription
 *          dateExpired:
 *              type: Date
 *              description: The date that the subscription expires
 *          currency:
 *              type: string
 *              description: the currency the subscription was paid for in
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
        this.id = dbSubscription.id || dbSubscription.subscription_id;
        this.patientId = dbSubscription.patient_id;
        this.userId = dbSubscription.user_id;
        this.offeringId = dbSubscription.offering_id;
        this.offeringGroupId = dbSubscription.offering_group_id;
        this.dateSubscribed = dbSubscription.date_subscribed !== null ? dbSubscription.date_subscribed.toLocaleString() : null;
        this.dateTerminated = dbSubscription.date_terminated !== null ? dbSubscription.date_terminated.toLocaleString() : null;
        this.dateExpired = dbSubscription.date_expired !== null ? dbSubscription.date_expired.toLocaleString() : null;
        this.dateNextPayment = dbSubscription.date_next_payment !== null ? dbSubscription.date_next_payment.toLocaleString() : null;
        this.periodInMonths = dbSubscription.period_in_months;
        this.autoRenew = dbSubscription.auto_renew;
        this.price = dbSubscription.price;
        this.currency = dbSubscription.currency;
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
            user_id : this.userId,
            offering_id: this.offeringId,
            offering_group_id: this.offeringGroupId,
            date_subscribed: this.dateSubscribed,
            date_terminated: this.dateTerminated,
            date_expired: this.dateExpired,
            date_next_payment: this.dateNextPayment,
            period_in_months: this.periodInMonths,
            auto_renew: this.autoRenew,
            price: this.price,
            currency: this.currency
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
            userId : this.userId,
            offeringId: this.offeringId,
            offeringGroupId: this.offeringGroupId,
            dateSubscribed: this.dateSubscribed,
            dateTerminated: this.dateTerminated,
            dateExpired: this.dateExpired,
            dateNextPayment: this.dateNextPayment,
            periodInMonths: this.periodInMonths,
            autoRenew: this.autoRenew,
            price: this.price,
            currency: this.currency
        }
    }
}
