
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
 * @class Application
 * @summary Represents an application
 * @property {string} id The identifier for the application
 * @property {string} name The name for the application
 * @property {Date} creationTime The time that the user was created
 * @property {string} createdBy The user that created the application
 * @property {Date} updatedTime The time that the user was updated
 * @property {string} updatedBy The user that updated  the application
 * @property {Date} deactivatedTime The time that the user was deactivated
 * @property {string} deactivatedBy The user that deactivated the application
 */
module.exports = class Application extends ModelBase {
    /**
     * @constructor
     * @summary Creates a new application instance
     */
    constructor () {
        super();
        
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
    }
    
    /**
     * 
     * @param {*} dbApplication The database application from which to construct this instance
     */
    fromData(dbApplication) {
        this.id = dbApplication.id;
        this.name = dbApplication.name;
        this.creationTime = dbApplication.creation_time;
        this.createdBy = dbApplication.created_by;
        this.updatedTime = dbApplication.updated_time;
        this.updatedBy = dbApplication.updated_by;
        this.deactivationTime = dbApplication.deactivation_time;
        this.deactivatedBy = dbApplication.deactivated_by;
        return this;
    }

    /**
     * @method
     * @summary Creates an instance of the application in data layer structure
     */
    toData() {
        return {
            id : this.id,
            name : this.name
            // All time and "by" fields are stripped as they are readonly
        }
    }

    /**
     * @summary Load the application grants
     */
    async loadGrants() {
        if(!this._grants) {
            this._grants = {};
            var perms = await uhc.Repositories.permissionRepository.getApplicationPermission(this.id);
            for(var p in perms)
                this._grants[perms[p].name] = perms[p].grant;
        }
        return this._grants;
    }

    /**
     * @method
     * @summary Serialize this instance to JSON object
     */
    toJSON() {
        return this.stripHiddenFields();
    }
}
