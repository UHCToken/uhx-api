
// <Reference path="./model/model.js"/>
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

const uhx = require('../uhx'),
    crypto = require('crypto'),
    exception = require('../exception'),
    security = require('../security'),
    StellarClient = require('../integration/stellar'),
    Bittrex = require("../integration/bittrex"),
    model = require('../model/model'),
    User = require('../model/User'),
    Asset = require('../model/Asset'),
    AssetQuote = require('../model/AssetQuote'),
    Offer = require('../model/Offer'),
    Wallet = require('../model/Wallet'),
    MonetaryAmount = require('../model/MonetaryAmount'),
    Transaction = require('../model/Transaction'),
    Airdrop = require("../model/Airdrop"),
    Purchase = require("../model/Purchase");

const uuidRegex = /[A-F0-9]{8}-(?:[A-F0-9]{4}\-){3}[A-F0-9]{12}/i;

/**
 * @class
 * @summary Represents logic related to tokens
 */
module.exports = class TokenLogic {

    /**
     * @constructor
     * @summary Binds methods to "this"
     */
    constructor() {
        this.getStellarClient = this.getStellarClient.bind(this);
        this.refreshStellarClient = this.refreshStellarClient.bind(this);
        this.createAsset = this.createAsset.bind(this);
        this.createAssetQuote = this.createAssetQuote.bind(this);
        this.createPurchase = this.createPurchase.bind(this);
        this.getTransactionHistory = this.getTransactionHistory.bind(this);
        this.createTransaction = this.createTransaction.bind(this);
        this.planAirdrop = this.planAirdrop.bind(this);
        this.getAllBalancesForWallets = this.getAllBalancesForWallets.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        this.updateAsset = this.updateAsset.bind(this);
    }

    /**
    * @method
    * @summary Gets or creates the stellar client
    * @returns {StellarClient} The stellar client
    */
    async getStellarClient() {
        if (!this._stellarClient)
            this._stellarClient = new StellarClient(uhx.Config.stellar.horizon_server, await uhx.Repositories.assetRepository.query(), uhx.Config.stellar.testnet_use);
        return this._stellarClient;
    }

    /**
* @method
* @summary Refreshes the stellar client
* @returns {StellarClient} The stellar client
*/
    async refreshStellarClient() {
        this._stellarClient = new StellarClient(uhx.Config.stellar.horizon_server, await uhx.Repositories.assetRepository.query(), uhx.Config.stellar.testnet_use);
        return this._stellarClient;
    }

    /**
     *
     * @param {Asset} asset The asset being updated
     * @param {SecurityPrincipal} principal The principal being update
     */
    async updateAsset(asset, principal) {

        try {

            // Update core asset properties
            return await uhx.Repositories.transaction(async (_txc) => {
                // First we will update the core properties of the asset
                var retVal = await uhx.Repositories.assetRepository.update(asset, principal, _txc);

                // Next we will ensure that the asset offers are update
                if (asset.offers) {
                    for (var o in asset.offers) {
                        await uhx.Repositories.assetRepository.updateOffer(asset.offers[o], principal, _txc);
                        // TODO: Top-up account
                        var newOffer = await uhx.Repositories.assetRepository.getActiveOffer(asset.id, _txc);
                        if (newOffer && (!newOffer.public || asset.kycRequirement)) {
                            var distributingAccount = await uhx.Repositories.walletRepository.get((await uhx.Repositories.assetRepository.get(asset.id))._distWalletId);
                            var supplyAccount = await uhx.StellarClient.getAccount(await newOffer.loadWallet());
                            var supplyBalance = supplyAccount.balances.find(o => o.code == asset.code).value;
                            if (supplyBalance < newOffer.amount) {
                                await uhx.StellarClient.createPayment(distributingAccount, supplyAccount, new MonetaryAmount(newOffer.amount - supplyBalance, asset.code), asset.id, 'hash');
                            } else if (supplyBalance > newOffer.amount) {
                                await uhx.StellarClient.createPayment(supplyAccount, distributingAccount, new MonetaryAmount(supplyBalance - newOffer.amount, asset.code), asset.id, 'hash');
                            }
                        }
                    }
                }

                return retVal;
            });
        }
        catch (e) {
            uhx.log.error(`Error updating asset: ${e.message}`);
            throw new exception.Exception("Error updating asset", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @param {Asset} asset The asset information to be created on the service
     * @param {SecurityPrincipal} principal The security principal to run as
     * @param {number} supply The initial supply of tokens to be generated (nil if unlimited)
     * @param {boolean} fixedSupply If true, locks the issuing account so the token supply is fixed
     */
    async createAsset(asset, supply, fixedSupply, principal) {

        try {

            var stellarClient = await this.getStellarClient();

            // Step 1: Validate that the asset doesn't already exist
            if (stellarClient.getAssetByCode(asset.code))
                throw new exception.Exception("Asset code is already declared & registered", exception.ErrorCodes.DUPLICATE_NAME);
            else if (!/[a-zA-Z0-9]{3,12}/g.test(asset.code))
                throw new exception.Exception("Asset code is invalid", exception.ErrorCodes.INVALID_NAME)
            else if (asset.offers) {
                var total = 0;
                asset.offers.forEach((o) => { total += o.amount || 0 });
                if (total > supply)
                    throw new exception.BusinessRuleViolationException(
                        new exception.RuleViolation(
                            `Total offers of ${total} exceed total supply of ${supply}`,
                            exception.ErrorCodes.INSUFFICIENT_FUNDS,
                            exception.RuleViolationSeverity.ERROR
                        )
                    );
            }

            // User's wallet
            var userWallet = await uhx.Repositories.walletRepository.get(uhx.Config.stellar.initiator_wallet_id);

            // Verify that the user wallet is valid and has sufficient balance to continue
            if (!(await stellarClient.isActive(userWallet)) || userWallet.getBalanceOf("XLM").value < 15)
                throw new exception.BusinessRuleViolationException(
                    new exception.RuleViolation(
                        "User has insufficient balance to issue new Asset (minimum balance to issue asset is 15 XLM",
                        exception.ErrorCodes.INSUFFICIENT_FUNDS,
                        exception.RuleViolationSeverity.ERROR
                    )
                );

            // Step 2. Create and keep track of asset accounts
            return await uhx.Repositories.transaction(async (_txc) => {

                // Generate keypairs
                var issuingAccount = await stellarClient.generateAccount(),
                    distributingAccount = await stellarClient.generateAccount(),
                    supplyAccount = await stellarClient.generateAccount();

                issuingAccount = await uhx.Repositories.walletRepository.insert(issuingAccount, principal, _txc);
                distributingAccount = await uhx.Repositories.walletRepository.insert(distributingAccount, principal, _txc);

                // Insert asset
                asset._distWalletId = distributingAccount.id;
                asset.issuer = issuingAccount.address;
                asset = await uhx.Repositories.assetRepository.insert(asset, principal, _txc);

                // Asset sales
                if (asset.offers) {
                    var suppAcct = null;
                    for (var i in asset.offers) {
                        // If the asset is not public or there is a kyc requirement then the asset needs to be bought from the distributor here not on the exchange
                        if (!asset.offers[i].public || asset.kycRequirement) {
                            if (asset.offers[i].useDistributorWallet) {
                                asset.offers[i]._walletId = distributingAccount.id;
                            }
                            else {
                                suppAcct = suppAcct || await uhx.Repositories.walletRepository.insert(supplyAccount, principal, _txc);
                                asset.offers[i]._walletId = suppAcct.id;
                            }
                        }
                        asset.offers[i] = await uhx.Repositories.assetRepository.insertOffer(asset.id, asset.offers[i], principal, _txc);
                    }
                    supplyAccount = suppAcct;
                }
                else
                    supplyAccount = null;

                // Stellar network stuff

                // Activate the issuer account
                issuingAccount = await stellarClient.activateAccount(issuingAccount, "1.1", userWallet);
                // Activate distribution account
                distributingAccount = await stellarClient.activateAccount(distributingAccount, "5", userWallet);
                // Activate supply account if needed
                if (supplyAccount) supplyAccount = await stellarClient.activateAccount(supplyAccount, "5", userWallet);

                // Create trust
                distributingAccount = await stellarClient.createTrust(distributingAccount, asset, supply);
                if (supplyAccount) supplyAccount = await stellarClient.createTrust(supplyAccount, asset);

                // Add the asset to the client (push)
                stellarClient._asset.push(asset);
                uhx.StellarClient._asset.push(asset);

                try {
                    // Pay the distributing account all the tokens in the supply!
                    await stellarClient.createPayment(issuingAccount, distributingAccount, new MonetaryAmount(supply, asset.code), asset.description || "Initial Distribution");

                    // If there is an active sale, then we want to distribute to the supply account
                    var firstOffer = await uhx.Repositories.assetRepository.getActiveOffer(asset.id, _txc);
                    if (firstOffer && (!firstOffer.public || asset.kycRequirement) && supplyAccount) // We want to initialize the supplier account
                        await stellarClient.createPayment(distributingAccount, supplyAccount, new MonetaryAmount(firstOffer.amount, asset.code), asset.id, 'hash');

                    var options = {
                        homeDomain: uhx.Config.stellar.home_domain
                    };

                    // Lock the issuing account
                    if (fixedSupply) {
                        options.masterWeight = 0;
                        options.lowThreshold = 0;
                        options.medThreshold = 0;
                        options.highThreshold = 0;
                    }

                    await stellarClient.setOptions(issuingAccount, options);

                    // Does the user want to list this on a public exchange? (offer has to be marked as public and there cannot be a kyc requirement)
                    for (var i in asset.offers)
                        if (asset.offers[i].public && !asset.kycRequirement) {
                            asset.offers[i] = await stellarClient.createSellOffer(distributingAccount, asset.offers[i], asset);
                            await uhx.Repositories.assetRepository.updateOffer(asset.offers[i], principal, _txc);
                        }
                }
                catch (e) {
                    stellarClient.assets.pop();
                    throw e;
                }

                return asset;
            });

        }
        catch (e) {
            uhx.log.error(`Error creating asset: ${e.message}`);
            throw new exception.Exception("Error creating asset", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }


    /**
     * @method
     * @summary Creates a quote for an asset
     * @param {string} sellCurrency The asset that is being quoted
     * @param {string} purchaseCurrency The currency with which the user is buying
     * @param {boolean} nostore Indicates whether the value should be stored
     * @returns {AssetQuote} The asset quote itself
     */
    async createAssetQuote(sellCurrency, purchaseCurrency, nostore) {

        try {
            var asset = await uhx.Repositories.assetRepository.query(new Asset().copy({ code: sellCurrency }), 0, 1);
            asset = asset[0];
            if (!asset)
                throw new exception.Exception(`Invalid asset : ${sellCurrency}, only assets configured on this service can be quoted`, exception.ErrorCodes.RULES_VIOLATION);
            else if (asset.locked && !nostore)
                throw new exception.Exception(`Selling of ${asset.code} from this distributor is currently locked`, exception.ErrorCodes.ASSET_LOCKED);
            // Get current offer
            var currentOffer = await uhx.Repositories.assetRepository.getActiveOffer(asset.id);
            if (!currentOffer)
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("The requested asset is not for sale at the moment", exception.ErrorCodes.NO_OFFER, exception.RuleViolationSeverity.ERROR));

            // Price?
            var retVal = new AssetQuote().copy({
                assetId: asset.id,
                rate: new MonetaryAmount(null, purchaseCurrency),
                creationTime: new Date()
            });
            retVal._asset = asset;

            // Offer matches the purchase? 1..1 ...
            if (currentOffer.price && purchaseCurrency == currentOffer.price.code) {
                retVal.rate.value = currentOffer.price.value;
                retVal.expiry = currentOffer.stopDate;
            }
            else if (currentOffer.price) {
                // We're reaching out to bittrex so we should use ETH and BTC average offer to come up with a reasonable price for our asset
                var path = { from: currentOffer.price.code, to: purchaseCurrency };
                if (purchaseCurrency != "ETH" && purchaseCurrency != "BTC")
                    path = [
                        { from: currentOffer.price.code, to: purchaseCurrency, via: ["BTC"] },
                        { from: currentOffer.price.code, to: purchaseCurrency, via: ["ETH"] }
                    ];

                var exchange = await new Bittrex().getExchange(path);
                retVal.rate.value = currentOffer.price.value / (exchange.reduce((a, b) => a + b) / exchange.length);
                retVal.expiry = new Date(new Date().getTime() + uhx.Config.stellar.market_offer_validity);
            }
            else { // Just a market rate offer
                // We're reaching out to bittrex so we should use ETH and BTC average offer to come up with a reasonable price for our asset
                var exchange = await new Bittrex().getExchange([
                    { from: asset.code, to: purchaseCurrency }
                ]);
                retVal.rate.value = exchange[0];
                retVal.expiry = new Date(new Date().getTime() + uhx.Config.stellar.market_offer_validity);
            }
            if (retVal.rate.value == 0) {
                throw new exception.BusinessRuleViolationException("Minimum purchase amount not met");
            }
            // Insert the offer
            if (!nostore)
                retVal = await uhx.Repositories.assetRepository.insertQuote(retVal);

            return retVal;
        }
        catch (e) {
            uhx.log.error(`Error creating asset quote: ${e.message}`);
            throw new exception.Exception("Error creating asset quote", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
    * @method
    * @summary Register a wallet on the stellar network
    * @param {string} userId The user for which the wallet should be created
    */
    async activateStellarWalletForUser(userId) {

        try {

            return await uhx.Repositories.transaction(async (_txc) => {

                // Create stellar client
                var stellarClient = uhx.StellarClient;

                // Verify user
                var user = await uhx.Repositories.userRepository.get(userId, _txc);

                // Does user already have wallet?
                var wallet = await user.loadStellarWallet();
                if (!wallet) { // Generate a KP
                    // Create a wallet
                    var wallet = await stellarClient.generateAccount();
                    wallet.userId = user.id;
                    // Insert
                    wallet = await uhx.Repositories.walletRepository.insert(wallet, null, _txc);
                }

                // Activate wallet if not already active
                if (!await stellarClient.isActive(wallet))
                    await stellarClient.activateAccount(wallet, "1", await uhx.Repositories.walletRepository.get(uhx.Config.stellar.initiator_wallet_id));
                return wallet;
            });
        }
        catch (e) {
            uhx.log.error("Error finalizing authentication: " + e.message);
            throw new exception.Exception("Error creating waller user", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    // TODO: Refactor this method
    /**
     * @method
     * @summary Inserts a purchase according to the business rules
     * @param {Purchase} purchaseInfo The information related to the purchase of goods
     * @param {SecurityPrincipal} principal The principal which is attempting to purchase goods
     * @returns {Purchase} The completed or pending purchase
     */
    async createPurchase(purchaseInfo, principal) {

        try {

            var purchase = purchaseInfo;
            // Is this a user purchase or an admin purchase? Clean inputs based on permission level
            if (principal.grant["purchase"] & security.PermissionType.OWNER) // Principal is only allowed to buy for themselves
            {
                if (purchaseInfo.amount || purchaseInfo.buyer)
                    throw new exception.ArgumentException("prohibited field supplied");

                purchase = new Purchase().copy({
                    type: model.TransactionType.Purchase,
                    autoActivate: purchaseInfo.autoActivate,
                    quoteId: purchaseInfo.quoteId,
                    assetId: purchaseInfo.assetId,
                    quantity: purchaseInfo.quantity,
                    buyerId: principal.session.userId,
                    state: 1 // PENDING
                });
            }
            else
                purchase = new Purchase().copy({
                    type: model.TransactionType.Purchase,
                    autoActivate: purchaseInfo.autoActivate,
                    quoteId: purchaseInfo.quoteId,
                    assetId: purchaseInfo.assetId,
                    quantity: purchaseInfo.quantity,
                    invoicedAmount: purchaseInfo.invoicedAmount,
                    buyerId: purchaseInfo.buyerId,
                    memo: purchaseInfo.memo,
                    state: purchaseInfo.state,
                    distributorWalletId: purchaseInfo.distributorWalletId,
                    payeeId: purchaseInfo.buyerId,
                    state: purchaseInfo.state || 1,
                    escrowTerm: purchaseInfo.escrowTerm
                });


            // Execute the steps to create the purchase
            return await uhx.Repositories.transaction(async (_txc) => {

                // If the purchase is PENDING it needs to be processed - We need a quote and to deduct user account
                if (purchase.state == model.TransactionStatus.Pending) {
                    // 1. Does the quote exist and is it still valid?
                    var quote = await purchase.loadQuote(_txc);
                    var asset = await purchase.loadAsset(_txc);
                    if (quote.assetId != asset.id)
                        throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`Quote asset ${quote.assetId} does not match purchase order asset ${purchase.assetId}`, exception.ErrorCodes.DATA_ERROR, exception.RuleViolationSeverity.error));
                    else if (quote.expiry < new Date())
                        throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`Quote is expired`, exception.ErrorCodes.EXPIRED, exception.RuleViolationSeverity.error));
                    // 2. Set the invoice amount
                    if (!purchase.invoicedAmount || !purchase.invoicedAmount.code && !purchase.invoicedAmount.value)
                        purchase.invoicedAmount = new MonetaryAmount(purchase.quantity * quote.rate.value, quote.rate.code);

                    // 2a. Verify buyer is logged in user
                    var buyer = await purchase.loadBuyer(_txc);
                    if (!buyer)
                        throw new exception.NotFoundException("buyer", purchase.buyerId);
                    if (principal.session.userId != purchase.buyerId)
                        throw new exception.Exception(`Cannot process transactions on other user's accounts`, exception.ErrorCodes.SECURITY_ERROR);

                    // 3. Verify there is an asset sale active
                    var offering = await uhx.Repositories.assetRepository.getActiveOffer(purchase.assetId, _txc);
                    if (!offering)
                        throw new exception.Exception(`No current offer is active for this transaction`, exception.ErrorCodes.NO_OFFER);


                    // 5. Verify the asset wallet has sufficient balance for the transaction
                    var offerWallet = await uhx.StellarClient.getAccount(await offering.loadWallet(_txc));
                    var sourceBalance = offerWallet.balances.find((o) => o.code == asset.code);
                    if (!sourceBalance || sourceBalance.value < purchase.quantity)
                        throw new exception.Exception("Not enough assets on offering to fulfill this order", exception.ErrorCodes.INSUFFICIENT_FUNDS);
                    purchase.distributorWalletId = offerWallet.id;

                    // 6. Are there any limits on the total trade value?
                    var claims = await buyer.loadClaims(_txc);
                    if (claims["kyc.limit"]) {
                        // KYC Limit in USD, get total value of trade
                        var exchange = await new Bittrex().getExchange({ from: "USDT", to: purchase.invoicedAmount.code, via: ["BTC"] });
                        if (exchange[0] * purchase.invoicedAmount.value > claims["kyc.limit"])
                            throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`The estimated trade value of ${exchange[0] * purchase.amount.value} exceeds this account's AML limit`, exception.ErrorCodes.AML_CHECK, exception.RuleViolationSeverity.ERROR));
                    }

                    // 3. Insert purchase as a transaction and as a purchase
                    purchase._payorWalletId = offerWallet.id;
                    purchase._payeeWalletId = (await buyer.loadStellarWallet(_txc)).id;
                    await purchase.loadPayee(_txc);
                    await purchase.loadPayor(_txc);

                    purchase.amount = new MonetaryAmount(purchase.quantity, asset.code);
                    purchase = await uhx.Repositories.transactionRepository.insert(purchase, principal, _txc);
                    purchase = await uhx.Repositories.transactionRepository.insertPurchase(purchase, principal, _txc);

                    // 7. Attempt to execute purchase
                    var linkedTxns = [];
                    purchase.state = await require("../payment_processor/" + purchase.invoicedAmount.code)(purchase, offerWallet, linkedTxns);

                    for (var i in linkedTxns)
                        await uhx.Repositories.transactionRepository.insert(linkedTxns[i], principal, _txc);

                    // 8. Update purchase information
                    purchase = await uhx.Repositories.transactionRepository.update(purchase, principal, _txc);
                    purchase = await uhx.Repositories.transactionRepository.updatePurchase(purchase, principal, _txc);

                    linkedTxns.push(purchase);

                    return linkedTxns;
                }
                else if (purchase.state == model.TransactionStatus.Active) // We are just recording an ACTIVE purchase which means we just want to deposit
                {
                    // 1. Load the buyer & asset
                    var buyer = await purchase.loadBuyer(_txc);
                    var asset = await purchase.loadAsset(_txc);

                    // 2. Is the distributor wallet specifically specified?
                    var sourceWallet = null;
                    if (!purchase.distributorWalletId) {
                        var offering = await uhx.Repositories.assetRepository.getActiveOffer(purchase.assetId, _txc);
                        if (!offering)
                            throw new exception.Exception(`No current offer is active for this transaction`, exception.ErrorCodes.NO_OFFER);

                        // 2a. Verify the asset wallet has sufficient balance for the transaction
                        sourceWallet = await offering.loadWallet(_txc);
                    }
                    else
                        sourceWallet = await purchase.loadDistributionWallet(_txc);

                    // 3. Verify balance
                    sourceWallet = await uhx.StellarClient.getAccount(sourceWallet);
                    var sourceBalance = sourceWallet.balances.find((o) => o.code == asset.code);
                    if (!sourceBalance || sourceBalance.value < purchase.quantity)
                        throw new exception.Exception("Not enough assets on offering to fulfill this order", exception.ErrorCodes.INSUFFICIENT_FUNDS);
                    purchase.distributorWalletId = sourceWallet.id;

                    // 4. Insert the ACTIVE order
                    purchase._payorWalletId = sourceWallet.id;
                    purchase._payeeWalletId = (await buyer.loadStellarWallet(_txc)).id;
                    await purchase.loadPayee(_txc);
                    await purchase.loadPayor(_txc);

                    purchase = await uhx.Repositories.transactionRepository.insert(purchase, principal, _txc);
                    purchase = await uhx.Repositories.transactionRepository.insertPurchase(purchase, principal, _txc);

                    // 5. Now just dump the asset into the user's wallet
                    try {

                        var buyerWallet = await buyer.loadStellarWallet(_txc);
                        // If the user wallet is not active, activate it with 2 XLM
                        if (!await uhx.StellarClient.isActive(buyerWallet)) {
                            if (purchaseInfo.autoActivate)
                                buyerWallet = await uhx.StellarClient.activateAccount(buyerWallet, "1.6", sourceWallet);
                            else
                                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Buyer's Stellar account is not active", exception.ErrorCodes.INVALID_ACCOUNT, exception.RuleViolationSeverity.ERROR));
                        }

                        // If the buyer wallet does not have a trust line, trust the asset
                        buyerWallet = await uhx.StellarClient.getAccount(buyerWallet);
                        if (!buyerWallet.balances.find(o => o.code == asset.code))
                            buyerWallet = await uhx.StellarClient.createTrust(buyerWallet, asset);

                        // Process the payment
                        var transaction = await uhx.StellarClient.createPayment(sourceWallet, buyerWallet, new MonetaryAmount(purchase.quantity, asset.code), purchase.id, 'hash');
                        purchase.state = model.TransactionStatus.Complete;
                        purchase.ref = transaction.ref;
                        purchase.postingDate = purchase.transactionTime = purchase.transactionTime || new Date();
                        await uhx.Repositories.transactionRepository.update(purchase, principal, _txc);
                        await uhx.Repositories.transactionRepository.updatePurchase(purchase, principal, _txc);
                    }
                    catch (e) {
                        uhx.log.error(`Error transacting with Stellar network: ${e.message}`);
                        purchase.state = model.TransactionStatus.Failed;
                        purchase.ref = e.code || exception.ErrorCodes.COM_FAILURE;
                        await uhx.Repositories.transactionRepository.updatePurchase(purchase, principal, _txc);
                        throw e;
                    }
                }
                else {
                    purchase = await uhx.Repositories.transactionRepository.insert(purchase, principal, _txc);
                    purchase = await uhx.Repositories.transactionRepository.insertPurchase(purchase, principal, _txc);
                }
                return [purchase];

            });
        }
        catch (e) {
            uhx.log.error(`Error completing purchase: ${e.message}`);

            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error completing purchase", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Get the entire transaction history for the user's wallet
     * @param {string} userId The unique identifier of the user for which transaction history should be loaded
     * @param {*} filter The filter to be applied to the transaction history
     * @param {SecurityPrincipal} principal The user who is running the query
     */
    async getTransactionHistory(userId, filter, principal) {

        try {

            // First we want to fetch the transaction history from stellar
            if (userId) // user querying for self
            {
                var user = await uhx.Repositories.userRepository.get(userId);
                var userWallet = await user.loadStellarWallet();

                // Get the stellar transaction history for the user
                var transactionHistory = await uhx.StellarClient.getTransactionHistory(userWallet, filter);
                return transactionHistory;
            }
            else if ((!filter._localOnly && (filter.payorId || filter.payeeId)) && !(principal.grant["transaction"] & security.PermissionType.OWNER)) {
                var txFilter = new Transaction(null, null, null, null, filter.payorId, filter.payeeId, null, null, null, null);

                var wallet = null;
                if (filter.payorId)
                    wallet = await txFilter.loadPayorWallet();
                else
                    wallet = await txFilter.loadPayeeWallet();

                var transactionHistory = await uhx.StellarClient.getTransactionHistory(wallet, filter);
                return transactionHistory;
            }
            else if (!(principal.grant["transaction"] & security.PermissionType.OWNER)) { // just filter on our local database
                return await uhx.Repositories.transaction(async (_txc) => {
                    var txFilter = new Transaction(filter.id, filter.type, filter.memo, filter.postingDate, filter.payorId, filter.payeeId, new MonetaryAmount(filter.amount, filter.asset), null, null, filter.state);
                    txFilter.batchId = filter.batchId;
                    txFilter.state = filter.state;
                    await txFilter.loadPayeeWallet(_txc);
                    await txFilter.loadPayorWallet(_txc);
                    var transactionHistory = await uhx.Repositories.transactionRepository.query(txFilter, filter._offset, filter._count, _txc);
                    for (var t in transactionHistory) {
                        await transactionHistory[t].loadPayee(_txc);
                        await transactionHistory[t].loadPayor(_txc);
                        if (transactionHistory[t].loadBuyer)
                            await transactionHistory[t].loadBuyer(_txc);
                        if (transactionHistory[t].loadAsset)
                            await transactionHistory[t].loadAsset(_txc);
                    }
                    return transactionHistory;

                });
            }

        }
        catch (e) {
            uhx.log.error(`Error getting transaction history: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error fetching transaction history", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Creates a transaction
     * @param {Array} transactions The transactions that are being inserted or executed
     * @param {SecurityPrincipal} principal The user that is creating the transaction
     * @returns {Array} The created to planned transactions
     */
    async createTransaction(transactions, principal) {
        try {

            // Validate that purchases are done with purchase API
            if (transactions.find(o => o.type == model.TransactionType.Purchase))
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Purchases must be made with the Purchase API not Transaction API", exception.ErrorCodes.NOT_SUPPORTED, exception.RuleViolationSeverity.ERROR));

            // First we will validate each transaction based on principal use
            if (principal.grant && principal.grant["transaction"] & security.PermissionType.OWNER) // Principal is only allowed to create where they are the payor for themselves
            {
                if (transactions.find(o => o.state != model.TransactionStatus.Pending || o.payorId && o.payorId == principal.session.userId))
                    throw new exception.BusinessRuleViolationException(new exception.RuleViolation("User can only create PENDING transactions for your own account", exception.ErrorCodes.ARGUMENT_EXCEPTION, exception.RuleViolationSeverity.ERROR));

                // Copy the transactions and make them safe
                transactions = transactions.map(t => new Transaction(t.id, t.type, t.memo, null, principal.session.userId, t.payee || t.payeeId, t.amount, null, null, model.TransactionStatus.Pending));
            }
            else if (principal.grant["transaction"] == 15 && model.TransactionType.Purchase) {
                transactions = transactions.map(t => new Transaction(t.id, t.type, t.memo, t.postingDate, t.payor || t.payorId || principal.session.userId, t.payee || t.payeeId, t.amount, null, null, t.state));
            }
            else if (principal.grant === "internal") {
                transactions = transactions.map(t=> new Transaction(t.id, t.type, t.memo, t.postingDate, t.payor || t.payorId , t.payee || t.payeeId, t.amount, null, null, t.state));
            }
            else {
                // Transaction map
                transactions = transactions.map(t => new Transaction(t.id, t.type, t.memo, t.postingDate, t.payor || t.payorId, t.payee || t.payeeId, t.amount, null, null, t.state));
            }

            // We need to plan out the drop of accounts ... All transactions with
            return await uhx.Repositories.transaction(async (_txc) => {

                // First, insert all of the transactions
                for (var i in transactions) {
                    await transactions[i].loadPayorWallet();
                    await transactions[i].loadPayeeWallet();
                    transactions[i] = await uhx.Repositories.transactionRepository.insert(transactions[i], principal, _txc);

                    // Batch identifier...
                    if (i == 0)
                        transactions.forEach(o => o.batchId = transactions[i].batchId);
                }

                // Spawn transaction executions in a file
                // TODO: Verify balances before transacting with Stellar

                // Execute the transaction batch
                // var batchId = transactions[0].batchId;
                // if(transactions.length > 4)
                //     uhx.WorkerPool.anyp({action: 'processTransactions', batchId: batchId, sessionId: principal.session.id });
                // else {
                // Update the transactions
                for (var i in transactions) {
                    await uhx.StellarClient.execute(transactions[i]);
                    await uhx.Repositories.transactionRepository.update(transactions[i], principal, _txc);
                }
                // }


                return transactions;
            });
        }
        catch (e) {
            uhx.log.error(`Error creating transaction: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error creating transaction", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Transfers ethereum balance
     * @param {Object} transferInfo The transfer information
     * @param {SecurityPrincipal} principal The user that is creating the transaction
     * @returns {Object} The transaction results
     */
    async transferEther(transferInfo, principal) {

        if (transferInfo.amount.code != "ETH")
            throw new exception.ArgumentException("currency code");

        try {
            // Only owner of Ether can transfer Ether
            if (principal.grant["transaction"] & security.PermissionType.OWNER) // Principal is only allowed to create where they are the payor for themselves
            {
                // Set the payor
                var payor = await uhx.Repositories.walletRepository.getByUserAndNetworkId(principal.session.userId, 2);

                // Get the payee
                if (/^0x[a-fA-F0-9]{40}$/.test(transferInfo.payeeId))
                    var payee = { address: transferInfo.payeeId };
                else if (uhx.Config.security.username_regex.test(transferInfo.payeeId))
                    var payee = await uhx.Repositories.walletRepository.getByNameAndNetwork(transferInfo.payeeId, 2);

                // Transfer ether
                var txResult = await uhx.Web3Client.createPayment(payor, payee.address, transferInfo.amount);
            }
            return txResult;
        }
        catch (e) {
            uhx.log.error(`Error creating transfer: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error creating transfer", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
 * @method
 * @summary Transfers bitcoin balance
 * @param {Object} transferInfo The transfer information
 * @param {SecurityPrincipal} principal The user that is creating the transaction
 * @returns {Object} The transaction results
 */
    async transferBitcoin(transferInfo, principal) {

        if (transferInfo.amount.code != "BTC")
            throw new exception.ArgumentException("currency code");

        try {
            // Only owner of bitcoin can transfer bitcoin
            if (principal.grant["transaction"] & security.PermissionType.OWNER) // Principal is only allowed to create where they are the payor for themselves
            {
                // Set the payor
                var payor = await uhx.Repositories.walletRepository.getByUserAndNetworkId(principal.session.userId, 3);

                // Get the payee
                if (/[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(transferInfo.payeeId))
                    var payee = { address: transferInfo.payeeId };
                else if (uhx.Config.security.username_regex.test(transferInfo.payeeId))
                    var payee = await uhx.Repositories.walletRepository.getByNameAndNetwork(transferInfo.payeeId, 3);

                // Transfer ether
                var txResult = await uhx.BitcoinClient.createPayment(payor, payee.address, transferInfo.amount);
            }
            return txResult;
        }
        catch (e) {
            uhx.log.error(`Error creating transfer: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error creating transfer", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Plans an airdrop
     * @param {Airdrop} dropSpec The airdrop to be planned
     * @param {SecurityPrincipal} principal The user that is planning the drop
     * @returns {Airdrop} The airdrop transactions that need to occur
     */
    async planAirdrop(dropSpec, assetId, principal) {

        try {

            var promises = [];

            // Drop spec
            if (!dropSpec.amount)
                throw new exception.ArgumentException("amount missing");

            // Payor wallet!!!
            var payorWallet = null;
            if (!dropSpec.payorId) // no payor , by default should be the asset being dropped
            {
                var asset = await uhx.Repositories.assetRepository.get(assetId);
                payorWallet = await uhx.Repositories.assetRepository.getActiveOffer(asset.id);
                if (!payorWallet)
                    payorWallet = await asset.loadDistributorWallet();
                else
                    payorWallet = await payorWallet.loadWallet();
            }
            else if (uuidRegex.test(dropSpec.payorId))
                try { payorWallet = await uhx.Repositories.walletRepository.get(dropSpec.payorId); }
                catch (e) { payorWallet = await (await uhx.Repositories.userRepository.get(dropSpec.payorId)).loadStellarWallet(); }
            else
                payorWallet = await uhx.Repositories.walletRepository.getByPublicKey(dropSpec.payorId);

            // Function that distributes the asset
            var distributeFn =
                /** @param {User} u */
                async (u) => {
                    var w = await u.loadStellarWallet();
                    if (!w) return;
                    else
                        w = await uhx.StellarClient.isActive(w);

                    var txns = [];
                    // Is the account active? If not and auto-activate add transaction for that
                    if ((!w || !w.balances || w.balances.length == 0)) {
                        w = await u.loadStellarWallet();
                        if (dropSpec.autoActivate) {
                            txns.push(new Transaction(null, model.TransactionType.AccountManagement, "Activate account for airdrop", null, payorWallet, u, new MonetaryAmount(1.6, "XLM"), new MonetaryAmount(0.0000100, "XLM"), null, model.TransactionStatus.Pending));
                            txns.push(new Transaction(null, model.TransactionType.Trust, "Trust air-dropped asset", null, u, u, new MonetaryAmount(0, dropSpec.amount.code), new MonetaryAmount(0.0000100, "XLM"), null, model.TransactionStatus.Pending));
                            w.balances = [];
                        }
                        else
                            dropSpec.issues.push(new exception.RuleViolation(`Cannot airdrop to ${u.name} because Stellar account is inactive`, exception.ErrorCodes.INVALID_ACCOUNT, exception.RuleViolationSeverity.WARNING));

                    }
                    // Does the user have a trust line?
                    else if (!w.balances.find(o => o.code == dropSpec.amount.code)) {
                        // We will need to trust, does the user have enough XLM to trust?
                        var minBalance = (1.1 + w.balances.length * 0.5);
                        var topUp = minBalance - w.balances.find(o => o.code == "XLM").value;
                        if (topUp > 0) {
                            if (dropSpec.autoTopUp) {
                                txns.push(new Transaction(null, model.TransactionType.Deposit, "Top-up account for airdrop", null, payorWallet, u, new MonetaryAmount(topUp, "XLM"), new MonetaryAmount(0.0000100, "XLM"), null, model.TransactionStatus.Pending));
                                txns.push(new Transaction(null, model.TransactionType.Trust, "Trust air-dropped asset", null, u, u, new MonetaryAmount(0, dropSpec.amount.code), new MonetaryAmount(0.0000100, "XLM"), null, model.TransactionStatus.Pending));
                            }
                            else
                                dropSpec.issues.push(new exception.RuleViolation(`Cannot airdrop to ${u.name} because they require additional ${topUp} XLM to create trust`, exception.ErrorCodes.INSUFFICIENT_FUNDS, exception.RuleViolationSeverity.WARNING));
                        }
                        else if (dropSpec.autoTrust) {
                            txns.push(new Transaction(null, model.TransactionType.Trust, "Trust air-dropped asset", null, u, u, new MonetaryAmount(0, dropSpec.amount.code), new MonetaryAmount(0.0000100, "XLM"), null, model.TransactionStatus.Pending));
                        }
                        else
                            dropSpec.issues.push(new exception.RuleViolation(`Cannot airdrop to ${u.name} because ${dropSpec.amount.code} is not trusted`, exception.ErrorCodes.SECURITY_ERROR, exception.RuleViolationSeverity.WARNING));
                    }

                    // They have a trust line or there are transactions to establish it
                    if (txns.length > 0 || w.balances.find(o => o.code == dropSpec.amount.code)) {
                        var amt = null;
                        switch (dropSpec.distribution.mode) {
                            case "all":
                            case "user":
                                amt = dropSpec.amount;
                                break;
                            case "min": {
                                var bal = w.balances.find(o => o.code == dropSpec.distribution.min.code);

                                if (bal && Number(bal.value) >= Number(dropSpec.distribution.min.value))
                                    amt = dropSpec.amount;
                                else
                                    return;

                                break;
                            }
                            case "each": {
                                var bal = w.balances.find(o => o.code == dropSpec.distribution.min.code);
                                if (bal) {
                                    var value = Number(bal.value);
                                    if (!dropSpec.distribution.allowPartial)
                                        value = Math.trunc(value);
                                    value = value * Number(dropSpec.amount.value);
                                    amt = new MonetaryAmount(value, dropSpec.amount.code);
                                }
                                else
                                    return;
                                break;
                            }
                        }
                        txns.push(new Transaction(null, model.TransactionType.Airdrop, dropSpec.memo || `Airdrop of ${dropSpec.amount.code}`, null, payorWallet, u, amt, new MonetaryAmount(0.0000100, "XLM"), null, model.TransactionStatus.Pending));
                    }

                    dropSpec.plan = dropSpec.plan.concat(txns);
                }

            // First we want to make sure that drop parameters are valid
            switch (dropSpec.distribution.mode) {
                case "all":
                    // All we need is the amount
                    var scanFn = async (ofs) => {
                        var np = await uhx.Repositories.userRepository.query(new User(), ofs, 100)
                        promises = promises.concat(np.map(u => distributeFn(u)));
                        if (np.length == 100)
                            promises.push(scanFn(ofs + 100));
                    };
                    promises.push(scanFn(0));
                    break;
                case "each":
                    break;
                case "min":
                    break;
                case "user":
                    promises.push(distributeFn(await uhx.Repositories.userRepository.get(dropSpec.payeeId)));
                    break;
            }

            var retVals = [];
            while (retVals.length < promises.length) {
                retVals = retVals.concat(await Promise.all(promises));
            }

            // Summarize charges
            dropSpec.summary = {
                total: new MonetaryAmount(dropSpec.plan.filter(a => a.amount.code == dropSpec.amount.code).map(a => a.amount.value).reduce((a, b) => Number(a) + Number(b), 0), dropSpec.amount.code),
                fee: new MonetaryAmount(dropSpec.plan.map(a => a.fee.value).reduce((a, b) => Number(a) + Number(b), 0), "XLM"),
                other: new MonetaryAmount(dropSpec.plan.filter(a => a.amount.code == "XLM" && a.payorId == payorWallet.address).map(a => a.amount.value).reduce((a, b) => Number(a) + Number(b), 0), "XLM")
            };

            return dropSpec;
        }
        catch (e) {
            uhx.log.error(`Error planning airdrop: ${e.message} : ${e.stack}`);
            throw new exception.Exception("Error planning airdrop", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }


    /**
     * @method
     * @summary Gets all balances for the user wallet
     * @param {Wallet} userWallet The wallet for which the balances should be added to
     */
    async getAllBalancesForWallets(userWallets) {

        try {

            if (!Array.isArray(userWallets))
                userWallets = [userWallets];

            for (var w in userWallets) {
                var config = uhx.Config[userWallets[w].network.toLowerCase()];
                if (config && config.enabled !== false) // must exist and must be explicitly disabled
                    if (config.client.activeFn) {
                        userWallets[w] = await uhx[config.client.name][config.client.activeFn](userWallets[w]) || userWallets[w];
                    }
                    else {
                        userWallets[w] = await uhx[config.client.name][config.client.balanceFn](userWallets[w]) || userWallets[w];
                    }
            }

            return userWallets;
        }
        catch (e) {
            uhx.log.error("Error getting balance: " + e.message);
            throw new exception.Exception("Error getting balance:", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
 * @method
 * @summary Gets all balances for the user wallet
 * @param {Wallet} userWallet The wallet for which the balances should be added to
 */
    async generateWallets(network) {

        try {
            var users = await uhx.Repositories.userRepository.getAllWithoutWallet(network);
            if (network == 1) {
                var config = uhx.Config["stellar"];
            }
            else if (network == 2) {
                var config = uhx.Config["ethereum"];
            }
            else if (network == 3) {
                var config = uhx.Config["bitcoin"];
            }
            if (config && config.enabled !== false) {
                var created = 0;
                for (var i = 0; i < users.length; i++) {
                    if (config.client.createFn) {
                        var wallet = await uhx[config.client.name][config.client.createFn](users[i].id) || await uhx[config.client.name][config.client.createFn]();
                        await uhx.Repositories.walletRepository.insert(wallet);
                        created++;
                    }
                };
                return "Wallets generated for " + created + " users";
            }
            else {
                throw new exception.Exception("Network Not Enabled", exception.ErrorCodes.UNKNOWN)
            }
        }
        catch (e) {
            uhx.log.error("Error generating wallet: " + e.message);
            throw new exception.Exception("Error generating wallet:", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Gets the specified transaction from the local database or from the block chain
     * @param {String} txId The identifier of the transaction to retrieve
     * @param {SecurityPrincipal} principal The user who is making the request
     */
    async getTransaction(txId, principal) {

        try {

            if (uuidRegex.test(txId)) // txid is a UUID, we should have this info locally
            {
                // Step 1. First we load the transaction from the DB
                var txInfo = await uhx.Repositories.transaction(async (_txc) => {
                    var transaction = await uhx.Repositories.transactionRepository.get(txId, _txc);
                    await transaction.loadPayee(_txc);
                    await transaction.loadPayor(_txc);
                    if (transaction.loadBuyer)
                        await transaction.loadBuyer(_txc);
                    if (transaction.loadAsset)
                        await transaction.loadAsset(_txc);
                    return transaction;
                });

                // Security check
                if ((principal.grant["transaction"] & security.PermissionType.OWNER) &&
                    txInfo.payorId != principal.session.userId &&
                    txInfo.payeeId != principal.session.userId)
                    throw new security.SecurityException(new security.Permission("transaction", security.PermissionType.READ));

                return txInfo;

            }
            else {
                // Retrieve the stellar operation or transaction
            }
        }
        catch (e) {
            uhx.log.error(`Error retrieving transaction: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error retrieving transaction", e.code || exception.ErrorCodes.UNKNOWN, e);

        }
    }


    /**
 * @method
 * @summary Gets the specified transaction from the local database or from the block chain 
 * @param {String} txId The identifier of the transaction to retrieve
 * @param {SecurityPrincipal} principal The user who is making the request
 */
    async createEscrow(escrowInfo, principal) {

        try {
            var payorWallet = await uhx.Repositories.walletRepository.getByUserAndNetworkId(escrowInfo.payorId, "1");

            transaction = {
                "type": "1",
                "payeeWalletId": "80c9043d-72c9-4dfa-a977-76765c1bb813",
                "payorWalletId": escrowInfo.payorId,
                "amount": {
                    "value": "5",
                    "code": "RECOIN",
                },
                "state": "1",
                "memo": "Escrow",
                "network": "1"
            }
            var transaction = new Transaction().copy(transaction)

            await uhx.TokenLogic.fundEscrow(transaction, principal)

            var result = await uhx.StellarClient.createEscrow(payeeWallet, payorWallet, escrowInfo.amount);

        }
        catch (e) {
            uhx.log.error(`Error retrieving transaction: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error retrieving transaction", e.code || exception.ErrorCodes.UNKNOWN, e);

        }
    }

    /**
 * @method
 * @summary Creates a transaction
 * @param {Array} transactions The transactions that are being inserted or executed
 * @param {SecurityPrincipal} principal The user that is creating the transaction
 * @returns {Array} The created to planned transactions
 */
    async fundEscrow(transaction, principal) {

        try {

            return await uhx.Repositories.transaction(async (_txc) => {

                await transaction.loadPayorWallet();
                await transaction.loadPayeeWallet();

                transaction = await uhx.Repositories.transactionRepository.insert(transaction, principal, _txc);

                await uhx.StellarClient.execute(transaction);
                await uhx.Repositories.transactionRepository.update(transaction, principal, _txc);

                return transaction;

            });
        }
        catch (e) {
            uhx.log.error(`Error creating transaction: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error creating transaction", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }
}
