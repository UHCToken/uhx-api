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
    uhx = require('../uhx'),
    MonetaryAmount = require("./MonetaryAmount");

 /**
  * @class
  * @summary Represents a quote for an internal asset to an external symbol or fiat
  * @swagger
  * definitions:
  *     AssetQuote:
  *         description: "Represents a quote of an internal managed asset against an external asset or fiat"
  *         properties:
  *             id: 
  *                 type: string
  *                 description: The unique identifier for the quote
  *             assetId:
  *                 type: string
  *                 description: The asset being represented in the quote
  *             asset:
  *                 $ref: "#/definitions/Asset"
  *                 description: The asset which is being quoted
  *             rate:
  *                 $ref: "#/definitions/MonetaryAmount"
  *                 description: The monetary amount of the quote
  *             creationTime:
  *                 type: date
  *                 description: The time the quote was created
  *             expiry:
  *                 type: date
  *                 description: The time the quote will expire
  */
 module.exports = class CareService extends ModelBase {

    /**
     * @constructor
     * @summary Creates an invoice for a service
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
    }

    /**
     * @method
     * @summary Converts this model class into a database class
     * @param {*} dbAsset The database representation of a quote
     */
    fromData(dbCareService) {
        this.id = dbCareService.id;
        this.amount = dbCareService.amount;
        this.info = dbCareService.info;
        this.creationTime = dbCareService.creation_time;
        this.createdBy = dbCareService.created_by;
        this.code = dbCareService.code;
        this.assetId = dbCareService.asset_id;
        this.carePlanId = dbCareService.care_plan_id;
        this.status = dbCareService.status;
        return this;
    }

    /**
     * @method
     * @summary Convert this quote model into a data model representation
     */
    toData() {
        return {
            id: this.id,
            amount: this.amount,
            info: this.info,
            creation_time: this.creationTime,
            created_by: this.createdBy,
            code: this.code,
            user_id: this.userId,
            asset_id: this.assetId,
            care_plan_id: this.carePlanId,
            status: this.status
        };
    }

    /**
     * @method
     * @summary Represent this object in JSON
     */
    toJSON() {
        var retVal = this.stripHiddenFields(this);
        return retVal;
    }
 }