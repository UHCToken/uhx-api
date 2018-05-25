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
    Offer = require('../model/Offer'),
    crypto = require("crypto");

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
        if (useTestNetwork) {
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
        this.execute = this.execute.bind(this);
    }

    /**
     * @method
     * @summary Rounds number to the standard decimal places
     * @param {number} number The number to be rounded
     */
    round(number) {
        var factor = Math.pow(10, 7);
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
                seed: kp.secret(),
                network: "STELLAR",
                networkId: 1
            });
        }
        catch (e) {
            uhc.log.error(`Account generation has failed : ${JSON.stringify(e)}`);
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

            uhc.log.info(`setOptions() : Setting options on ${userWallet.address}`);

            var userAcct = await this.server.loadAccount(userWallet.address);

            // Create the options
            var optionsTx = new Stellar.TransactionBuilder(userAcct)
                .addOperation(Stellar.Operation.setOptions(options))
                .build();

            var sourceKey = await Stellar.Keypair.fromSecret(userWallet.seed);

            optionsTx.sign(sourceKey);

            var optionsResult = await this._server.submitTransaction(optionsTx);

            uhc.log.info(`setOptions(): Account ${userWallet.address} options updated on Horizon API`);

            return userWallet;

        }
        catch (e) {
            uhc.log.error(`Set account options failed : ${e.message}`);
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

            uhc.log.info(`createSellOffer() : Creating offer to sell ${offer.target} @ 1 ${asset.code} @ ${offer.price.value} ${offer.price.code}`);

            var sellerAcct = await this.server.loadAccount(sellerWallet.address);

            var buyAsset = this.getAssetByCode(offer.buyCode);
            if (!buyAsset)
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

            uhc.log.info(`createSellOffer(): ${sellerWallet.address} offer made on Horizon API`);
            offer.offerId = offerResult._links.transaction.href;

            return offer;

        }
        catch (e) {
            uhc.log.error(`Create SELL offer failed : ${JSON.stringify(e)}`);
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
        catch (e) {
            if (e.constructor.name == "NotFoundException")
                return null;

            uhc.log.error(`Account retrieval has failed : ${JSON.stringify(e)}`);
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
     * @param {String} refId The reference identifier to append to the transaction
     */
    async activateAccount(userWallet, startingBalance, initiatorWallet, refId) {

        try {

            uhc.log.info(`activateAccount(): Activating ${userWallet.address} on Horizon API`);

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
                }));

            // Add ref as memo
            if(refId) {
                var memoObject = Stellar.Memo.hash(crypto.createHash('sha256').update(refId).digest('hex'));
                newAcctTx.addMemo(memoObject);
            }
            newAcctTx = newAcctTx.build();

            // Get the source key to create a trust
            var sourceKey = await Stellar.Keypair.fromSecret(initiatorWallet.seed);

            newAcctTx.sign(sourceKey);
            // Submit transaction
            var distResult = await this.server.submitTransaction(newAcctTx);

            uhc.log.info(`activateAccount(): Account ${kp.publicKey()} activated on Horizon API`);

            // return 
            var retVal = new model.Wallet().copy({
                seed: kp.secret(),
                address: kp.publicKey(),
                network: "STELLAR"
            });
            retVal.ref = distResult._links.transaction.href;
            return retVal
        }
        catch (e) {
            uhc.log.error(`Account creation has failed : ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Changes trust on userWallet such that the wallet trusts the asset
     * @param {Wallet} userWallet The wallet to establish trust with the asset defined on this class
     * @param {Asset} asset The asset to create a trust on
     * @param {number} limit The limit of the trust
     * @param {String} refId The reference identifier to append to the transaction
     */
    async createTrust(userWallet, asset, limit, refId) {

        try {
            // Load stellar user acct
            var stellarAcct = await this.server.loadAccount(userWallet.address);

            // Create change trust account transaction
            var changeTrustTx = new Stellar.TransactionBuilder(stellarAcct);

            // Add trust operations
            if (asset) {
                uhc.log.info(`createTrust(): Creating trust for ${asset.code} for ${userWallet.address}`);
                changeTrustTx.addOperation(Stellar.Operation.changeTrust({
                    asset: asset instanceof String ? this.getAssetByCode(asset) : new Stellar.Asset(asset.code, asset.issuer),
                    limit: limit ? "" + limit : undefined,
                    source: userWallet.address
                }));
            }
            else
                for (var i in this.assets) {
                    uhc.log.info(`createTrust(): Creating trust for ${this.assets[i].code} for ${userWallet.address}`);
                    changeTrustTx.addOperation(Stellar.Operation.changeTrust({
                        asset: new Stellar.Asset(this.assets[i].code, this.assets[i].issuer),
                        limit: limit ? "" + limit : undefined,
                        source: userWallet.address
                    }));
                }

            // Add memo
            if(refId) {
                var memoObject = Stellar.Memo.hash(crypto.createHash('sha256').update(refId).digest('hex'));
                changeTrustTx.addMemo(memoObject);
            }             

            // Build the transaction
            changeTrustTx = changeTrustTx.build();

            // Load signing key
            changeTrustTx.sign(Stellar.Keypair.fromSecret(userWallet.seed));

            // Submit transaction
            var distResult = await this.server.submitTransaction(changeTrustTx);

            uhc.log.info(`createTrust(): Account ${userWallet.address} trust has been changed`);

            userWallet.ref = distResult._links.transaction.href;
            return userWallet;
        }
        catch (e) {
            uhc.log.error(`Account changeTrust has failed: ${JSON.stringify(e)}`);
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

            uhc.log.info(`getAccount(): Get account ${userWallet.address} from Horizon API`);

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

            uhc.log.info(`getAccount(): Account ${userWallet.address} has been loaded from Horizon API`);

            // TODO: Should we wrap this?
            return userWallet;
        }
        catch (e) {

            if (e.data && e.data.status == 404)
                throw new exception.NotFoundException("wallet", userWallet.id); // soft fail
            uhc.log.error(`Account getAccount has failed: ${JSON.stringify(e)}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Creats a payment between the payor and payee
     * @param {Wallet} payorWallet The wallet from which the payment should be made
     * @param {Wallet} payeeWallet The wallet to which the payment should be made
     * @param {MonetaryAmount} amount The amount of the payment
     * @param {string} ref The id of the batch or ID that is being used for this payment
     * @returns {Transaction} The transaction information for the operation
     */
    async createPayment(payorWallet, payeeWallet, amount, ref) {

        try {

            uhc.log.info(`createPayment() : ${payorWallet.address} > ${payeeWallet.address} [${amount.value} ${amount.code}]`);
            // Load payor stellar account
            var payorStellarAcct = await this.server.loadAccount(payorWallet.address);

            // New tx
            var paymentTx = new Stellar.TransactionBuilder(payorStellarAcct);

            // Find the asset type
            var assetType = this.getAssetByCode(amount.code);

            // Asset type not found
            if (!assetType)
                throw new exception.NotFoundException("asset", amount.code);

            // Create payment transaction
            paymentTx.addOperation(Stellar.Operation.payment({
                destination: payeeWallet.address,
                asset: assetType,
                amount: "" + amount.value,
                source: payorWallet.address
            }));

            // Memo field if memo is present
            if (ref) {
                var memoObject = Stellar.Memo.hash(crypto.createHash('sha256').update(ref).digest('hex'));
                paymentTx.addMemo(memoObject);
            }

            // Sign the transaction
            paymentTx = paymentTx.build();

            // Load signing key
            paymentTx.sign(Stellar.Keypair.fromSecret(payorWallet.seed));

            // Submit transaction
            var ref = null;
            var paymentResult = await this.server.submitTransaction(paymentTx);
            uhc.log.info(`Payment ${payorWallet.address} > ${payeeWallet.address} (${amount.value} ${amount.code}) success`);

            // Build transaction 
            return new model.Transaction(paymentResult.ledger, model.TransactionType.Payment, null, new Date(), await payorWallet.loadUser(), await payeeWallet.loadUser(), amount, null, paymentResult._links.transaction.href, model.TransactionStatus.Complete);
        }
        catch (e) {
            uhc.log.error(`Account payment has failed: ${e.message}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Creats a payment between the payor and payee
     * @param {Wallet} sellerWallet The wallet from which the payment should be made
     * @param {Wallet} buyerWallet The wallet to which the payment should be made
     * @param {MonetaryAmount} selling The amount to be paid from source > dest
     * @param {MonetaryAmount} buying The amount to be paid from dest > source
     * @param {string} ref A memo to add to the transaction
     * @param {boolean} asTrade Indicates whether the exchange should be as a official "trade" or just purchases
     * @returns {Transaction} The transaction information for the operation
     * @example UserA wallet wishes to swap 100 UHX for 20 XLM from UserB wallet
     * client.exchangeAsset(userA, userB, new MonetaryAmount(20, "XLM"), new MonetaryAmount(100, "UHX"), "ID")
     */
    async exchangeAsset(sellerWallet, buyerWallet, selling, buying, ref, asTrade) {

        try {

            selling.value = this.round(selling.value);
            buying.value = this.round(buying.value);

            uhc.log.info(`exchangeAsset() : ${sellerWallet.address} > ${buyerWallet.address} [${selling.value} ${selling.code} for ${buying.value} ${buying.code}]`);

            // Load payor stellar account
            var sellerStellarAcct = await this.server.loadAccount(sellerWallet.address);
            var buyerStellarAcct = await this.server.loadAccount(buyerWallet.address);

            // New tx
            var exchangeTx = new Stellar.TransactionBuilder(sellerStellarAcct, {
                timebounds: {
                    minTime: Math.trunc((new Date().getTime() - 10000) / 1000),
                    maxTime: Math.trunc((new Date().getTime() + 10000) / 1000)
                }
            });

            // Find the asset type
            var buyingAsset = this.getAssetByCode(buying.code),
                sellingAsset = this.getAssetByCode(selling.code);

            // Asset type not found
            if (!buyingAsset)
                throw new exception.NotFoundException("asset", buying.code);
            if (!sellingAsset)
                throw new exception.NotFoundException("asset", selling.code);

            // Create exchange - Two offers in one TX
            if (asTrade)
                exchangeTx.addOperation(Stellar.Operation.manageOffer({
                    source: sellerWallet.address,
                    selling: sellingAsset,
                    buying: buyingAsset,
                    amount: "" + selling.value,
                    offerId: "0",
                    price: "" + (buying.value / selling.value)
                })).addOperation(Stellar.Operation.manageOffer({
                    source: buyerWallet.address,
                    selling: buyingAsset,
                    buying: sellingAsset,
                    amount: "" + buying.value,
                    offerId: "0",
                    price: "" + (selling.value / buying.value)
                }));
            else
                exchangeTx.addOperation(Stellar.Operation.payment({
                    source: sellerWallet.address,
                    asset: sellingAsset,
                    destination: buyerWallet.address,
                    amount: "" + selling.value
                })).addOperation(Stellar.Operation.payment({
                    source: buyerWallet.address,
                    asset: buyingAsset,
                    destination: sellerWallet.address,
                    amount: "" + buying.value
                }));
            // Memo field if memo is present
            if (ref) {
                var memoObject = Stellar.Memo.hash(crypto.createHash('sha256').update(ref).digest('hex'));
                exchangeTx.addMemo(memoObject);
            }

            // Sign the transaction
            exchangeTx = exchangeTx.build();

            // Load signing key
            exchangeTx.sign(Stellar.Keypair.fromSecret(sellerWallet.seed));
            exchangeTx.sign(Stellar.Keypair.fromSecret(buyerWallet.seed));

            // Submit transaction
            uhc.log.info(`exchangeAsset(): ${sellerWallet.address} > ${buyerWallet.address} (${selling.value} ${selling.code} for ${buying.value} ${buying.code}) is being submitted`);
            var paymentResult = await this.server.submitTransaction(exchangeTx);
            uhc.log.info(`exchangeAsset(): ${sellerWallet.address} > ${buyerWallet.address} (${selling.value} ${selling.code} for ${buying.value} ${buying.code}) success`);
            // uhc.log.info(JSON.stringify(paymentResult.data));

            // Build transaction 
            return new model.Transaction(
                paymentResult.ledger,
                model.TransactionType.Purchase,
                null,
                new Date(),
                await sellerWallet.loadUser(),
                await buyerWallet.loadUser(),
                selling,
                null,
                paymentResult._links.transaction.href);
        }
        catch (e) {
            uhc.log.error(`Account payment has failed: ${e.message} - ${e.data && e.data.extras ? e.data.extras.result_xdr : null}`);
            throw new StellarException(e);
        }
    }

    /**
     * @method
     * @summary Gets the stellar asset instance by code
     * @param {string} code The asset code to find
     */
    getAssetByCode(code) {
        // Code is native so it is XLM
        if (code == "XLM")
            return Stellar.Asset.native();

        var retVal = this.assets.find((o) => o.code == code);
        if (retVal)
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
            userWallet = await this.getAccount(userWallet);

            // Gather transactions
            var ledgerTx = await this.server.transactions()
                .forAccount(userWallet.address)
                .cursor()
                .order("desc")
                .limit(filter._count || 20)
                .call();

            var rn = 0;
            var retVal = [], userMap = {};
            do {
                await uhc.Repositories.transaction(async (_txc) => {
                    userMap[userWallet.address] = userWallet._user || await uhc.Repositories.userRepository.getByWalletId(userWallet.id, _txc);

                    for (var rNo in ledgerTx.records) {
                        var r = ledgerTx.records[rNo];
                        var ops = await r.operations();

                        // First, load once through batch 
                        var dbData = [];
                        if (r.memo_type == 'hash')
                            dbData = await uhc.Repositories.transactionRepository.getByHash(Buffer.from(r.memo, 'base64'), _txc);

                        // Loop through operations
                        for (var opNo in ops.records) {
                            var o = ops.records[opNo];
                            try {
                                if ((!filter.asset || o.asset_code == filter.asset) &&
                                    rNo++ >= (filter._offset || 0) && retVal.length < (filter._count || 20)) {
                                    retVal.push(await this.toTransaction(opNo, r, o, dbData, userMap, _txc));
                                }
                            }
                            catch (e) {
                                uhc.log.error(`Could not fill details on transaction: ${e.message}`);
                            }
                        }
                    }
                });
            } while (retVal.length < filter._count && await ledgerTx.next() && ledgerTx.records.length > 0);

            return retVal.filter(o => o);
        }
        catch (e) {
            uhc.log.error(`Fetch transaction history has failed: ${e.message}`);
            throw new StellarException(e);
        }
    }


    /**
     * @method
     * @summary Creates a transaction object from a Stellar operation
     * @param {Transaction} txRecord The transaction record being processed
     * @param {Operation} opRecord The operation record being processed
     * @param {Transaction} dbData Data about the batch or transaction loaded from the DB if available
     * @param {*} userMap A map between account IDs and known users that have already been loaded 
     * @param {Client} _txc When present the transaction controller to run data queries on
     */
    async toTransaction(opIndex, txRecord, opRecord, dbData, userMap, _txc) {

        // Map type & extra data
        var memo = txRecord.memo;

        var type = null;
        switch (opRecord.type) {
            case "change_trust":
            case "allow_trust":
                type = model.TransactionType.Trust;
                break;
            case "payment":
                type = model.TransactionType.Payment;
                break;
            case "create_account":
                type = model.TransactionType.AccountManagement;
                memo = "Funded account";
                break;
            default:
                return null;
        }

        // Payor / payee
        var source = opRecord.source_account || opRecord.from || opRecord.funder,
            destination = opRecord.destination_account || opRecord.to || opRecord.account,
            payor = userMap[source],
            payee = userMap[destination];

        // Load blockchain fill data if needed
        if (payor === undefined) {
            payor = userMap[source] = await uhc.Repositories.userRepository.getByPublicAddress(source, _txc);
            if (!payor) // is it an asset account or offering?
                payor = userMap[source] = await uhc.Repositories.assetRepository.getByPublicAddress(source, _txc);
        }
        if (payee === undefined) {
            payee = userMap[destination] = await uhc.Repositories.userRepository.getByPublicAddress(destination, _txc);
            if (!payee) // is it an asset account or offering?
                payee = userMap[destination] = await uhc.Repositories.assetRepository.getByPublicAddress(destination, _txc);
        }

        // Was there a payment / purchase memo?
        var retVal = null;
        if (dbData.length > opIndex) {
            retVal = dbData[opIndex];
            retVal._payor = payor || source;
            retVal._payee = payee || destination;
            retVal.ref = opRecord._links.self;
            retVal.postingDate = opRecord.created_at;
            retVal.amount = new MonetaryAmount(opRecord.amount || opRecord.starting_balance, opRecord.asset_code || 'XLM');
            retVal.state = model.TransactionStatus.Complete;
            return retVal;
        }
        else {
            return new Transaction(
                null,
                type,
                memo,
                txRecord.created_at,
                payor || source,
                payee || destination,
                new MonetaryAmount(opRecord.amount || opRecord.starting_balance, opRecord.asset_code || 'XLM'),
                null,
                opRecord._links.self,
                model.TransactionStatus.Complete
            );
        }
    }

    /**
     * @method
     * @summary Executes a described transaction against the stellar network
     * @param {Transaction} transaction The transaction to be executed
     */
    async execute(transaction) {
        try {

            if(transaction.state != model.TransactionStatus.Pending)
                return transaction;

            await transaction.loadPayeeWallet();
            await transaction.loadPayorWallet();
            uhc.log.info(`Execute transaction: ${transaction.id} (${transaction.type}) (${transaction._payorWallet.id} > ${transaction._payeeWallet.id} - ${transaction.amount.value} ${transaction.amount.code})`);

            // Do the transaction
            var stlrTx = null;
            switch(Number(transaction.type)) {
                case model.TransactionType.AccountManagement:
                    stlrTx = await this.activateAccount(transaction._payeeWallet, transaction.amount.value, transaction._payorWallet, transaction.id);
                    break;
                case model.TransactionType.Trust:
                    stlrTx = await this.createTrust(transaction._payeeWallet, await uhc.Repositories.assetRepository.getByCode(transaction.amount.code), null,  transaction.id);
                    break;
                case model.TransactionType.Purchase:
                case model.TransactionType.Deposit:
                case model.TransactionType.Airdrop:
                    stlrTx = await this.createPayment(transaction._payorWallet, transaction._payeeWallet, transaction.amount, transaction.id);
                    break;
                default:
                    throw new exception.Exception(`Cannot understand ${transaction.type}`);
            }
            transaction.ref = stlrTx.ref;
            transaction.state = model.TransactionStatus.Complete;
            transaction.postingDate = new Date();
        }
        catch(e) {
            uhc.log.error(`Could not perform transaction  ${transaction.id} due to ${e.message}`);
            transaction.state = model.TransactionStatus.Failed;
            transaction.ref = exception.ErrorCodes.COM_FAILURE;
            transaction.postingDate = new Date();
        }
        return transaction;
    }
}