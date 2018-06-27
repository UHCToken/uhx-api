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
    model = require('../model/model'),
    Balance = require("../model/Balance"),
    security = require('../security');

/**
 * @class BalanceRepository
 * @summary Represents the balance repository logic
 */
module.exports = class BalanceRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.getByUserId = this.getByUserId.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific balance from the database
     * @param {uuid} userId The identity of the user to retrieve the balance for
     * @param {String} currency The type of currency to provide the balance of
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Number} The fetched balance
     */
    async getByUserId(userId, currency, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM balances WHERE id = $1 AND currency = $2", [userId, currency]);
            if (rdr.rows.length == 0)
                return null;
            else
                return new model.Balance().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieve all balances from the database
     * @param {uuid} userId The identity of the user to retrieve the balance for
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Object} The fetched balances
     */
    async getAllForUserId(userId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM balances WHERE id = $1", [userId]);
            var retVal = rdr.rows.map(r => new model.Balance().fromData(r));
            return retVal;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Update the specified balance
     * @param {Object} balance The balance that is to be updated
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Object} The updated balance data from the database
     */
    async update(balance, _txc) {

        if (!balance.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var updateCmd = model.Utils.generateUpdate(balance, 'balances');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update balance in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return balance.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }


    /**
     * @method
     * @summary Insert the a balance for the specified user
     * @param {Object} balance The instance of the balance to be inserted
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Object} The inserted balance details
     */
    async insert(balance, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            var dbBalance = balance.toData();
            var updateCmd = model.Utils.generateInsert(dbBalance, 'balances');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register balance in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return balance.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a balance in the system
     * @param {string} userId The user identity of the balance to delete
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Object} The deactivated balance
     */
    async delete(userId, _txc) {

        if (!userId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE balances SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [userId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not deactivate balance in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new model.Balance().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }
}
