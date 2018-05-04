
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
    Offer = require('./Offer');

 /**
  * @class
  * @summary Represents an asset which this API can track and issue / distribute
  * @swagger
  * definitions:
  *     Asset:
  *         properties:
  *             id:
  *                 type: string
  *                 description: The unique identifier for the asset
  *             code:
  *                 type: string
  *                 description: The codified identifier for the asset
  *             name:
  *                 type: string
  *                 description: A textual description of the type of asset
  *             "description":
  *                 type: string
  *                 description: The description of the asset
  *             displayDecimals:
  *                 type: number
  *                 description: "The number of decimals to display"
  *             imageUrl:
  *                 type: string
  *                 description: A link to the image where this asset can be represented
  *             locked:
  *                 type: boolean
  *                 description: Indicates whether users can purchase (directly) assets from the main distributor account
  *             kycRequirement:
  *                 type: boolean
  *                 description: Identifies whether only whitelisted individuals can purchase this asset
  *             creationTime:
  *                 type: date
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
  *                 type: Date
  *                 description: The time that the user account did or will become deactivated
  *             offers:
  *                 $ref: "#/definitions/Offer"
  *                 description: Details about the offer scheduled for the asset
  */
 module.exports = class Asset extends ModelBase {

    /**
     * @constructor
     * @summary Creates a new instance of this class
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
    }

    /**
     * @method
     * @summary Copies the data from dbAsset into this instance
     * @param {*} dbAsset The asset instance from the database
     */
    fromData(dbAsset) {
        this.id = dbAsset.id;
        this.code = dbAsset.code;
        this.name = dbAsset.name;
        this.description = dbAsset.description;
        this.displayDecimals = dbAsset.display_decimals;
        this.imageUrl = dbAsset.img;
        this.issuer = dbAsset.issuer;
        this._distWalletId = dbAsset.dist_wallet_id;
        this.creationTime = dbAsset.creation_time;
        this.createdBy = dbAsset.created_by;
        this.updatedTime = dbAsset.updated_time;
        this.updatedBy = dbAsset.updated_by;
        this.deactivationTime = dbAsset.deactivation_time;
        this.deactivatedBy = dbAsset.deactivated_by;
        this.kycRequirement = dbAsset.kyc_req;
        this.locked = dbAsset.locked;
        return this;
    }

    /**
     * @method
     * @summary Return a data model instance from this instance of DB asset
     */
    toData() {
        return {
            id : this.id,
            code: this.code,
            name: this.name,
            issuer: this.issuer,
            dist_wallet_id: this._distWalletId,
            kyc_req: this.kycRequirement,
            img : this.imageUrl,
            display_decimals: this.displayDecimals,
            description: this.description
        };
    }

    /** 
     * @method
     * @summary Copy all the values from otherAsset into this asset
     * @returns {Asset} This asset with copied fields
     * @param {Asset} otherAsset The user from which the values for this user should be copied
     */
    copy(otherAsset) {
        this.fromData({});
        for(var p in this)
           if(!p.startsWith("_") && !(this[p] instanceof Function))
                this[p] = otherAsset[p] || this[p];
        this.offers = [];
        for(var i in otherAsset.offers)
            this.offers.push(otherAsset.offers[i] instanceof Offer ? otherAsset.offers[i] : new Offer().copy(otherAsset.offers[i]));
        return this;
    }

    /**
     * @summary Load the distributor wallet from the database
     */
    async loadDistributorWallet() {
        if(!this._distWallet)
            this._distWallet = uhc.Repositories.walletRepository.get(this._distWalletId);
        return this._distWallet;
    }

    /**
     * @summary Load sales information
     */
    async loadOffers() {
        if(!this._offerInfo)
            this._offerInfo = uhc.Repositories.assetRepository.getOffers(this.id);
        return this._offerInfo;
    }

    /**
     * @method
     * @summary Converts this asset to JSON
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.offers = this._offerInfo;
        return retVal;
    }
 }