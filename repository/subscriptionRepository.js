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

const pg = require('pg'),
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
        this.getSubscriptionsForDailyReport = this.getSubscriptionsForDailyReport.bind(this);
        this.getSubscriptionsForMonthlyReport = this.getSubscriptionsForMonthlyReport.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific subscription from the database for a user
     * @param {uuid} id Gets the specified users subscriptions
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions for the user
     */
    async get(userId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE user_id = $1 AND termination_date < $2 OR NULL", [userId, today]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', userId);
            else {
                return await subscriptionArray(rdr);
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
            const now = new Date();
            const today = `${now.getFullYear()}-${("0" + (now.getMonth() + 1)).slice(-2)}-${("0" + now.getDate()).slice(-2)}`;

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query(`SELECT * FROM subscriptions WHERE date_next_payment = ${today}`);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No subscriptions to be billed today.');
            else {
              return await subscriptionArray(rdr);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve the subset of subscribers that should be terminated today
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @return {Subscription} The fetched subscriptions
     */
    async getSubscriptionsToTerminate(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            const now = new Date();
            const today = `${now.getFullYear()}-${("0" + (now.getMonth() + 1)).slice(-2)}-${("0" + now.getDate()).slice(-2)}`;

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query(`SELECT * FROM subscriptions WHERE date_terminated = ${today}`);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No subscriptions to be terminated today.');
            else {
              return await subscriptionArray(rdr);
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
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE effective_date >= $1 AND termination_date < $1 OR NULL", [today]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No Subscriptions found.');
            else {
                return await subscriptionArray(rdr);
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
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE termination_date IS NULL OR termination_date < $1", [new Date()]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No Subscriptions found.');
            else {
                return await subscriptionArray(rdr);
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
