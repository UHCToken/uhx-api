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
  * @summary Represents a quote for an internal asset to an external symbol or fiat
  */
 module.exports = class AssetQuote extends ModelBase {

    /**
     * @constructor
     * @summary Creates a new asset quote
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.loadAsset = this.loadAsset.bind(this);
    }

    /**
     * @method
     * @summary Converts this model class into a database class
     * @param {*} dbAsset The database representation of a quote
     */
    fromData(dbAsset) {
        this.id = dbAsset.id;
        this.assetId = dbAsset.asset_id;
        this.from = dbAsset.from_code;
        this.rate = dbAsset.rate;
        this.creationTime = dbAsset.creation_time;
        this.expiry = dbAsset.expiry;
        return this;
    }

    /**
     * @method
     * @summary Convert this quote model into a data model representation
     */
    toData() {
        return {
            id: this.id,
            asset_id: this.assetId,
            from_code: this.from,
            rate: this.rate,
            creation_time: this.creationTime,
            expiry: this.expiry
        };
    }

    /**
     * @method
     * @summary Loads an asset from the database
     * @returns {Asset} The asset for which this quote was obtained
     */
    async loadAsset() {

        if(!this._asset)    
            this._asset = await uhc.Repositories.assetRepository.get(this.assetId);
        return this._asset;

    }

    /**
     * @method
     * @summary Represent this object in JSON
     */
    toJSON() {
        var retVal = this.stripHiddenFields(this);
        retVal.asset = this._asset ? this._asset.stripHiddenFields(this) : null;
        return retVal;
    }
 }