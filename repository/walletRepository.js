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
    Wallet = require("../model/Wallet"),
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
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Wallet} The fetched wallet
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM wallets WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('wallet', id);
            else
                return new model.Wallet().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieve a specific wallet from the database
     * @param {uuid} userId The identity of the user to retrieve
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Wallet} The fetched wallet
     */
    async getByUserId(userId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT wallets.* FROM wallets INNER JOIN users ON (users.wallet_id = wallets.id) WHERE users.id = $1", [userId]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('wallet', id);
            else
                return new model.Wallet().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Update the specified wallet
     * @param {Wallet} wallet The instance of the wallet that is to be updated
     * @param {Principal} runAs The principal that is updating this wallet 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Wallet} The updated wallet data from the database
     */
    async update(wallet, runAs, _txc) {

        if(!wallet.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var updateCmd = model.Utils.generateUpdate(wallet, 'wallets', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not update wallet in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return wallet.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    
    /**
     * @method
     * @summary Insert  the specified wallet
     * @param {Wallet} wallet The instance of the wallet that is to be inserted
     * @param {Principal} runAs The principal that is inserting this wallet 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Wallet} The inserted wallet
     */
    async insert(wallet, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        console.log(wallet)
        try {
            if(!_txc) await dbc.connect();
            var dbWallet = wallet.toData();
            delete(dbWallet.id);
            var updateCmd = model.Utils.generateInsert(dbWallet, 'wallets');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not register wallet in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return wallet.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a wallet in the system
     * @param {string} walletId The identity of the wallet to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Wallet} The deactivated wallet
     */
    async delete(walletId, runAs, _txc) {

        if(!walletId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE wallet SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [walletId]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not deactivate wallet in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new model.Wallet().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc)  dbc.end();
        }

    }
    
    /**
     * @method
     * @summary Delete / de-activate a wallet in the system given the user id that owns the wallet
     * @param {string} userId The identity of the user whose wallet is to be deleted
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Wallet} The deactivated wallet
     */
    async deleteByUserId(userId, runAs, _txc) {

        if(!userId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) {
                await dbc.connect();
                await dbc.query("BEGIN TRANSACTION");
            }

            const rdr = await dbc.query("UPDATE wallet SET deactivation_time = CURRENT_TIMESTAMP WHERE id IN (SELECT wallet_id FROM users WHERE id = $1) RETURNING *", [userId]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not deactivate wallet in data store", exception.ErrorCodes.DATA_ERROR);
            else {
                var retVal = new model.Wallet().fromData(rdr.rows[0]);
                await dbc.query("UPDATE users SET wallet_id = NULL WHERE id = $1", [userId]); // Remove association
                await dbc.query("COMMIT");
                return retVal;
            }
        }
        catch (e) {
            if(!_txc) await dbc.query("ROLLBACK");
            throw e;
        }
        finally {
            if(!_txc)  dbc.end();
        }

    }
}
