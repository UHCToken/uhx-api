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
    Purchase = require("../model/Purchase"),
    security = require('../security');

 /**
  * @class 
  * @summary Represents the purchase repository logic
  */
 module.exports = class PurchaseRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific purchase from the database
     * @param {uuid} id Gets the specified purchase
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Purchase} The fetched purchase
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM purchase WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('purchase', id);
            else
                return new Purchase().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieve all purhcases made by a specific user
     * @param {uuid} userId The identity of the user to retrieve
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Purchase} The fetched purchases
     */
    async getByUserId(userId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT purchase.* FROM purchase WHERE buyer_id = $1", [userId]);
            var retVal = [];
            rdr.rows.forEach(o=>retVal.push(new Purchase().fromData(o)));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Update the specified purchase
     * @param {Puarchse} purchase The instance of the purchase that is to be updated
     * @param {Principal} runAs The principal that is updating this purchase 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Purchase} The updated purchase data from the database
     */
    async update(purchase, runAs, _txc) {

        if(!purchase.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbPurchase = purchase.toData();
            dbPurchase.updated_by = runAs.session.userId;
            var updateCmd = model.Utils.generateUpdate(dbPurchase, 'purchase', 'updated_time');

            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not update purchase in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return purchase.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    
    /**
     * @method
     * @summary Insert  the specified purchase
     * @param {Purchase} purchase The instance of the wallet that is to be inserted
     * @param {Principal} runAs The principal that is inserting this wallet 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Purchase} The inserted purchase
     */
    async insert(purchase, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            var dbPurchase = purchase.toData();
            delete(dbPurchase.id);
            dbPurchase.created_by = runAs.session.userId;
            var insertCmd = model.Utils.generateInsert(dbPurchase, 'purchase');

            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not register purchase in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return purchase.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

}
