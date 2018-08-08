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
  * @property {string} userId The user id of the provider
  * @property {string} name The name of the provider
  * @property {string} description The textual information of the provider's profile
  * @property {string} tel The provider's telephone 
  * @property {string} fax The provider's fax number
  * @property {string} email The provider's contact email
  * @property {string} profileImage The provider's profile image
  * @property {Boolean} visible The visibility status to be displayed in the provider directory
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
  *             userId:
  *                 type: string
  *                 description: The user id of the provider
  *             name:
  *                 type: string
  *                 description: The name of the provider
  *             description:
  *                 type: string
  *                 description: Descriptive text which the provider has set (their profile)
  *             tel:
  *                 type: string
  *                 description: The provider's contact telephone number
  *             fax:
  *                 type: string
  *                 description: The provider's fax number
  *             email: 
  *                 type: string
  *                 description: Identifies the e-mail address of the provider
  *             profileImage:
  *                 description: The filename for the profile image for the user
  *                 type: string
  *             visible:
  *                 description: The visibility status to be displayed in the provider directory
  *                 type: string
  *             creationTime:
  *                 type: Date
  *                 description: The time that this provider account was created
  *             updatedTime:
  *                 type: Date
  *                 description: The time that the provider account was last updated
  *             deactivatedTime:
  *                 type: Date
  *                 description: The time that the provider account did or will become deactivated
  *     
  */
 module.exports = class Provider extends ModelBase {

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
     * @param {*} dbProvider The provider instance from the database
     */
    fromData(dbProvider) {
        this.id = dbProvider.id;
        this.userId = dbProvider.user_id;
        this.name = dbProvider.name;
        this.description = dbProvider.description;
        this.tel = dbProvider.tel;
        this.fax = dbProvider.fax;
        this.email = dbProvider.email;
        this.profileImage = dbProvider.profile_image;
        this.visible = dbProvider.visible;
        this.creationTime = dbProvider.creation_time;
        this.updatedTime = dbProvider.updated_time;
        this.deactivationTime = dbProvider.deactivation_time;
        return this;
    }

    /**
     * @method
     * @summary Converts this instance of the Provider class to a data layer compatible one
     */
    toData() {
        var retVal = {
            id : this.id,
            user_id : this.userId,
            name: this.name,
            description: this.description,
            tel: this.tel,
            fax: this.fax,
            email: this.email,
            profile_image: this.profileImage,
            visible: this.visible
        };

        return retVal;
    }

    /**
     * @method
     * @summary Prefetch provider service types
     */
    async loadProviderServiceTypes(_txc) {
        if(!this._psTypes)
            this._psTypes = await uhx.Repositories.providerRepository.getProviderServiceTypes(this.id, _txc);
        return this._psTypes;
    }

    /**
     * @method
     * @summary Prefetch provider service types
     */
    async loadAddresses(_txc) {
        if(!this._addresses)
            this._addresses = await uhx.Repositories.providerAddressRepository.getAllForProvider(this.id, _txc);
            if (this._addresses){
                for(var adr in this._addresses){
                    await this._addresses[adr].loadAddressServiceTypes();
                    await this._addresses[adr].loadAddressServices();
                }
            }
        return this._addresses;
    }

    /**
     * @method
     * @summary Serialize this instance to a JSON object
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.serviceTypes = this._psTypes;
        retVal.addresses = this._addresses;
        return retVal;
    }

    /**
     * @method 
     * @summary Returns a summary object
     */
    summary() {
        return new Provider().copy({
            id: this.id,
            name: this.name,
            email: this.email,
            userId: this.user_id
        });
    }
}
