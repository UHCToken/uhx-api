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
    uhc = require('../uhc'),
    MonetaryAmount = require('./MonetaryAmount');

 /**
  * @class
  * @summary Represents an asset sale which this API can track and issue / distribute
  * @swagger
  * definitions:
  *     Offer:
  *         properties:
  *             id:
  *                 type: string
  *                 description: The unique identifier for the asset sale entry
  *             assetId:
  *                 type: string
  *                 description: The asset to which the sale period belongs
  *             startDate:
  *                 type: Date
  *                 description: The starting date of the particular sale
  *             stopDate:
  *                 type: Date
  *                 description: The stop date of the sale offer
  *             price:
  *                 $ref: "#/definitions/MonetaryAmount"
  *                 description: The rate at which tokens can be baught
  *             amount:
  *                 type: number
  *                 description: The number of tokens which are sold at this rate
  *             public:
  *                 type: boolean
  *                 description: If true and the kyc_requirement of the asset is false then publish this offer onto the Stellar network
  *             creationTime:
  *                 type: Date
  *                 description: The time that this user account was created
  *             createdBy:
  *                 type: string
  *                 description: The identifier of the user which created this group
  *             updatedTime:
  *                 type: Date
  *                 description: The time that the user account was last updated
  *             updatedBy:
  *                 type: string
  *                 description: The identifier of the user which created this group
  *             deactivatedTime:
  *                 type: Date
  *                 description: The time that the user account did or will become deactivated
  *             deactivatedBy:
  *                 type: string
  *                 description: The time that the user account did or will become deactivated
  */
 module.exports = class Offer extends ModelBase {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.loadAsset = this.loadAsset.bind(this);
    }

    /**
     * @method 
     * @summary Converts a database asset sale to this model
     * @param {*} dbOffer The asset to be sold
     */
    fromData(dbOffer) {
        this.id = dbOffer.id;
        this.assetId = dbOffer.asset_id;
        this.startDate = dbOffer.start_date;
        this.stopDate = dbOffer.stop_date;
        this._walletId = dbOffer.wallet_id;
        this.price = new MonetaryAmount(dbOffer.price, dbOffer.price_code);
        this.amount = dbOffer.amount;
        this.createdBy = dbOffer.created_by;
        this.creationTime = dbOffer.creation_time;
        this.updatedBy = dbOffer.updated_by;
        this.updatedTime = dbOffer.updated_time;
        this.deactivationTime = dbOffer.deactivation_time;
        this.deactivatedBy = dbOffer.deactivated_by;
        this.offerId = dbOffer.offer_id;
        this.public = dbOffer.is_public;
        return this;
    }

    /**
     * @method
     * @summary Convert this method into database model
     */
    toData() {
        return {
            id : this.id,
            asset_id: this.assetId,
            start_date: this.startDate,
            stop_date: this.stopDate,
            wallet_id: this._walletId,
            price: this.price ? this.price.value : null,
            price_code: this.price ? this.price.code : null,
            amount: this.amount,
            is_public: this.public,
            offer_id: this.offerId
        }
    }



    /**
     * @method
     * @summary Loads the asset this offer belongs to
     * @returns {Asset} The loaded asset
     */
    async loadAsset(_txc) {
        if(!this._asset)
            this._asset = await uhc.Repositories.assetRepository.get(this.assetId, _txc);
        return this._asset;
    }

    /**
     * @method
     * @summary Loads the wallet for this offering
     * @param {Client} _txc The postgresql transaction to run this load request on
     * @returns {Wallet} The wallet for the offering
     */
    async loadWallet(_txc) {
        if(!this._wallet)
            this._wallet = await uhc.Repositories.walletRepository.get(this._walletId, _txc);
        return this._wallet;
    }

 }
