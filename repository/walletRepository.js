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
    security = require('../security');

 /**
  * @class WalletRepository
  * @summary Represents the wallet repository logic
  */
 module.exports = class WalletRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific wallet from the database
     * @param {uuid} id Gets the specified wallet
     */
    async get(id) {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM wallets WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('wallet', id);
            else
                return new model.Wallet().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }

    }


    /**
     * @method
     * @summary Update the specified wallet
     * @param {Wallet} wallet The instance of the wallet that is to be updated
     * @param {Principal} runAs The principal that is updating this wallet 
     * @returns {Wallet} The updated wallet data from the database
     */
    async update(wallet, runAs) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            var updateCmd = model.Utils.generateUpdate(wallet, 'wallets', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                return null;
            else
                return wallet.fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }
    }

    
    /**
     * @method
     * @summary Insert  the specified wallet
     * @param {Wallet} wallet The instance of the wallet that is to be inserted
     * @param {Principal} runAs The principal that is inserting this wallet 
     */
    async insert(wallet, runAs) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            var dbWallet = wallet.toData();
            var updateCmd = model.Utils.generateInsert(dbWallet, 'wallets');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                return null;
            else
                return wallet.fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a wallet in the system
     * @param {string} walletId The identity of the wallet to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     */
    async delete(walletId, runAs) {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            const rdr = await dbc.query("UPDATE wallet SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", walletId);
            if(rdr.rows.length == 0)
                return null;
            else
                return new model.Wallet().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }

    }
}
