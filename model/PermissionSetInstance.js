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


const PermissionSet = require('./PermissionSet'),
    uhc = require('../uhc');

/**
 * @class
 * @summary Represents an instace of the permission set against a group or application
 */
module.exports = class PermissionSetInstance extends PermissionSet {

    /**
     * @constructor
     * @param {string} objectId The object (group or application) the set is applied to
     * @param {string} objectType The type of object the set is applied to
     */
    constructor(objectType, objectId) {
        super()
        this._objectType = objectType;
        this._objectId = objectId;
    }

    /**
     * @property
     * @summary Gets the object for this permission instance
     */
    get object() {
        if(!this._object)
            switch(this._objectType) {
                case "Application":
                    this._object = uhc.Repositories.applicationRepository.get(this._objectId);
                    break;
                case "Group":
                    //this._object = uhc.Repositories.groupRepository.get(this._objectId);
                    break;
                case "User":
                    this._object = uhc.Repositories.userRepository.get(this._objectId);
                    break;
            }
        return this._object;
    }

     /**
     * @summary Parses this instance from data
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
        this.deactivatedBy = dbPermission.deactived_by;
        this.grant = dbPermission.acl_flags
        return this;
    }

}
