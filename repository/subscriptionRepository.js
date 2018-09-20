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

const exception = require('../exception'),
    model = require('../model/model'),
    config = require('../config'),
    moment = require('moment'),
    uhx = require('../uhx'),
    pg = require('pg');

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
        this.getSubscriptionsForDailyReportToKaris = this.getSubscriptionsForDailyReportToKaris.bind(this);
        this.getSubscriptionsForMonthlyReportToKaris = this.getSubscriptionsForMonthlyReportToKaris.bind(this);
        this.getSubscriptionsForDailyReportToTeladoc = this.getSubscriptionsForDailyReportToTeladoc.bind(this);
        this.getSubscriptionsForMonthlyReportToTeladoc = this.getSubscriptionsForMonthlyReportToTeladoc.bind(this);
        this.getSubscriptionsToBill = this.getSubscriptionsToBill.bind(this);
        this.updateBilledSubscription = this.updateBilledSubscription.bind(this);
        this.terminateSubscription = this.terminateSubscription.bind(this);
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
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscription_lookup WHERE patient_id = $1", [patientId]);
            if (rdr.rows.length === 0)
                return [];
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not retrieve patient subscriptions: ${ex}`);

            throw new exception.Exception('Error occurred while retrieving patient subscriptions', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
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
            if (!_txc) await dbc.connect();

            const today = moment().format('YYYY-MM-DD');

            // Get subscriptions to bill today
            const rdr = await dbc.query('SELECT * FROM subscription_lookup WHERE date_expired = $1', [today]);

            if (rdr.rows.length === 0) {
                // No subscriptions to bill
                return [];
            }
            else {
                return await this.subscriptionArray(rdr);
            }
        } catch (ex) {
            uhx.log.error(`Could not pull subscriptions to bill: ${ex}`);

            throw new exception.Exception('Error occurred while retrieving subscriptions for billing', exception.ErrorCodes.DATABASE_ERROR);
        } finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update next billing dates of succesfully billed accounts
     * @param {UUID} patientIds Array of patients that were succesfully billed
     */
    async updateBilledSubscription(subscription, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const nextPaymentDate = moment().add(subscription.periodInMonths, 'months').format('YYYY-MM-DD');

            // Update subscription data
            await dbc.query(`UPDATE subscriptions SET date_next_payment = '${nextPaymentDate}', date_expired = '${nextPaymentDate}' WHERE id = '${subscription.id}';`);

            // Track succesful payments made
            await dbc.query(`INSERT INTO subscription_payments (subscription_id, offering_id, patient_id, date_paid, price, currency, transaction_result)
            VALUES ('${subscription.id}', '${subscription.offeringId}', '${subscription.patientId}', '${moment().format('YYYY-MM-DD')}', '${subscription.price}', '${subscription.currency}', '${subscription.status}')`);
        } catch (ex) {
            uhx.log.error(`Could not update billed subscriptions: ${ex}`);

            throw new exception.Exception('Error occurred while updating subscriptions', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update termination date of a subscription
     * @param {Subscription} subToTerminate Subscription to terminated
     */
    async terminateSubscription(subToTerminate, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const todaysDate = moment().format('YYYY-MM-DD');
            let terminationDate;

            // If the current time is after the upload time, the termination date will not be until the day after
            if (this.isCurrentTimeBeforeConfiguredTime(config.reportingUploadTime)) {
                terminationDate = todaysDate;
            } else {
                terminationDate = moment().add(1, 'days').format('YYYY-MM-DD');
            }

            const query = (`UPDATE subscriptions SET date_terminated = '${[terminationDate]}', date_next_payment = NULL, auto_renew = FALSE WHERE id = '${subToTerminate.id}';`);
            await dbc.query(query);
        } catch (ex) {
            uhx.log.error(`Could not pull subscriptions to terminate: ${ex}`);

            throw new exception.Exception('Error occurred while updating subscriptions', exception.ErrorCodes.DATABASE_ERROR);
        } finally {
            if (!_txc) dbc.end();
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
            if (!_txc) await dbc.connect();
            let subscriptionDate,
                nextPaymentDate;

            // If subscription occurs after the configured time time; the subscription will not be active for 2 more days
            if (this.isCurrentTimeBeforeConfiguredTime(config.reportingUploadTime)) {
                subscriptionDate = moment().add(1, 'days');
            } else {
                subscriptionDate = moment().add(2, 'days');
            }

            const offering = await dbc.query("SELECT * FROM offerings WHERE id = $1", [offeringId]);
            const dateSubscribed = new Date(subscriptionDate);
            const subscriptionExpiryDate = subscriptionDate.add(offering.rows[0].period_in_months, 'months');

            if (autoRenew) {
                nextPaymentDate = subscriptionExpiryDate;
            }

            const rdr = await dbc.query("INSERT INTO subscriptions (offering_id, patient_id, date_next_payment, date_subscribed, auto_renew, date_expired) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [offeringId, patientId, nextPaymentDate, dateSubscribed, autoRenew, subscriptionExpiryDate]);

            if (rdr.rows.length === 0)
                throw new exception.Exception('Error inserting data', exception.ErrorCodes.DATABASE_ERROR);
            else {
                const subscriptionRdr = await dbc.query("SELECT * FROM subscription_lookup WHERE subscription_id = $1", [rdr.rows[0].id]);

                return new model.Subscription().fromData(subscriptionRdr.rows[0]);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not create new subscription: ${ex}`);

            throw new exception.Exception('Error creating subscription', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
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
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE subscriptions SET offering_id = $1, auto_renew = $2 WHERE id = $3 RETURNING *", [offeringId, autoRenew, subscriptionId]);
            if (rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', patientId);
            else {
                return new model.Subscription().fromData(rdr.rows[0]);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not update subscription: ${ex}`);

            throw new exception.Exception('Error updating subscription', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
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
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE subscriptions SET date_next_payment = null, auto_renew = FALSE WHERE id = $1 RETURNING *", [subscriptionId]);

            if (rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', subscriptionId);
            else {
                const subscriptionRdr = await dbc.query("SELECT * FROM subscription_lookup WHERE subscription_id = $1", [rdr.rows[0].id]);

                return new model.Subscription().fromData(subscriptionRdr.rows[0]);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not cancel subscription: ${ex}`);

            throw new exception.Exception('Error cancelling subscription', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that have current subscriptions for today
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForDailyReportToKaris(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM karis_daily_reports");
            if (rdr.rows.length === 0)
                return [];
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not retrieve subscriptions for Karis daily reporting: ${ex}`);

            throw new exception.Exception('Error retrieving subscriptions for Karis daily reporting', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that an active membership for the previous month
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForMonthlyReportToKaris(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM karis_monthly_reports");
            if (rdr.rows.length === 0)
                return [];
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not retrieve subscriptions for Karis monthly reporting: ${ex}`);

            throw new exception.Exception('Error retrieving subscriptions for Karis monthly reporting', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
    * @method
    * @summary Retrieve a set of subscribers from the database that have current subscriptions for today
    * @param {Client} _txc The postgresql connection with an active transaction to run in
    * @returns {Subscription} The fetched subscriptions
    */
    async getSubscriptionsForDailyReportToTeladoc(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM teladoc_daily_reports");
            if (rdr.rows.length === 0)
                return [];
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not retrieve subscriptions for Teladoc daily reporting: ${ex}`);

            throw new exception.Exception('Error retrieving subscriptions for Teladoc daily reporting', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that an active membership for the previous month
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForMonthlyReportToTeladoc(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM teladoc_monthly_reports");
            if (rdr.rows.length === 0)
                return [];
            else {
                return await this.subscriptionArray(rdr);
            }
        }
        catch (ex) {
            uhx.log.error(`Could not retrieve subscriptions for Teladoc monthly reporting: ${ex}`);

            throw new exception.Exception('Error retrieving subscriptions for Teladoc monthly reporting', exception.ErrorCodes.DATABASE_ERROR);
        }
        finally {
            if (!_txc) dbc.end();
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

    /**
     * @method
     * @summary Compares the current time with a time set in the configuration
     * @param {string} time A string representation of a desired time, format "HH:MM" 
     * @returns {Subscription} array of subscriptions
     */
    async isCurrentTimeBeforeConfiguredTime(time) {
        const currentHour = parseInt(moment().format('hh'));
        const currentMins = parseInt(moment().format('mm'));

        const configTime = time.split(':');
        const configHour = parseInt(configTime[0]);
        const configMins = parseInt(configTime[1]);

        if (currentHour >= configHour && currentMins >= configMins) {
            return false;
        }

        return true;
    }
}
