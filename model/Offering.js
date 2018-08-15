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
 * @class Offering
 * @summary Represents a service offered
 * @property {string} id The identifier for the service
 * @property {string} description The description for the service
 * @property {Array} services The group of services offered
 * @swagger
 * definitions:
 *  Offering:
 *      properties:
 *          id: 
 *              type: string
 *              description: The unique identifier for the offering
 *          description: 
 *              type: string
 *              description: The description of the set of offerings available
 *          services: 
 *              type: Array
 *              description: A list of services available through this offering
 */
module.exports = class Offering extends ModelBase {

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
     * @summary Parses the specified dbOffering into an Offering instance
     * @param {*} dbOffering The offering instance as represented in the database
     * @return {Offering} The updated offering instance
     */
    fromData(dbOffering) {
        this.id = dbOffering.id;
        this.description = dbOffering.description;
        this.services = dbOffering.services;
        return this;
    }

    /**
     * @method
     * @summary Converts this offering into a data model offering
     */
    toData() {
        return {
            id : this.id,
            description : this.description,
            services : this.services
        };
    }

    /**
     * @method
     * @summary Represents this object as JSON
     */
    toJSON() {
        return {
            id : this.id,
            description : this.description,
            services : this.services
        }
    }
}
