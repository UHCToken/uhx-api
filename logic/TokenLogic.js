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

const uhc = require('../uhc'),
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
    Purchase = require("../model/Purchase");

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
        this.createAsset = this.createAsset.bind(this);
        this.createAssetQuote = this.createAssetQuote.bind(this);
        this.createPurchase = this.createPurchase.bind(this);
    }

    /**
    * @method
    * @summary Gets or creates the stellar client
    * @returns {StellarClient} The stellar client
    */
    async getStellarClient() {
        if (!this._stellarClient)
            this._stellarClient = new StellarClient(uhc.Config.stellar.horizon_server, await uhc.Repositories.assetRepository.query(), uhc.Config.stellar.testnet_use);
        return this._stellarClient;
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
            else if (!/[A-Z0-9]{3,12}/g.test(asset.code))
                throw new exception.Exception("Asset code is is invalid", exception.ErrorCodes.INVALID_NAME)
            else if(asset.offers) {
                var total = 0;
                asset.offers.forEach((o)=> { total += o.amount || 0 });
                if(total > supply)
                    throw new exception.BusinessRuleViolationException(
                        new exception.RuleViolation(
                            `Total offers of ${total} exceed total supply of ${supply}`,
                            exception.ErrorCodes.INSUFFICIENT_FUNDS,
                            exception.RuleViolationSeverity.ERROR
                        )
                    );
            }

            // User's wallet
            var userWallet = await uhc.Repositories.walletRepository.getByUserId(principal.session.userId);

            // Verify that the user wallet is valid and has sufficient balance to continue
            if (!(await stellarClient.isActive(userWallet)) || userWallet.getBalanceOf("XLM").value < 6)
                throw new exception.BusinessRuleViolationException(
                    new exception.RuleViolation(
                        "User has insufficient balance to issue new Asset (minimum balance to issue asset is 6 XLM",
                        exception.ErrorCodes.INSUFFICIENT_FUNDS,
                        exception.RuleViolationSeverity.ERROR
                    )
                );

            // Step 2. Create and keep track of asset accounts
            return await uhc.Repositories.transaction(async (_txc) => {

                // Generate keypairs
                var issuingAccount = await stellarClient.generateAccount(),
                    distributingAccount = await stellarClient.generateAccount(),
                    supplyAccount = await stellarClient.generateAccount();

                issuingAccount = await uhc.Repositories.walletRepository.insert(issuingAccount, principal, _txc);
                distributingAccount = await uhc.Repositories.walletRepository.insert(distributingAccount, principal, _txc);

                // Insert asset
                asset._distWalletId = distributingAccount.id;
                asset.issuer = issuingAccount.address;
                asset = await uhc.Repositories.assetRepository.insert(asset, principal, _txc);

                // Asset sales
                if (asset.offers) {
                    var suppAcct = null;
                    for (var i in asset.offers) {
                        // If the asset is not public or there is a kyc requirement then the asset needs to be bought from the distributor here not on the exchange
                        if (!asset.offers[i].public || asset.kycRequirement) {
                            if(asset.offers[i].useDistributorWallet) {
                                asset.offers[i]._walletId = distributingAccount.id;
                            }
                            else {
                                suppAcct = suppAcct || await uhc.Repositories.walletRepository.insert(supplyAccount, principal, _txc);
                                asset.offers[i]._walletId = suppAcct.id;
                            }
                        }
                        asset.offers[i] = await uhc.Repositories.assetRepository.insertOffer(asset.id, asset.offers[i], principal, _txc);
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
                stellarClient.assets.push(asset);
                try {
                    // Pay the distributing account all the tokens in the supply!
                    await stellarClient.createPayment(issuingAccount, distributingAccount, new MonetaryAmount(supply, asset.code), "Initial Distribution");

                    // If there is an active sale, then we want to distribute to the supply account
                    var firstOffer = await uhc.Repositories.assetRepository.getActiveOffer(asset.id, _txc);
                    if (firstOffer && (!firstOffer.public || asset.kycRequirement) && supplyAccount) // We want to initialize the supplier account
                        await stellarClient.createPayment(distributingAccount, supplyAccount, new MonetaryAmount(firstOffer.amount, asset.code), crypto.createHash('sha256').update(asset.id).digest('hex'), 'hash');

                    var options = {
                        homeDomain: uhc.Config.stellar.home_domain
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
                            await uhc.Repositories.assetRepository.updateOffer(asset.offers[i], principal, _txc);
                        }
                }
                catch(e) {
                    stellarClient.assets.pop();
                    throw e;
                }

                return asset;
            });

        }
        catch (e) {
            uhc.log.error(`Error creating asset: ${e.message}`);
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
            var asset = await uhc.Repositories.assetRepository.query(new Asset().copy({code: sellCurrency}), 0, 1);
            asset = asset[0];
            if(!asset)
                throw new exception.Exception(`Invalid asset : ${sellCurrency}, only assets configured on this service can be quoted`, exception.ErrorCodes.RULES_VIOLATION);
            else if (asset.locked)
                throw new exception.Exception(`Selling of ${asset.code} from this distributor is currently locked`, exception.ErrorCodes.ASSET_LOCKED);
            // Get current offer
            var currentOffer = await uhc.Repositories.assetRepository.getActiveOffer(asset.id);
            if(!currentOffer)
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("The requested asset is not for sale at the moment", exception.ErrorCodes.NO_OFFER, exception.RuleViolationSeverity.ERROR));
            
            // Price?
            var retVal  = new AssetQuote().copy({
                assetId: asset.id,
                rate: new MonetaryAmount(null, purchaseCurrency),
                creationTime: new Date()
            });
            retVal._asset = asset;

            // Offer matches the purchase? 1..1 ...
            if(currentOffer.price && purchaseCurrency == currentOffer.price.code)
            {
                retVal.rate.value = currentOffer.price.value;
                retVal.expiry = currentOffer.stopDate;
            }
            else if(currentOffer.price) {
                // We're reaching out to bittrex so we should use ETH and BTC average offer to come up with a reasonable price for our asset
                var path = { from: currentOffer.price.code, to: purchaseCurrency };
                if(purchaseCurrency != "ETH" && purchaseCurrency != "BTC")
                    path = [
                        { from: currentOffer.price.code, to: purchaseCurrency, via: ["BTC"]},
                        { from: currentOffer.price.code, to: purchaseCurrency, via: ["ETH"]}
                    ];

                var exchange = await new Bittrex().getExchange(path);
                retVal.rate.value =  currentOffer.price.value/(exchange.reduce((a,b)=>a+b) / exchange.length); 
                retVal.expiry = new Date(new Date().getTime() + uhc.Config.stellar.market_offer_validity);
            }
            else { // Just a market rate offer
                // We're reaching out to bittrex so we should use ETH and BTC average offer to come up with a reasonable price for our asset
                var exchange = await new Bittrex().getExchange([
                    { from: asset.code , to: purchaseCurrency }
                ]);
                retVal.rate.value = exchange[0];
                retVal.expiry = new Date(new Date().getTime() + uhc.Config.stellar.market_offer_validity);
            }

            // Insert the offer
            if(!nostore)
                retVal = await uhc.Repositories.assetRepository.insertQuote(retVal);

            return retVal;
        }
        catch(e) {
            uhc.log.error(`Error creating asset quote: ${e.message}`);
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

            return await uhc.Repositories.transaction(async (_txc) => {
                
                // Create stellar client
                var stellarClient = uhc.StellarClient;
                
                // Verify user
                var user = await uhc.Repositories.userRepository.get(userId, _txc);

                // Does user already have wallet?
                var wallet = await user.loadWallet();
                if(!wallet) { // Generate a KP
                    // Create a wallet
                    var wallet = await stellarClient.generateAccount();
                    // Insert 
                    wallet = await uhc.Repositories.walletRepository.insert(wallet, null, _txc);
                    // Update user
                    user.walletId = wallet.id;
                    await uhc.Repositories.userRepository.update(user, null, null, _txc);
                }

                // Activate wallet if not already active
                if(!stellarClient.isActive(wallet))
                    await stellarClient.activateAccount(wallet, "1",  await testRepository.walletRepository.get(uhc.Config.stellar.initiator_wallet_id));
                return wallet;
            });
        }
        catch(e) {
            uhc.log.error("Error finalizing authentication: " + e.message);
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

            // Is this a user purchase or an admin purchase? Clean inputs based on permission level
            if(principal.grant["purchase"] & security.PermissionType.OWNER) // Principal is only allowed to buy for themselves
                purchaseInfo = new Purchase().copy({
                    quoteId: purchaseInfo.quoteId,
                    assetId: purchaseInfo.assetId,
                    amount: purchaseInfo.amount,
                    buyerId: principal.session.userId,
                    state: 1 // PENDING
                });
            else 
                purchaseInfo = new Purchase().copy({
                    quoteId: purchaseInfo.quoteId, 
                    assetId: purchaseInfo.assetId,
                    amount: purchaseInfo.amount,
                    invoicedAmount: purchaseInfo.invoicedAmount,
                    buyerId: purchaseInfo.buyerId,
                    escrowTerm: purchaseInfo.escrowTerm,
                    memo: purchaseInfo.memo,
                    state: purchaseInfo.state,
                    distributorWalletId: purchaseInfo.distributorWalletId,
                    state: purchaseInfo.state || 1
                });
            

            // Execute the steps to create the purchase
            return await uhc.Repositories.transaction(async (_txc) => {
                
                // If the purchase is PENDING it needs to be processed - We need a quote and to deduct user account
                if(purchaseInfo.state == model.PurchaseState.NEW) {
                    // 1. Does the quote exist and is it still valid? 
                    var quote = await purchaseInfo.loadQuote(_txc);
                    var asset = await purchaseInfo.loadAsset(_txc);
                    if(quote.assetId != asset.id)
                        throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`Quote asset ${quote.assetId} does not match purchase order asset ${purchaseInfo.assetId}`, exception.ErrorCodes.DATA_ERROR, exception.RuleViolationSeverity.error));
                    else if(quote.expiry < new Date())
                        throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`Quote is expired`, exception.ErrorCodes.EXPIRED, exception.RuleViolationSeverity.error));
                    // 2. Set the invoice amount
                    if(!purchaseInfo.invoicedAmount || !purchaseInfo.invoicedAmount.code && !purchaseInfo.invoicedAmount.value)
                        purchaseInfo.invoicedAmount = new MonetaryAmount(purchaseInfo.amount * quote.rate.value, quote.rate.code);

                    // 2a. Verify buyer is logged in user
                    var buyer = await purchaseInfo.loadBuyer(_txc);
                    if(!buyer)
                        throw new exception.NotFoundException("buyer", purchaseInfo.buyerId);
                    if(principal.session.userId != purchaseInfo.buyerId)
                        throw new exception.Exception(`Cannot process transactions on other user's accounts`, exception.ErrorCodes.SECURITY_ERROR);

                    // 3. Insert 
                    purchaseInfo = await uhc.Repositories.purchaseRepository.insert(purchaseInfo, principal, _txc);


                    // 4. Verify there is an asset sale active
                    var offering = await uhc.Repositories.assetRepository.getActiveOffer(purchaseInfo.assetId, _txc);
                    if(!offering)
                        throw new exception.Exception(`No current offer is active for this transaction`, exception.ErrorCodes.NO_OFFER);
                    
                    // 5. Verify the asset wallet has sufficient balance for the transaction
                    var offerWallet = await uhc.StellarClient.getAccount(await offering.loadWallet(_txc));
                    var sourceBalance = offerWallet.balances.find((o)=>o.code == asset.code);
                    if(!sourceBalance || sourceBalance.value < purchaseInfo.amount) 
                        throw new exception.Exception("Not enough assets on offering to fulfill this order", exception.ErrorCodes.INSUFFICIENT_FUNDS);
                    purchaseInfo.distributorWalletId = offerWallet.id;

                    // 6. Are there any limits on the total trade value?
                    var claims = await buyer.loadClaims(_txc);
                    if(claims["kyc.limit"]) {
                        // KYC Limit in USD, get total value of trade
                        var exchange = await new Bittrex().getExchange({ from: "USDT", to: purchaseInfo.invoicedAmount.code, via: [ "BTC" ]});
                        if(exchange[0] * purchaseInfo.invoicedAmount.value > claims["kyc.limit"])
                            throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`The estimated trade value of ${exchange[0] * purchaseInfo.invoicedAmount.value} exceeds this account's AML limit`, exception.ErrorCodes.AML_CHECK, exception.RuleViolationSeverity.ERROR));
                    }
                    
                    // TODO: Should we hold the user interface while this happens?
                    // 7. Attempt to execute purchase
                    purchaseInfo.state = await require("../payment_processor/" + purchaseInfo.invoicedAmount.code)(purchaseInfo, offerWallet);

                    // 8. Update purchase information
                    purchaseInfo = await uhc.Repositories.purchaseRepository.update(purchaseInfo, principal, _txc);

                } 
                else if(purchaseInfo.state == model.PurchaseState.ACTIVE) // We are just recording an ACTIVE purchase which means we just want to deposit 
                {
                    // 1. Insert the ACTIVE order
                    purchaseInfo = await uhc.Repositories.purchaseRepository.insert(purchaseInfo, principal, _txc);

                    // 2. Is the distributor wallet specifically specified?
                    var sourceWallet = null;
                    if(!purchaseInfo.distributorWalletId) {
                        var offering = await uhc.Repositories.assetRepository.getActiveOffer(purchaseInfo.assetId, _txc);
                        if(!offering)
                            throw new exception.Exception(`No current offer is active for this transaction`, exception.ErrorCodes.NO_OFFER);
                        
                        // 2a. Verify the asset wallet has sufficient balance for the transaction
                        sourceWallet = await offering.loadWallet(_txc);
                    }
                    else 
                        sourceWallet = await purchaseInfo.loadDistributionWallet(_txc);

                    // 3. Verify balance
                    sourceWallet = await uhc.StellarClient.getAccount(sourceWallet);
                    var sourceBalance = sourceWallet.balances.find((o)=>o.code == asset.code);
                    if(!sourceBalance || sourceBalance.value < purchaseInfo.amount) 
                        throw new exception.Exception("Not enough assets on offering to fulfill this order", exception.ErrorCodes.INSUFFICIENT_FUNDS);
                    purchaseInfo.distributorWalletId = sourceWallet.id;

                    // 4. Load the buyer & asset
                    var buyer = await purchaseInfo.loadBuyer(_txc);
                    var asset = await purchaseInfo.loadAsset(_txc);

                    // 5. Now just dump the asset into the user's wallet
                    try {

                        var buyerWallet = await buyer.loadWallet(_txc);
                        // If the user wallet is not active, activate it with 2 XLM
                        if(!await uhc.StellarClient.isActive(buyerWallet)) 
                            buyerWallet = await uhc.StellarClient.activateAccount(userWallet, "2", sourceWallet);

                        // If the buyer wallet does not have a trust line, trust the asset
                        buyerWallet = await uhc.StellarClient.getAccount(buyerWallet);
                        if(!buyerWallet.balances.find(o=>o.code == asset.code))
                            buyerWallet = await uhc.StellarClient.createTrust(buyerWallet, asset);

                        // Process the payment
                        var transaction = uhc.StellarClient.createPayment(sourceWallet, buyer, new MonetaryAmount(purchaseInfo.amount, asset.code), purchaseInfo.id, 'hash');
                        purchaseInfo.state = model.PurchaseState.COMPLETE;
                        purchaseInfo.ref = transaction.ref;
                        purchaseInfo.transactionTime = purchaseInfo.transactionTime || new Date();
                        await uhc.Repositories.purchaseRepository.update(purchaseInfo, principal, _txc);
                    }
                    catch (e) {
                        uhc.log.error(`Error transacting with Stellar network: ${e.message}`);
                        purchaseInfo.state = model.PurchaseState.REJECT;
                        purchaseInfo.ref = e.code || exception.ErrorCodes.COM_FAILURE;
                        await uhc.Repositories.purchaseRepository.update(purchaseInfo, principal, _txc);
                        throw e;
                    }
                }
                else 
                    purchaseInfo = await uhc.Repositories.purchaseRepository.insert(purchaseInfo, principal, _txc);

                return purchaseInfo;
                    
            });
        }
        catch(e) {
            uhc.log.error(`Error completing purchase: ${e.message}`);

            while(e.code == exception.ErrorCodes.DATA_ERROR && e.cause) 
                e = e.cause[0];
            throw new exception.Exception("Error completing purchase", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    
}
