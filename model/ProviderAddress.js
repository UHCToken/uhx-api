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
    ModelBase = require('./ModelBase');

/**
 * @class Provider
 * @summary Represents a provider instance
 * @property {string} id The identifier for the provider address
 * @property {string} providerId The id of the provider
 * @property {string} addressName The name of the provider address name
 * @property {string} tel The provider address telephone 
 * @property {string} telExt The provider address telephone extension
 * @property {string} fax The provider address fax number
 * @property {string} street The provider address street
 * @property {string} unitSuite The provider address unit
 * @property {string} city The provider address city
 * @property {string} stateProv The provider address state or province
 * @property {string} country The provider address two digit country
 * @property {string} postalZip The provider address postal or zip code
 * @property {Boolean} visible The visibility status to be displayed in the provider directory
 * @property {Date} creationTime The time that the provider was created
 * @property {Date} updatedTime The time that the provider was updated
 * @property {Date} deactivatedTime The time that the provider was deactivated
 * @swagger
 * definitions:
 *     ProviderAddress: 
 *         properties:
 *             id: 
 *                 type: string
 *                 description: The unique identifier for the provider address
 *             providerId:
 *                 type: string
 *                 description: The identifier of the provider
 *             addressName:
 *                 type: string
 *                 description: The address name
 *             tel:
 *                 type: string
 *                 description: The address's contact telephone number
 *             telExt:
 *                 type: string
 *                 description: The address's contact telephone number extension
 *             fax:
 *                 type: string
 *                 description: The address's fax number
 *             street: 
 *                 type: string
 *                 description: The address's street
 *             unitSuite: 
 *                 type: string
 *                 description: The address's unit
 *             city: 
 *                 type: string
 *                 description: The address's city
 *             stateProv: 
 *                 type: string
 *                 description: The address's state or province
 *             country: 
 *                 type: string
 *                 description: The address's two digit country
 *             postalZip: 
 *                 type: string
 *                 description: The address's postal or zip code
 *             visible:
 *                 description: The visibility status to be displayed in the provider directory
 *                 type: string
 *             creationTime:
 *                 type: Date
 *                 description: The time that this provider address was created
 *             updatedTime:
 *                 type: Date
 *                 description: The time that the provider address was last updated
 *             deactivatedTime:
 *                 type: Date
 *                 description: The time that the provider address did or will become deactivated
 *     
 */
module.exports = class ProviderAddress extends ModelBase {

    /**
     * @constructor
     * @summary Constructs a new provider instance based on the database
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
        this._externIds = [];
    }

    /**
     * Create object from database provider
     * @param {*} dbAddress The provider instance from the database
     */
    fromData(dbAddress) {
        this.id = dbAddress.id;
        this.providerId = dbAddress.provider_id;
        this.addressName = dbAddress.address_name;
        this.tel = dbAddress.tel;
        this.telExt = dbAddress.tel_ext;
        this.fax = dbAddress.fax;
        this.street = dbAddress.street;
        this.unitSuite = dbAddress.unit_suite;
        this.city = dbAddress.city;
        this.stateProv = dbAddress.state_prov;
        this.country = dbAddress.country;
        this.postalZip = dbAddress.postal_zip;
        this.latitude = dbAddress.latitude;
        this.longitude = dbAddress.longitude;
        this.visible = dbAddress.visible;
        this.creationTime = dbAddress.creation_time;
        this.updatedTime = dbAddress.updated_time;
        this.deactivationTime = dbAddress.deactivation_time;
        this.distance = dbAddress.distance;
        return this;
    }

    /**
     * @method
     * @summary Converts this instance of the Provider class to a data layer compatible one
     */
    toData() {
        var retVal = {
            id: this.id,
            provider_id: this.providerId,
            address_name: this.addressName,
            tel: this.tel,
            tel_ext: this.telExt,
            fax: this.fax,
            street: this.street,
            unit_suite: this.unitSuite,
            city: this.city,
            state_prov: this.stateProv,
            country: this.country,
            postal_zip: this.postalZip,
            visible: this.visible,
            latitude: this.latitude,
            longitude: this.longitude
        };

        return retVal;
    }

    /**
     * @method
     * @summary Prefetch provider address service types
     */
    async loadAddressServiceTypes(_txc) {
        if (!this._asTypes)
            this._asTypes = await uhx.Repositories.providerAddressRepository.getAddressServiceTypes(this.id, _txc);
        return this._asTypes;
    }

    /**
     * @method
     * @summary Prefetch address services
     */
    async loadAddressServices(serviceType, _txc) {
        if (!this._services){
            if (!serviceType) this._services = await uhx.Repositories.providerServiceRepository.getAllForAddress(this.id, _txc);
            else this._services = await uhx.Repositories.providerServiceRepository.getAllForAddressByType(this.id, serviceType, _txc);
        }

        if (this._services) {
            for (var s in this._services) {
                if (await uhx.Repositories.providerServiceRepository.serviceTypeExists(this._services[s].id, this.id, _txc))
                    await this._services[s].loadServiceTypeDetails();
                else
                    this._services.splice(s, 1);
            }
        } else
            this._services = [];
        return this._services;
    }

    /**
     * @method
     * @summary Prefetch provider details
     */
    async loadProviderDetails(_txc) {
        if (!this._provider) {
            this._provider = await uhx.Repositories.providerRepository.get(this.providerId, _txc);
            await this._provider.loadProviderServiceTypes();
        }
        return this._provider;
    }

    /**
     * @method
     * @summary Serialize this instance to a JSON object
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.serviceTypes = this._asTypes;
        retVal.services = this._services;
        retVal.provider = this._provider;
        return retVal;
    }

    /**
     * @method 
     * @summary Returns a summary object
     */
    summary() {
        return new ProviderAddress().copy({
            id: this.id,
            addressName: this.address_name,
            providerId: this.provider_id
        });
    }
}
