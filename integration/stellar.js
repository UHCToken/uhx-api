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

 const Stellar = require('stellar-sdk'),
    uhc = require("./uhc"),
    model = require("../model/model"),
    exception = require('../exception');

/**
 * @class
 * @summary Represents a stellar exception
 */
class StellarException extends exception.Exception {

    /**
     * @constructor
     * @summary Creates a new error from the stellar network
     * @param {*} stellarErr The RAW error from the stellar server
     */
    constructor(stellarErr) {
        super("Error interacting with Stellar network", exception.ErrorCodes.COM_FAILURE, stellarErr);
    }

}

/**
 * @class
 * @summary Provides a wrapper around the stellar client
 */
module.exports = class StellarClient {

    /**
     * @constructor
     * @summary Creates a new stellar client with the specified base API
     * @param {string} horizonApiBase The horizon API server to use
     * @param {Stellar.Asset} stellarAsset The asset on which this client will operate
     * @param {Wallet} distAccount The account from which the asset is distributed
     */
    constructor(horizonApiBase, stellarAsset, distWallet) {
        // "private" members
        var _server = new Stellar.Server(horizonApiBase);
        var _asset = stellarAsset;
        var _distWallet = distWallet;
        this._getAsset = function() { return _asset; }
        this._getServer = function() { return _server; }
        this._getDistWallet = function() { return _distWallet; }

    }

    /**
     * @method
     * @summary Rounds number to the standard decimal places
     * @param {number} number The number to be rounded
     */
    round(number) {
        var factor = Math.pow(10, 8);
        return Math.round(number * factor) / factor;
    }

    /**
     * @property
     * @summary Gets the stellar server instance
     * @type {Stellar.Server}
     */
    get server() { return this._getServer(); }

    /**
     * @property
     * @summary Gets the stellar asset
     * @type {Stellar.Asset}
     */
    get asset() { return this._getAsset(); }

    /**
     * @method
     * @summary Creates a new account on the stellar network
     * @return {Wallet} The constructed wallet instance 
     * @param {number} startingBalance The starting balance of the account
     */
    async instantiateAccount(startingBalance) {

        try {
            // Generate the random KP
            var kp = Stellar.Keypair.random();
            
            // Load distribution account from stellar
            // TODO: Perhaps this can be cached?
            var distAcct = await this.server.loadAccount(this._getDistWallet().address);

            // Create the new account
            var newAcctTx = new Stellar.TransactionBuilder(distAcct)
                .addOperation(Stellar.Operation.createAccount({
                    destination: kp.publicKey(),
                    startingBalance: startingBalance // Initial lumen balance from the central distributor ... 
                })).build();
            
            // Get the source key to create a trust
            var sourceKey = Stellar.Keypair.fromSecret(this._getDistWallet().secret);
            newAcctTx.sign(sourceKey);

            // Submit transaction
            var distResult = await this.server.submitTransaction(newAcctTx);

            console.info(`Account ${kp.publicKey} submitted to Horizon API`);

            // return 
            return new model.Wallet().copy({
                seed: kp.secret(),
                address: kp.publicKey()
            });
        }
        catch(e) {
            console.error(`Account creation has failed : ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Changes trust on userWallet such that the wallet trusts the asset
     * @param {Wallet} userWallet The wallet to establish trust with the asset defined on this class
     */
    async createTrust(userWallet) {

        try {
            // Load stellar user acct
            var stellarAcct = await this.server.loadAccount(userWallet.address);

            // Create change trust account transaction
            var changeTrustTx = new Stellar.TransactionBuilder(stellarAcct)
                .addOperation(Stellar.Operation.changeTrust({
                    asset: this.asset,
                    source: userWallet.address
                })).build();

            // Load signing key
            changeTrustTx.sign(Stellar.Keypair.fromSecret(userWallet.seed));

            // Submit transaction
            var distResult = await this.server.submitTransaction(changeTrustTx);
            
            console.info(`Account ${userWallet.address} trust has been changed to allow ${this.asset.code}`);
        }
        catch(e) {
            console.error(`Account changeTrust has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Gets account information from stellar
     * @param {Wallet} userWallet The user wallet from which account information should be retrieved
     * @returns {Stellar.Account} The account information
     */
    async getAccount(userWallet) {
        try {
            // Load stellar user acct
            var stellarAcct = await this.server.loadAccount(userWallet.address);

            // Round the balances 
            for(var b in stellarAcct.balances)
                stellarAcct.balances[b].balance = this.round(stellarAcct.balances[b].balance);
            
            console.info(`Account ${userWallet.address} has been loaded`);
            
            // TODO: Should we wrap this?
            return stellarAcct;
        }
        catch(e) {
            console.error(`Account changeTrust has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }
}