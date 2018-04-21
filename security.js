'use strict';

/**
 * Universal Health Coin API Service
 * Copyright (C) 2018, Universal Health Coin
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Original Authors: Justin Fyfe (justin-fyfe), Rory Yendt (RoryYendt)
 * Original Date: 2018-04-18
 * 
 * This file contains security helper classes
 * 
 */

 module.exports.Config = require('./config');
 const uhc = require('./uhc');

 
 /**
  * @enum UHC Permissions
  * @description Permissions
  */
 const PermissionType = {
    EXECUTE : 1,
    READ : 2,
    WRITE : 4,
    RWX : 7,
    LIST: 8,
    OWNER : 16 // When this flag is present, the permission only applies to the owner For example READ | OWNER means that the user can READ only if they are also the OWNER of that resource
}

 /**
  * @class
  * @summary Represents a security exception
  */
 class SecurityException extends uhc.Exception {

    /**
     * @constructor
     * @param {Permission} failedPermission Represents the permission group [0] and permission demanded that failed
     */
    constructor(failedPermission) {
        super(`Security violation: ${failedPermission.permission} ${failedPermission.object}`, uhc.ErrorCodes.SECURITY_ERROR);
        this._permission = failedPermission;
        this.toJSON = this.toJSON.bind(this);
    }

    /**
     * @property
     * @summary Get the object (wallet, user, etc.) for the permission
     */
    get object() {
        return this._permission.object;
    }

    /**
     * @property
     * @summary Get the permission (read, write, etc.) that failed
     */
    get permission() {
        return this._permission.permission;
    }

    /**
     * @method
     * @summary Represent object as JSON
     */
    toJSON() {
        return {
            message:this._message,
            code:this._code,
            object: this.object,
            permission: this.permission,
            cause:this._cause
        };
    }
 }

 /**
  * @class 
  * @property Represents a specific permission that can be demanded
  */
 class Permission {

    /**
     * @constructor
     * @param {string} object The name of the object that is being demanded
     * @param {PermissionType} permissionType The type of permission being demanded
     */
    constructor(object, permissionType) {
        this._object = object;
        this._permissionType = permissionType;
        this.demand = this.demand.bind(this);
    }

        /**
     * @property
     * @summary Gets the object that the particular security demand was attempting to access
     * @type {string}
     */
    get object() {
        return this._object;
    }

    /**
     * @property
     * @summary Gets the permission that was demanded
     * @type {string} The permission demanded
     */
    get permission() {
        var permission = "";
        if(this._permissionType & PermissionType.READ) 
            permission += "r";
        if(this._permissionType & PermissionType.WRITE)
            permission += "w";
        if(this._permissionType & PermissionType.EXECUTE)
            permission += "x";
        if(this._permissionType & PermissionType.LIST)
            permission += "l";
        
        return permission;
    }

    /**
     * @method
     * @summary Demands the permission
     * @param {*} claimPrincipal The current principal for demanding permission. This should be a claims based principal instance like JWT token
     */
    demand(claimPrincipal) {
        
        var grantedAccess = claimPrincipal.grant[this._object];

        if(!(grantedAccess & this._permissionType))
            throw new SecurityException(this);

        return true;
    }

 }

 // Module exports
 module.exports.SecurityException = SecurityException;
 module.exports.PermissionType = PermissionType;
 module.exports.Permission = Permission;