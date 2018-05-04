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
    Wallet = require("../model/Wallet"),
    exception = require('../exception'),
    Transaction = require('../model/Transaction'),
    MonetaryAmount = require('../model/MonetaryAmount'),
    Offer = require('../model/Offer');
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
     * @param {string} feeTarget Identifies the wallet to which any fees collected from the API should be deposited
     */
    constructor(horizonApiBase, stellarAsset, useTestNetwork, feeTarget) {
        // "private" members
        if (useTestNetwork){
            Stellar.Network.useTestNetwork()
        }
        
        this._feeAccount = feeTarget;
        this._asset = stellarAsset;
        this._server = new Stellar.Server(horizonApiBase); 
        this.round = this.round.bind(this);
        this.activateAccount = this.activateAccount.bind(this);
        this.createPayment = this.createPayment.bind(this);
        this.createTrust = this.createTrust.bind(this);
        this.generateAccount = this.generateAccount.bind(this);
        this.getAccount = this.getAccount.bind(this);
        this.getAssetByCode = this.getAssetByCode.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
        this.isActive = this.isActive.bind(this);
        this.toTransaction = this.toTransaction.bind(this);
        this.setOptions = this.setOptions.bind(this);
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
     * @summary Generates a random keypair for an account
     * @returns {Wallet} The generated wallet object containing the account
     */
    async generateAccount() {
        try {
            var kp = Stellar.Keypair.random();
            return new Wallet().copy({
                address: kp.publicKey(),
                seed: kp.secret()
            });
        }
        catch(e) {
            console.error(`Account generation has failed : ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Sets the specified stellar optoins on the specified user wallet
     * @param {Wallet} userWallet The wallet to set options on
     * @param {*} options The options to be set on the wallet
     * @returns {Wallet} The wallet that was updated
     */
    async setOptions(userWallet, options) {
        try {
            
            console.info(`setOptions() : Setting options on ${userWallet.address}`);

            var userAcct = await this.server.loadAccount(userWallet.address);
            
            // Create the options
            var optionsTx = new Stellar.TransactionBuilder(userAcct)
                .addOperation(Stellar.Operation.setOptions(options))
                .build();        

            var sourceKey = await Stellar.Keypair.fromSecret(userWallet.seed);

            optionsTx.sign(sourceKey);
            
            var optionsResult = await this._server.submitTransaction(optionsTx);

            console.info(`setOptions(): Account ${userWallet.address} options updated on Horizon API`);

            return userWallet;

        }
        catch(e) {
            console.error(`Set account options failed : ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Creates an offer on the stellar exchange
     * @param {Wallet} sellerWallet The seller's wallet
     * @param {Offer} offer The offer sale information to create the offer for
     * @param {Asset} asset The asset the offer belongs to
     * @return {Offer} The offer from the stellar blockchain 
     */
    async createSellOffer(sellerWallet, offer, asset) {
        try {
            
            asset = asset || await offer.loadAsset();

            console.info(`createSellOffer() : Creating offer to sell ${offer.target} @ 1 ${asset.code} @ ${offer.price.value} ${offer.price.code}`);

            var sellerAcct = await this.server.loadAccount(sellerWallet.address);
            
            var buyAsset = this.getAssetByCode(offer.buyCode);
            if(!buyAsset)
                throw new exception.NotFoundException("asset", offer.buyCode);

            // Create the options
            var offerTx = new Stellar.TransactionBuilder(sellerAcct, {
                minTime: offer.startDate ? offer.startDate.getTime() / 1000 : 0,
                maxTime: offer.stopDate ? offer.stopDate.getTime() / 1000 : 0
            })
                .addOperation(
                    Stellar.Operation.manageOffer({
                        amount: offer.amount,
                        selling: new Stellar.Asset(asset.code, asset.issuer),
                        buying: this.getAssetByCode(offer.price.code), 
                        offerId: 0,
                        price: offer.price.value
                    })
                ).build();        
            var sourceKey = await Stellar.Keypair.fromSecret(sellerWallet.seed);

            offerTx.sign(sourceKey);
            
            var offerResult = await this._server.submitTransaction(offerTx);

            console.info(`createSellOffer(): ${sellerWallet.address} offer made on Horizon API`);
            offer.offerId = offerResult._links.transaction.href;

            return offer;

        }
        catch(e) {
            console.error(`Create SELL offer failed : ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Determines whether the account is active on the stellar network and has minimum balance
     * @param {Wallet} userWallet The user wallet to determine if is active on stellar network
     * @returns {boolean} An indication whether the account is active
     */
    async isActive(userWallet) {

        try {
            userWallet = await this.getAccount(userWallet);
            return userWallet;
        }
        catch(e) {
            if(e.constructor.name == "NotFoundException")
                return null;
                
            console.error(`Account retrieval has failed : ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Activates an account on the stellar network
     * @returns {Wallet} The constructed wallet instance
     * @param {Wallet} userWallet The wallet of the user which is to be activated 
     * @param {number} startingBalance The starting balance of the account in lumens
     * @param {Wallet} initiatorWallet The wallet which is creating the account from which the startingBalance should be drawn
     */
    async activateAccount(userWallet, startingBalance, initiatorWallet) {

        try {

            console.info(`activateAccount(): Activating ${userWallet.address} on Horizon API`);

            // Generate the random KP
            var kp = Stellar.Keypair.fromSecret(userWallet.seed);

            // Load distribution account from stellar
            // TODO: Perhaps this can be cached?
            var distAcct = await this.server.loadAccount(initiatorWallet.address);
            // Create the new account
            var newAcctTx = new Stellar.TransactionBuilder(distAcct)
                .addOperation(Stellar.Operation.createAccount({
                    destination: userWallet.address,
                    startingBalance: startingBalance // Initial lumen balance from the central distributor ... 
                    // TODO: If we're doing this through a payment gateway, would the fee be used to replenish the distributor account to deposit the lumens?
                })).build();
            // Get the source key to create a trust
            var sourceKey = await Stellar.Keypair.fromSecret(initiatorWallet.seed);

            newAcctTx.sign(sourceKey);
            // Submit transaction
            var distResult = await this.server.submitTransaction(newAcctTx);

            console.info(`activateAccount(): Account ${kp.publicKey()} activated on Horizon API`);

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
     * @param {Asset} asset The asset to create a trust on
     * @param {number} limit The limit of the trust
     */
    async createTrust(userWallet, asset, limit) {

        try {
            // Load stellar user acct
            var stellarAcct = await this.server.loadAccount(userWallet.address);

            // Create change trust account transaction
            var changeTrustTx = new Stellar.TransactionBuilder(stellarAcct);

            // Add trust operations
            if(asset) {
                console.info(`createTrust(): Creating trust for ${asset.code} for ${userWallet.address}`);
                changeTrustTx.addOperation(Stellar.Operation.changeTrust({
                    asset : asset instanceof String ? this.getAssetByCode(asset) : new Stellar.Asset(asset.code, asset.issuer),
                    limit: limit ? "" + limit : undefined,
                    source: userWallet.address
                }));
            }
            else
                for(var i in this.assets){
                    console.info(`createTrust(): Creating trust for ${this.assets[i].code} for ${userWallet.address}`);
                    changeTrustTx.addOperation(Stellar.Operation.changeTrust({
                        asset: new Stellar.Asset(this.assets[i].code, this.assets[i].issuer),
                        limit: limit ? "" + limit : undefined,
                        source: userWallet.address
                    }));
                }

            // Build the transaction
            changeTrustTx = changeTrustTx.build();

            // Load signing key
            changeTrustTx.sign(Stellar.Keypair.fromSecret(userWallet.seed));

            // Submit transaction
            var distResult = await this.server.submitTransaction(changeTrustTx);
            
            console.info(`createTrust(): Account ${userWallet.address} trust has been changed`);

            return userWallet;
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

            console.info(`getAccount(): Get account ${userWallet.address} from Horizon API`);
            
            // Load stellar user acct
            var stellarAcct = await this.server.loadAccount(userWallet.address);

            userWallet.balances = [];
            // Round the balances and wrap them
            stellarAcct.balances.forEach((o) => {
                userWallet.balances.push(new model.MonetaryAmount(
                    this.round(o.balance),
                    o.asset_code || o.asset_type
                ));
            });

            console.info(`getAccount(): Account ${userWallet.address} has been loaded from Horizon API`);
            
            // TODO: Should we wrap this?
            return userWallet;
        }
        catch(e) {

            if(e.data && e.data.status == 404)
                throw new exception.NotFoundException("wallet", userWallet.id); // soft fail
            console.error(`Account getAccount has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Creats a payment between the payor and payee
     * @param {Wallet} payorWallet The wallet from which the payment should be made
     * @param {Wallet} payeeWallet The wallet to which the payment should be made
     * @param {MonetaryAmount} amount The amount of the payment
     * @param {string} memo A memo to add to the transaction
     * @param {string} memoType The memo type (hash|text)
     * @returns {Transaction} The transaction information for the operation
     */
    async createPayment(payorWallet, payeeWallet, amount, memo, memoType) {

        try {

            console.info(`createPayment() : ${payorWallet.address} > ${payeeWallet.address} [${amount.value} ${amount.code}]`);
            // Load payor stellar account
            var payorStellarAcct = await this.server.loadAccount(payorWallet.address);

            // New tx
            var paymentTx = new Stellar.TransactionBuilder(payorStellarAcct);
            
            // Find the asset type
            var assetType = this.getAssetByCode(amount.code);

            // Asset type not found
            if(!assetType)
                throw new exception.NotFoundException("asset", amount.code);

            // Create payment transaction
            paymentTx.addOperation(Stellar.Operation.payment({
                    destination: payeeWallet.address, 
                    asset: assetType,
                    amount: ""+ amount.value,
                    source: payorWallet.address
                }));

            // Memo field if memo is present
            if(memo) {
                var memoObject = null;
                switch(memoType) {
                    case "hash":
                        memoObject = Stellar.Memo.hash(memo);
                        break;
                    case "id":
                        memoObject = Stellar.Memo.id(memo);
                        break;
                    default: 
                        memoObject = Stellar.Memo.text(memo);
                        break;
                }
                paymentTx.addMemo(memoObject);
            }
            // Sign the transaction
            paymentTx = paymentTx.build();

            // Load signing key
            paymentTx.sign(Stellar.Keypair.fromSecret(payorWallet.seed));

            // Submit transaction
            var ref = null;
            var paymentResult = await this.server.submitTransaction(paymentTx);
            console.info(`Payment ${payorWallet.address} > ${payeeWallet.address} (${amount.value} ${amount.code}) success`);
            
            // Build transaction 
            return new model.Transaction(paymentResult.ledger, new Date(), await payorWallet.loadUser(), await payeeWallet.loadUser(), amount, null, paymentResult._links.transaction.href);
        }
        catch(e) {
            console.error(`Account payment has failed: ${e.message}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Gets the stellar asset instance by code
     * @param {string} code The asset code to find
     */
    getAssetByCode(code) {
        var retVal = this.assets.find((o) => o.code == code);
        if(retVal) 
            return new Stellar.Asset(retVal.code, retVal.issuer);
        return null;
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

            filter = filter || {};
            // Load the user's stellar account balances
            userWallet = this.getAccount(userWallet);

            // Gather transactions
            var ledgerTx = await this.server.transactions()
                .forAccount(userWallet.address)
                .cursor()
                .order("desc")
                .limit(_count)
                .call();

            var retVal = [], userMap = {};

            do {
                ledgerTx.records.forEach(async (r) => {
                    var ops = await r.operations();
                    
                    // Loop through operations
                    ops._embedded.records.forEach(async (o) => {
                        if(!filter.asset || o.asset_code == filter.asset) {
                            retVal.push(await this.toTransaction(r, o, userMap));
                        }
                    });

                });
            } while(retVal.length < filter._count && await ledgerTx.next() && ledgerTx.records.length > 0);

        }
        catch(e) {
            console.error(`Fetch transaction history has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }


    /**
     * @method
     * @summary Creates a transaction object from a Stellar operation
     * @param {Transaction} txRecord The transaction record being processed
     * @param {Operation} opRecord The operation record being processed
     * @param {*} userMap A map between account IDs and known users that have already been loaded 
     */
    async toTransaction(txRecord, opRecord, userMap) {

        // Map type
        var type = null;
        switch(opRecord.type) {
            case "change_trust":
            case "allow_trust":
                type = model.TransactionType.Trust;
                break;
            case "payment":
                type = model.TransactionType.Payment;
                break;
            case "create_account":
                type = model.TransactionType.AccountManagement;
                break;
        }

        // Payor / payee
        var payor = userMap[opRecord.funder],
            payee = userMap[opRecord.receiver];

        // Special case : fees collected
        var memo = txRecord.memo;
        if(opRecord.receiver == this._feeAccount)
            memo = "API USAGE FEE";

        // Load if needed
        if(payor === undefined)
            payor = userMap[opRecord.funder] = await uhc.Repositories.userRepository.getByWalletId(opRecord.funder);
        if(payee === undefined)
            payee = userMap[opRecord.receiver] = await uhc.Repositories.userRepository.getByWalletId(opRecord.account);

        // Construct tx record
        return new Transaction(
            opRecord.id,
            type, 
            memo,
            txRecord.created_at,
            payor || opRecord.funder, 
            payee || opRecord.receiver, 
            new MonetaryAmount(o.amount, o.asset_code),
            null, 
            opRecord._links.self                          
        );
    }
}