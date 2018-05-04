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
    model = require('../model/model'),
    User = require('../model/User'),
    Asset = require('../model/Asset'),
    Offer = require('../model/Offer'),
    Wallet = require('../model/Wallet'),
    MonetaryAmount = require('../model/MonetaryAmount'),
    Transaction = require('../model/Transaction');

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
                issuingAccount = await stellarClient.activateAccount(issuingAccount, "2", userWallet);
                // Activate distribution account
                distributingAccount = await stellarClient.activateAccount(distributingAccount, "2", userWallet);
                // Activate supply account if needed
                if (supplyAccount) supplyAccount = await stellarClient.activateAccount(supplyAccount, "2", userWallet);

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
            console.error(`Error creating asset: ${e.message}`);
            throw new exception.Exception("Error creating asset", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }
}
