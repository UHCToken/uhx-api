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
    uhx = require('../uhx');

/**
 * @class Service
 * @summary Represents a set of services provided as an service
 * @property {string} id The identifier for the service
 * @property {string} name The name of the service
 * @property {string} description The description for the service
 * @property {string} groupId The group id for UHC given by the service provider
 * @property {string} website The service providers website
 * @property {string} phoneNumber The service providers phone number
 * @swagger
 * definitions:
 *  Service:
 *      properties:
 *          id: 
 *              type: string
 *              description: The unique identifier for the service
 *          name:
 *              type: string
 *              description: The name of the service
 *          description:
 *              type: string
 *              description: The description of the service
 *          groupId:
 *              type: string
 *              description: The group id for UHC given by the service provider
 *          website:
 *              type: string
 *              description: The service providers website
 *          phoneNumber:
 *              type: string
 *              description: The service providers phone number
 */
module.exports = class Service extends ModelBase {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.toJSON = this.toJSON.bind(this);
    }

    /**
     * @method
     * @summary Parses the specified dbService into a Service instance
     * @param {*} dbService The service instance as represented in the database
     * @return {Service} The updated service instance
     */
    fromData(dbService) {
        this.id = dbService.id;
        this.name = dbService.name;
        this.description = dbService.description;
        this.groupId = dbService.group_id;
        this.website = dbService.website;
        this.phoneNumber = dbService.phone_number;
        return this;
    }

    /**
     * @method
     * @summary Converts this offering into a data model offering
     */
    toData() {
        return {
            id : this.id,
            name : this.name,
            description : this.description,
            group_id : this.groupId,
            website : this.website,
            phone_number : this.phoneNumber
        };
    }

    /**
     * @method
     * @summary Represents this object as JSON
     */
    toJSON() {
        return {
            id : this.id,
            name : this.name,
            description : this.description,
            groupId : this.group_id,
            website : this.website,
            phoneNumber : this.phone_number
        }
    }
}
