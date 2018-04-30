
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
    uhc = require('../uhc');

 /**
  * @class
  * @summary Represents an asset which this API can track and issue / distribute 
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
        this.type = dbAsset.type;
        this._issuer = dbAsset.issuer;
        this._distWalletId = dbAsset.dist_wallet_id;
        this.creationTime = dbAsset.creation_time;
        this.createdBy = dbAsset.created_by;
        this.updatedTime = dbAsset.updated_time;
        this.updatedBy = dbAsset.updated_by;
        this.deactivationTime = dbAsset.deactivation_time;
        this.deactivatedBy = dbAsset.deactivated_by;
        this.kycRequirement = dbAsset.kyc_req;
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
            type: this.type,
            issuer: this._issuer,
            dist_wallet_id: this._distWalletId,
            kyc_req: this.kycRequirement
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
            if(!p.startsWith("_"))
                this[p] = otherAsset[p] || this[p];
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
 }