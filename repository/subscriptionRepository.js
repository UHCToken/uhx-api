/// <Reference path="../model/model.js"/>
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

const uhx = require('../uhx'),
    pg = require('pg'),
    moment = require('moment'),
    momentTimezone = require('moment-timezone'),
    exception = require('../exception'),
    model = require('../model/model');

 /**
  * @class
  * @summary Represents the subscription repository logic
  */
 module.exports = class SubscriptionRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.post = this.post.bind(this);
        this.update = this.update.bind(this);
        this.getSubscriptionsForDailyReport = this.getSubscriptionsForDailyReport.bind(this);
        this.getSubscriptionsForMonthlyReport = this.getSubscriptionsForMonthlyReport.bind(this);
        this.getSubscriptionsToBill = this.getSubscriptionsToBill.bind(this);
        this.updateBilledSubscriptions = this.updateBilledSubscriptions.bind(this);
        this.terminateSubscriptions = this.terminateSubscriptions.bind(this);
    }

    /**
     * @method
     * @summary Retrieve the subscriptions from the database for a patient
     * @param {patientId} id Gets the specified patient's subscriptions
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions for the patient
     */
    async get(patientId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscription_lookup WHERE patient_id = $1", [patientId]);
            if(rdr.rows.length === 0)
                return [];
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve the subset of subscribers that should be billed today
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @return {Subscription} The fetched subscriptions
     */
    async getSubscriptionsToBill(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            // Today's date
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);

            // Get subscriptions to bill today
            const rdr = await dbc.query('SELECT * FROM subscription_lookup WHERE date_next_payment = $1', [today]);

            if(rdr.rows.length === 0) {
                // No subscriptions to bill
                return [];
            }
            else {
              return await this.subscriptionArray(rdr);
            }
        } catch (er) {
            uhx.log.error(`Could not pull subscriptions to bill: ${ex}`);
        } finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update next billing dates of succesfully billed accounts
     * @param {UUID} patientIds Array of patients that were succesfully billed
     */
    async updateBilledSubscriptions(updateValues, insertValues, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            // Update subscription data
            dbc.query(
              `INSERT INTO subscriptions (id, offering_id, patient_id, date_next_payment, date_expired)
               VALUES ${updateValues}
               ON CONFLICT (id) DO UPDATE SET date_next_payment = EXCLUDED.date_next_payment;`);

           // Track succesful payments made
            await dbc.query(
             `INSERT INTO subscription_payments (subscription_id, offering_id, patient_id, date_paid, price, currency, transaction_result)
              VALUES ${insertValues}`);
        } catch(ex) {
          uhx.log.error(`Could not update billed subscriptions: ${ex}`);
        }
        finally {
          if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update termination date of all subscriptions expiring today
     * @param {[UUID]} ids Subscription ids that should be terminated
     * @param {String} todaysDate Todays date, for termination date value 
     */
    async terminateSubscriptions(today, subsToTerminate, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {

            if(!_txc) await dbc.connect();

            const query = (`UPDATE subscriptions SET date_terminated='${[today]}', date_next_payment=NULL WHERE date_expired='${[today]}' AND auto_renew=false;
                            UPDATE subscriptions SET date_terminated='${[today]}', date_next_payment=NULL WHERE id IN (${subsToTerminate.toString()});`);
            await dbc.query(query);

        } catch (ex) {
            uhx.log.error(`Could not pull subscriptions to terminate: ${ex}`);
        } finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Adds a new subscription for the patient
     * @param {patientId} id The identifier for the patient that is making the subscription
     * @param {offeringId} id The identifier for the offering that the patient subscribed to
     * @param {autoRenew} bool The flag that represents if the subscription will renew automatically
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions for the patient
     */
    async post(patientId, offeringId, autoRenew, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);

        try {
            if(!_txc) await dbc.connect();
            let subscriptionDate,
                nextPaymentDate;

            const now = parseInt(momentTimezone().tz('America/Chicago').format('hh'));

            // If subscription occurs after 9pm Central time; the subscription will not be active for 2 more days
            if (now >= 21) {
                subscriptionDate = moment().add(2, 'days');
            } else {
                subscriptionDate = moment().add(1, 'days');
            }

            const offering = await dbc.query("SELECT * FROM offerings WHERE id = $1", [offeringId]);
            const dateSubscribed = new Date(subscriptionDate);
            const subscriptionExpiryDate = subscriptionDate.add(offering.rows[0].period_in_months, 'months');

            if (autoRenew) {
                nextPaymentDate = subscriptionExpiryDate;
            }

            const rdr = await dbc.query("INSERT INTO subscriptions (offering_id, patient_id, date_next_payment, date_subscribed, auto_renew, date_expired) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [offeringId, patientId, nextPaymentDate, dateSubscribed, autoRenew, subscriptionExpiryDate]);
            
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', patientId);
            else {
                const subscriptionRdr = await dbc.query("SELECT * FROM subscription_lookup WHERE subscription_id = $1", [rdr.rows[0].id]);

                return new model.Subscription().fromData(subscriptionRdr.rows[0]);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Updates a given subscription for a patient
     * @param {subscriptionId} id The identifier for the subscription to update
     * @param {offeringId} id The identifier for new offer the patient is subscribing to
     * @param {autoRenew} bool The flaf representing if the given subscription will renew automatically
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The updated subscriptions for the patinet
     */
    async update(subscriptionId, offeringId, autoRenew, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("UPDATE subscriptions SET offering_id = $1, auto_renew = $2 WHERE id = $3 RETURNING *", [offeringId, autoRenew, subscriptionId]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', patientId);
            else {
                return new model.Subscription().fromData(rdr.rows[0]);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Cancels a given subscription for a patient
     * @param {subscriptionId} id The identifier for the subscription to cancel
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The updated subscriptions for the patinet
     */
    async cancel(subscriptionId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const today = new Date();
            const rdr = await dbc.query("UPDATE subscriptions SET date_next_payment = null, date_terminated = $1 WHERE id = $2 RETURNING *", [today, subscriptionId]);

            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', subscriptionId);
            else {
                const subscriptionRdr = await dbc.query("SELECT * FROM subscription_lookup WHERE subscription_id = $1", [rdr.rows[0].id]);

                return new model.Subscription().fromData(subscriptionRdr.rows[0]);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that have current subscriptions for today
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForDailyReport(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE date_terminated IS NULL OR date_terminated = $1", [today]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No Subscriptions found.');
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that an active membership for the previous month
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForMonthlyReport(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE date_terminated IS NULL OR date_terminated < $1", [new Date()]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No Subscriptions found.');
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Pushes subscription response from database into an array
     * @param {DB Response} rdr Object holding the returned subscriptions
     * @returns {Subscription} array of subscriptions
     */
    async subscriptionArray(rdr) {
      const subscriptions = [];

      for (let i = 0; i < rdr.rows.length; i++) {
          subscriptions.push(new model.Subscription().fromData(rdr.rows[i]))
      }

      return subscriptions;
    }
 }
