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


const ModelBase = require('./ModelBase'),
    uhc = require("../uhc"),
    MonetaryAmount = require("./MonetaryAmount"),
    AssetQuote = require("./AssetQuote"),
    Asset = require("./Asset"),
    Wallet = require("./Wallet"),
    User = require("./User");

/**
 * @class
 * @summary Represents a purchase from an external asset class to an asset class
 * @description This class exists to save "prodding" the blockchain to see transfers, it also allows the tracking of external network
 *              purchases.
 * @swagger
 * definitions:
 *  Purchase:
 *      summary: Represents a completed purchase or agreement to purchase an asset from the distributor
 *      properties:
 *          id:
 *              type: string
 *              description: The unique identifier this system tracks the purchase with
 *          buyerId:
 *              type: string
 *              description: The unique identifier of the user who purchased (or received) the asset
 *          buyer:
 *              $ref: "#/definitions/User"
 *              description: The user who purchased the asset
 *          quoteId:
 *              type: string
 *              description: Identifies the quote which was used to execute the purchase
 *          quote:
 *              $ref: "#/definitions/AssetQuote"
 *              description: The quote which was used to execute the purchase
 *          invoicedAmount:
 *              $ref: "#/definitions/MonetaryAmount"
 *              description: The amount of currency collected from the buyer
 *          assetId:
 *              type: string
 *              description: The unique identifier for the asset class being purchased
 *          asset:
 *              $ref: "#/definitions/Asset"
 *              description: The asset which was bought
 *          amount:
 *              type: number
 *              description: The amount of the asset that was purchased
 *          memo:
 *              type: string
 *              description: A short memo field on the invoice / purchase
 *          ref:
 *              type: string
 *              description: A reference to the transaction which facilitated the purchase (could be an Etherium transaction, bank wire, etc.)
 *          escrowInfo:
 *              type: string
 *              description: A reference to a stellar escrow account which is being used to hold the distributed funds
 *          escrowTerm:
 *              type: string
 *              description: The term that the escrow was established under (90 DAY, 120 DAY, etc.)
 *              enum:
 *                  - '0 DAY'
 *                  - '15 DAY'
 *                  - '30 DAY'
 *                  - '60 DAY'
 *                  - '90 DAY'
 *                  - '120 DAY'
 *          creationTime:
 *              type: date
 *              description: The time the transaction was created
 *          createdBy:
 *              type: string
 *              description: The unique identifier of the user which created the transaction
 *          createdByUser:
 *              $ref: "#/definitions/User"
 *              description: The details of the user which created the purchase
 *          updatedTime:
 *              type: date
 *              description: The date that the purchase information (state, escrow, etc.) was updated
 *          updatedBy:
 *              type: string
 *              description: The unique identifier of the user that updated the purchase
 *          updatedByUser:
 *              $ref: "#/definitions/User"
 *              description: The user which updated the purchase
 *          transactionTime:
 *              type: date
 *              description: The time that the transaction occurred
 *          distributorWalletId:
 *              type: string
 *              description: The wallet which the assetId was purchased from
 *          distributorWallet:
 *              $ref: "#/definitions/Wallet"
 *              description: The wallet which was debited
 *          state:
 *              type: number
 *              description: The status of the purchase
 *              enum: 
 *                  - 1: PENING - The transaction has not been posted to the blockchain
 *                  - 2: COMPLETE - The transaction was completed and posted to the buyer's blockchain account
 *                  - 3: CANCEL - The transaction was cancelled by some process
 *                  - 4: REJECT - The transaction was rejected (payment refused)
 *                  - 5: HOLD - The transaction is in escrow until further notice
 */
module.exports = class Purchase extends ModelBase {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.toData = this.toData.bind(this);
        this.fromData = this.fromData.bind(this);
        this.loadAsset = this.loadAsset.bind(this);
        this.loadBuyer = this.loadBuyer.bind(this);
        this.loadCreatedBy = this.loadCreatedBy.bind(this);
        this.loadQuote = this.loadQuote.bind(this);
    }

    /**
     * @method
     * @summary Convert from data model to this model
     * @param {*} dbPurchase The data model representation of the purchase
     */
    fromData(dbPurchase) {
        this.id = dbPurchase.id;
        this.buyerId = dbPurchase.user_id;
        this.quoteId = dbPurchase.quote_id;
        this.invoicedAmount = new MonetaryAmount(dbPurchase.charge_amount, dbPurchase.charge_currency);
        this.assetId = dbPurchase.asset_id;
        this.amount = dbPurchase.amount;
        this.memo = dbPurchase.memo;
        this.ref = dbPurchase.ref;
        this.escrowInfo = dbPurchase.escrow;
        this.escrowTerm = dbPurchase.escrow_time;
        this.creationTime = dbPurchase.creation_time;
        this.createdBy = dbPurchase.created_by;
        this.updatedTime = dbPurchase.updated_time;
        this.updatedBy = dbPurchase.updated_by;
        this.state = dbPurchase.state;
        this.distributorWalletId = dbPurchase.dist_wallet_id;
        this.transactionTime = dbPurchase.transaction_time;
        return this;
    }

    /**
     * @method
     * @summary Convert this model to a data model instance
     */
    toData() {
        return {
            id : this.id,
            user_id: this.buyerId,
            quote_id: this.quoteId,
            charge_amount: this.invoicedAmount.value,
            charge_currency: this.invoicedAmount.code,
            asset_id: this.assetId,
            amount: this.amount,
            memo: this.memo,
            ref: this.ref,
            escrow: this.escrowInfo,
            escrow_time: this.escrowTerm,
            state: this.state,
            transaction_time: this.transactionTime,
            dist_wallet_id: this.distributorWalletId
            // tracking fields not updated
        }
    }

    /**
     * @method
     * @summary Load the distributor wallet
     * @returns {Wallet} The wallet from which funds were distributed
     * @param {*} _txc The transaction run under
     */
    async loadDistributionWallet(_txc) {
        if(!this._distributorWallet)
            this._distributorWallet = await uhc.Repositories.walletRepository.get(this.distributorWalletId, _txc);
        return this._distributorWallet;
    }
    
    /**
     * @method
     * @summary Loads the buyer from the data model
     * @returns {User} The user which represents the buyer
     */
    async loadBuyer(_txc) {
        if(!this._buyer) {
            this._buyer = await uhc.Repositories.userRepository.get(this.buyerId, _txc);
            if(this.buyerId == this.createdBy)
                this._createdBy = this._buyer;
        }
        return this._buyer;
    }

    /**
     * @summary Gets the buyer 
     * @property {User}
     */
    get buyer() {
        return this._buyer;
    }

    /**
     * @method
     * @summary Loads the detailed quote information
     * @returns {AssetQuote} The loaded quote
     */
    async loadQuote(_txc) {
        if(!this._quote)
            this._quote = await uhc.Repositories.assetRepository.getQuote(this.quoteId, _txc);
        return this._quote;
    }

    /**
     * @property {AssetQuote}
     * @summary Gets the asset quote
     */
    get quote() {
        return this._quote;
    }

    /**
     * @method
     * @summary Loads the asset associated with this purchase
     * @returns {Asset} The loaded asset
     */
    async loadAsset(_txc) {
        if(!this._asset)
            this._asset = await uhc.Repositories.assetRepository.get(this.assetId, _txc);
        return this._asset;
    }

    /**
     * @property {Asset}
     * @summary Gets the asset associated with the purchase
     */
    get asset() {
        return this._asset;
    }

    /**
     * @method
     * @summary Loads the created by field
     * @returns {User} The loaded user who created this asset
     */
    async loadCreatedBy(_txc) {
        if(!this._createdBy) {
            this._createdBy = await uhc.Repositories.userRepository.get(this.createdBy, _txc);
            if(this.buyerId == this.createdBy)
                this._buyer = this._createdBy;
        }
        return this._createdBy;
    }

    /**
     * @method
     * @summary Represent this object as JSON
     */
    toJSON() {
        var retVal = this.stripHiddenFields(this);
        retVal.buyer = this.buyer ? this.buyer.stripHiddenFields() : null;
        retVal.asset = this.asset ? this.asset.stripHiddenFields() : null;
        retVal.quote = this.quote ? this.quote.stripHiddenFields() : null;
        retVal.createdByUser = this._createdBy ? this._createdBy.stripHiddenFields() : null;
        retVal.updatedByUser = this._updatedBy ? this._updatedBy.stripHiddenFields() : null;
        
        return retVal;
    }
}