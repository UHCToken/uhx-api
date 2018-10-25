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
 module.exports = class CareRelationship extends ModelBase {

    /**
     * @constructor
     * @summary Creates an invoice for a service
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
        this._externIds = [];
    }

    /**
     * @method
     * @summary Converts this model class into a database class
     * @param {*} dbAsset The database representation of a quote
     */
    fromData(dbCareRelationship) {
        this.id = dbCareRelationship.id;
        this.amount = dbCareRelationship.amount;
        this.info = dbCareRelationship.info;
        this.status = dbCareRelationship.status;
        this.creationTime = dbCareRelationship.creation_time;
        this.createdBy = dbCareRelationship.created_by;
        this.completionTime = dbCareRelationship.completion_time;
        this.patientId = dbCareRelationship.patient_id;
        this.providerId = dbCareRelationship.provider_id;
        this.addressId = dbCareRelationship.address_id;
        this.note = dbCareRelationship.note;
        this.providerNote = dbCareRelationship.provider_note;
        this.serviceTypeId = dbCareRelationship.service_type_id;
        this.serviceTypeName = dbCareRelationship.type_name,
        this.patientAddressShown = dbCareRelationship.patient_address_shown,
        this.patientEmailShown = dbCareRelationship.patient_email_shown;
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
            status: this.status,
            creation_time: this.creationTime,
            created_by: this.createdBy,
            completion_time: this.completionTime,
            patient_id: this.patientId,
            asset_id: this.assetId,
            provider_id: this.providerId,
            service_type_id: this.serviceTypeId,
            note: this.note,
            provider_note: this.providerNote,
            address_id: this.addressId,
            patient_address_shown: this.patientAddressShown,
            patient_email_shown: this.patientEmailShown,
        };
    }
    /**
     * @method
     * @summary Represent this object in JSON
     */
    toJSON() {
        var retVal = this.stripHiddenFields(this);
        retVal.address = this._address;
        retVal.patient = this._patient;
        retVal.provider = this._provider;
        return retVal;
    }

    async loadProvider() {
        if(!this._provider)
            this._provider = await uhx.Repositories.providerRepository.get(this.providerId);
        return this._provider;
    }

    async loadPatient() {
        if(!this._patient){
            this._patient = await uhx.Repositories.patientRepository.get(this.patientId);
            this._patient.email = this.patientEmailShown && this._patient && this._patient.email;
            this._patient.address = this.patientAddressShown && this._patient && this._patient.address;
        }    
        return this._patient;
    }

    async loadAddress() {
        if(!this._address)
            this._address = await uhx.Repositories.providerAddressRepository.get(this.addressId);
        return this._address;
    }
 }