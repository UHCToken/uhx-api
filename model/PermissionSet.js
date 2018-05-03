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


const ModelBase = require('./ModelBase');

/**
 * @class
 * @summary Represents a permission set
 * @property {string} id The identifier for the permission set
 * @property {string} name The unique name for the permission set
 * @property {string} description The description of the permission set
 * @property {Date} creationTime The time that the user was created
 * @property {string} createdBy The user that created the application
 * @property {Date} updatedTime The time that the user was updated
 * @property {string} updatedBy The user that updated  the application
 * @property {Date} deactivatedTime The time that the user was deactivated
 * @property {string} deactivatedBy The user that deactivated the application
 * @swagger
 * definitions:
 *  Permission:
 *      properties:
 *          id: 
 *              type: string
 *              description: The unique identifier for the permission
 *          name:
 *              type: string
 *              description: The unique system name for the permission
 *          description: 
 *              type: string
 *              description: The human readable description for the permission
 *          creationTime:
 *               type: Date
 *               description: The time that this user account was created
 *          createdBy:
 *              type: string
 *              description: The identifier of the user which created this group
 *          updatedTime:
 *               type: Date
 *               description: The time that the user account was last updated
 *          updatedBy:
 *              type: string
 *              description: The identifier of the user which created this group
 *          deactivatedTime:
 *               type: Date
 *               description: The time that the user account did or will become deactivated
 *          deactivatedBy:
 *               type: Date
 *               description: The time that the user account did or will become deactivated
 */
module.exports = class PermissionSet extends ModelBase {

    /**
     * @constructor
     * @summary Creates a new permission set instance
     */
    constructor () {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
    }
    
    /**
     * 
     * @param {*} dbPermission The database permission from which to construct this instance
     */
    fromData(dbPermission) {
        this.id = dbPermission.id;
        this.name = dbPermission.name;
        this.description = dbPermission.description;
        this.creationTime = dbPermission.creation_time;
        this.createdBy = dbPermission.created_by;
        this.updatedTime = dbPermission.updated_time;
        this.updatedBy = dbPermission.updated_by;
        this.deactivationTime = dbPermission.deactivation_time;
        this.deactivatedBy = dbPermission.deactivated_by;
        return this;
    }

    /**
     * @method
     * @summary Copy this instance's property values from another instance
     * @param {PermissionSet} other The other permission set instance to copy from
     * @returns {PermissionSet} This instance of the permission set with the copied values
     */
    copy(other) {
        this.fromData({});
        for(var p in this)
            if(!p.startsWith("_") && !(this[p] instanceof Function))
              this[p] = other[p] || this[p];
        return this;
    }
    /**
     * @method
     * @summary Creates an instance of the application in data layer structure
     */
    toData() {
        return {
            id : this.id,
            name : this.name,
            description: this.description
            // All time and "by" fields are stripped as they are readonly
        }
    }

}
