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
    Transaction = require("../model/Transaction"),
    security = require('../security');

 /**
  * @class 
  * @summary Represents the purchase repository logic
  */
 module.exports = class TransactionRepository {

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
        this.getByHash = this.getByHash.bind(this);
        this.getByBatch = this.getByBatch.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific purchase from the database
     * @param {uuid} id Gets the specified purchase
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Transaction} The fetched purchase
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM transactions LEFT JOIN purchase USING (id) WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('purchase', id);
            else
                return new Transaction().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    
    /**
     * @method
     * @summary Retrieve a transactions by batch id
     * @param {uuid} batchId Gets the specified batch
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Array<Transaction>} The fetched transactions
     */
    async getByBatch(batchId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM transactions LEFT JOIN purchase USING (id) WHERE batch_id = $1 ORDER BY seq_id", [batchId]);
            return rdr.rows.map(r=>{
                if(r.type_id == "2") {
                    var p = new Purchase().fromData(r)._fromData(r);
                    return p;
                }
                else
                    return new Transaction().fromData(r);
            });
        }
        finally {
            if(!_txc) dbc.end();
        }

    }
    
    /**
     * @method
     * @summary Retrieve a specific transaction from the database by the hash of its id
     * @param {uuid} idHash The hash of the transaction ID or batch to fetch
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Transaction} The fetched purchase
     */
    async getByHash(idHash, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM transactions LEFT JOIN purchase USING (id) WHERE digest(id::TEXT, 'sha256') = $1 OR digest(batch_id::TEXT, 'sha256') = $1 ORDER BY seq_id", [idHash]);
            var retVal = rdr.rows.map(r=> {
                if(r.type_id == "2") {
                    var p = new Purchase().fromData(r)._fromData(r);
                    return p;
                }
                else
                    return new Transaction().fromData(r);
            });
            return retVal;
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
    async getPurchasesByUserId(userId, _txc) {
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
     * @summary Retrieve all transactions made by a specific user
     * @param {uuid} userId The identity of the user who was the payor
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Purchase} The fetched purchases
     */
    async getByPayor(userId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT transactions.* FROM transactions " + 
                " LEFT JOIN wallets payor_wallet ON (payor_wallet.id = transactions.payor_wallet_id) " +
                " LEFT JOIN wallets payee_wallet ON (payee_wallet.id = transactions.payee_wallet_id) " + 
                " LEFT JOIN wallets payor ON (payor_wallet.user_id = payor.id) " +
                " LEFT JOIN wallets payee ON (payee_wallet.user_id = payee.id) " + 
                " WHERE payee.id = $1 OR payor.id = $1", [userId]);
            var retVal = [];
            rdr.rows.forEach(o=>retVal.push(new Transaction().fromData(o)));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified purchase
     * @param {Purchase} purchase The instance of the transaction that is to be updated
     * @param {Principal} runAs The principal that is updating this purchase 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Purchase} The updated purchase data from the database
     */
    async updatePurchase(purchase, runAs, _txc) {

        if(!purchase.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        else if(!(purchase instanceof Purchase))
            throw new exception.ArgumentException("purchase");

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
     * @summary Update the specified transaction
     * @param {Transaction} transaction The instance of the transaction that is to be updated
     * @param {Principal} runAs The principal that is updating this purchase 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Transaction} The updated purchase data from the database
     */
    async update(transaction, runAs, _txc) {

        if(!transaction.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            // if the transaction is a purchase we need the transaction data not purchase data
            var dbTransaction = transaction.toTransactionData ? transaction.toTransactionData() : transaction.toData();
            dbTransaction.updated_by = runAs.session.userId;
            var updateCmd = model.Utils.generateUpdate(dbTransaction, 'transactions', 'updated_time');

            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not update transaction in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return transaction.fromTransactionData ? transaction.fromTransactionData(rdr.rows[0]) : transaction.fromData(rdr.rows[0]);
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
    async insertPurchase(purchase, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            var dbPurchase = purchase.toData();
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

    /**
     * @method
     * @summary Insert  the specified transaction
     * @param {Transaction} transaction The instance of the transaction that is to be inserted
     * @param {Principal} runAs The principal that is inserting this transaction
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Transaction} The inserted purchase
     */
    async insert(transaction, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            var dbTransaction = transaction.toTransactionData ? transaction.toTransactionData() : transaction.toData();
            delete(dbTransaction.id);
            dbTransaction.created_by = runAs.session.userId;
            var insertCmd = model.Utils.generateInsert(dbTransaction, 'transactions');

            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not register transaction in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return transaction.fromTransactionData ? transaction.fromTransactionData(rdr.rows[0]) : transaction.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

}
