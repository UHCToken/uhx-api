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
  * @property {string} id The identifier for the provider
  * @property {string} providerId The identifier of the provider
  * @property {string} addressId The identifier of the provider address
  * @property {string} serviceName The name of the service
  * @property {string} description The description of the service
  * @property {Float} cost The cost of the service
  * @property {string} serviceType The service type identifier of the service
  * @property {Date} creationTime The time that the provider was created
  * @property {Date} updatedTime The time that the provider was updated
  * @property {Date} deactivatedTime The time that the provider was deactivated
  * @swagger
  * definitions:
  *     Provider: 
  *         properties:
  *             id: 
  *                 type: string
  *                 description: The unique identifier for the provider
  *             providerId:
  *                 type: string
  *                 description: The identifier of the provider
  *             addressId:
  *                 type: string
  *                 description: The address id of the provider address
  *             serviceName:
  *                 type: string
  *                 description: The name of the service
  *             description:
  *                 type: string
  *                 description: The description of the service
  *             cost:
  *                 type: number
  *                 description: The cost of the service
  *             serviceType:
  *                 type: string
  *                 description: The identifier of the type of service
  *             creationTime:
  *                 type: Date
  *                 description: The time that this service was created
  *             updatedTime:
  *                 type: Date
  *                 description: The time that the service was last updated
  *             deactivatedTime:
  *                 type: Date
  *                 description: The time that the service did or will become deactivated
  *     
  */
 module.exports = class ProviderService extends ModelBase {

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
     * @param {*} dbService The provider instance from the database
     */
    fromData(dbService) {
        this.id = dbService.id;
        this.providerId = dbService.provider_id;
        this.addressId = dbService.address_id;
        this.serviceName = dbService.service_name;
        this.description = dbService.description;
        this.cost = dbService.cost;
        this.serviceType = dbService.service_type;
        this.creationTime = dbService.creation_time;
        this.updatedTime = dbService.updated_time;
        this.deactivationTime = dbService.deactivation_time;
        return this;
    }
    
    /**
     * @method
     * @summary Prefetch service type information
     */
    async loadServiceTypeDetails(_txc) {
        if(!this._typeDetails)
            this._typeDetails = await uhx.Repositories.serviceTypeRepository.get(this.serviceType, _txc);
        return this._typeDetails;
    }
    

    /**
     * @method
     * @summary Converts this instance of the Provider class to a data layer compatible one
     */
    toData() {
        var retVal = {
            id : this.id,
            provider_id : this.providerId,
            address_id : this.addressId,
            service_name: this.serviceName,
            description: this.description,
            cost: this.cost,
            service_type: this.serviceType
        };

        return retVal;
    }

    /**
     * @method
     * @summary Serialize this instance to a JSON object
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.serviceTypeDetails = this._typeDetails;
        return retVal;
    }

    /**
     * @method 
     * @summary Returns a summary object
     */
    summary() {
        return new ProviderService().copy({
            id: this.id,
            serviceName: this.service_name,
            serviceType: this.service_type,
            cost: this.cost,
            addressId: this.address_id,
            providerId: this.provider_id
        });
    }
}
