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
    uhc = require("../uhc"),
    model = require("../model/model"),
    Asset = require('../model/Asset'),
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
     * @param {Asset} stellarAsset The asset(s) on which this client will operate
     * @param {boolean} useTestNetwork When true, instructs the client to use the test network
     */
    constructor(horizonApiBase, stellarAsset, useTestNetwork) {
        // "private" members
        if (useTestNetwork){
            Stellar.Network.useTestNetwork()
        }
        
        this._asset = stellarAsset;
        this._server = new Stellar.Server(horizonApiBase); 
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
    get server() { return this._server; }

    /**
     * @property
     * @summary Gets the stellar asset(s) this client operates with
     * @type {Stellar.Asset}
     */
    get assets() { 
        return !Array.isArray(this._asset) ? [this._asset] : this._asset; 
    }

    /**
     * @method
     * @summary Creates a new account on the stellar network
     * @return {Wallet} The constructed wallet instance 
     * @param {number} startingBalance The starting balance of the account in lumens
     * @param {Wallet} initiatorWallet The wallet which is creating the account from which the startingBalance should be drawn
     */
    async instantiateAccount(startingBalance, initiatorWallet) {

        try {

            // Generate the random KP
            var kp = Stellar.Keypair.random();

            // Load distribution account from stellar
            // TODO: Perhaps this can be cached?
            var distAcct = await this.server.loadAccount(initiatorWallet.address);
            // Create the new account
            var newAcctTx = new Stellar.TransactionBuilder(distAcct)
                .addOperation(Stellar.Operation.createAccount({
                    destination: kp.publicKey(),
                    startingBalance: startingBalance // Initial lumen balance from the central distributor ... 
                    // TODO: If we're doing this through a payment gateway, would the fee be used to replenish the distributor account to deposit the lumens?
                })).build();
            // Get the source key to create a trust
            var sourceKey = await Stellar.Keypair.fromSecret(initiatorWallet.seed);

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
            var changeTrustTx = new Stellar.TransactionBuilder(stellarAcct);

            // Add trust operations
            for(var i in this.assets)
                changeTrustTx.addOperation(Stellar.Operation.changeTrust({
                    asset: new Stellar.Asset(this.assets[i].code, this.assets[i]._issuer),
                    source: userWallet.address
                }));

            // Build the transaction
            changeTrustTx.build();

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
     * @returns {Wallet} The wallet with account information
     * @description This operation will fetch the account data, returning the updated wallet information
     */
    async getAccount(userWallet) {
        try {
            // Load stellar user acct
            var stellarAcct = await this.server.loadAccount(userWallet.address);

            userWallet.balances = [];
            // Round the balances and wrap them
            stellarAcct.balances.forEach((o) => {
                userWallet.balances.push(new model.MonetaryAmount(
                    this.round(o.balance),
                    o.code || o.asset_type
                ));
            });

            console.info(`Account ${userWallet.address} has been loaded`);
            
            // TODO: Should we wrap this?
            return userWallet;
        }
        catch(e) {
            console.error(`Account changeTrust has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * 
     * @param {Wallet} payorWallet The wallet from which the payment should be made
     * @param {Wallet} payeeWallet The wallet to which the payment should be made
     * @param {MonetaryAmount} amount The amount of the payment
     * @param {MonetaryAmount} fee A fee to assess to the distribution wallet for performing the transaction. Null if none
     * @param {string} memo A memo to add to the transaction
     * @returns {Transaction} The transaction information for the operation
     */
    async createPayment(payorWallet, payeeWallet, amount, fee, memo) {

        try {

            // Load payor stellar account
            var payorStellarAcct = await this.server.loadAccount(payorWallet.address);

            // Find the asset type
            var assetType = null;
            this.assets.foreach((o)=> { if(o.code == amount.code) assetType = o; });

            // Asset type not found
            if(!assetType)
                throw new exception.NotFoundException("asset", amount.code);

            // Asset type
            assetType = new Stellar.Asset(assetType.code, assetType._issuer);

            // Create payment transaction
            var paymentTx = new Stellar.TransactionBuilder(payorStellarAcct)
                .addOperation(Stellar.Operation.payment({
                    destination: payeeWallet.address, 
                    asset: assetType,
                    amount: amount.value
                }));

            // Assess a fee for this transaction?
            if(fee) {
                var feeAssetType = null;
                this.assets.foreach((o)=> { if(o.code == amount.code) feeAssetType = o; });

                // Asset type not found
                if(!feeAssetType)
                    throw new exception.NotFoundException("asset", fee.code);

                paymentTx.addOperation(Stellar.Operation.payment({
                    destination: this._getDistWallet().address,
                    asset: feeAssetType,
                    amount: fee.value
                }));
            }

            // Memo field if memo is present
            if(memo)
                paymentTx.addMemo(Stellar.Memo.text(memo));

            // Sign the transaction
            paymentTx.build();

            // Load signing key
            paymentTx.sign(Stellar.Keypair.fromSecret(payorWallet.seed));

            // Submit transaction
            var paymentResult = await this.server.submitTransaction(paymentTx);
            
            // TODO: Handle errors (i.e. NSF, etc.)
            console.info(`Payment ${payorWallet.address} > ${payeeWallet.address} (${amount.value} ${amount.code}) success`);

            // Build transaction 
            return new model.Transaction(null, new Date(), await payorWallet.loadUser(), await payeeWallet.loadUser(), amount, fee, transactionResult._links.transaction.href);
        }
        catch(e) {
            console.error(`Account payment has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }


    /**
     * @method
     * @summary Fetches the transaction history for the specified wallet on the stellar network
     * @param {Wallet} userWallet The user wallet to fetch transaction history for
     * @param {*} filter The filter to use on the history
     * @param {number} filter._count The number of transaction items to fetch
     * @param {string} filter.asset Filter only those asset types which are specified
     * @return {Wallet} An array of the transaction history
     */
    async getTransactionHistory(userWallet, filter) {

        try {
            // Load the user's stellar account balances
            userWallet = this.getAccount(userWallet);

            // Gather transactions
            var ledgerTx = await this.server.transactions()
                .forAccount(userWallet.address)
                .cursor()
                .order("desc")
                .limit(_count)
                .call();

        }
        catch(e) {
            console.error(`Fetch transaction history has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }
}