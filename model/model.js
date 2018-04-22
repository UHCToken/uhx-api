/// <Reference path="../repository/userRepository.js" />
/// <Reference path="../repository/applicationRepository.js" />
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
 * This file contains model instances for the underlying data objects
 * 
 */

 const uhc = require('../uhc'),
    crypto = require('crypto');

 /**
  * @private
  * @method
  * @summary Strips hidden fields for JSON from instance
  * @param {*} instance The instance to strip the fields from
  * @returns {*} An instance with all private fields stripped
  */
 var stripHiddenFields = function(instance) {
    var retVal = {
        $type : instance.constructor.name
    };

    for(var k in Object.keys(instance)) 
        if(!k.startsWith("_"))
            retVal[k] = instance[k];

    return retVal;
 }

 /**
  * @class User
  * @summary Represents a user instance
  * @property {string} id The identifier for the user
  * @property {string} name The username for the user
  * @property {number} invalidLogins The number of times that the user has logged incorrectly
  * @property {Date} lastLogin The last time the user successfully logged in
  * @property {Date} lockout The time that the user account is locked out until
  * @property {string} email The e-mail address of the user
  * @property {boolean} emailVerified True if the email address for the user is verified
  * @property {string} givenName The given name of the user
  * @property {string} familyName The family name of the user
  * @property {string} profileText The textual information of the user's profile
  * @property {string} tel The user's telephone 
  * @property {boolean} telVerified True if the user's telephone has been verified
  * @property {Object} address The user's address information
  * @property {string} address.street The user's street address
  * @property {string} address.unitOrSuite The unit or suit information for the user
  * @property {string} address.city The city for the user
  * @property {string} address.stateOrProvince The state or province for the user
  * @property {string} address.country The country of residence
  * @property {string} address.postalOrZip The postal/zip code for the user
  * @property {Date} creationTime The time that the user was created
  * @property {Date} updatedTime The time that the user was updated
  * @property {Date} deactivatedTime The time that the user was deactivated
  */
class User {

    /**
     * @constructor
     * @summary Constructs a new user instance based on the database
     */
    constructor() {
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
    }

    /**
     * Create object from database user
     * @param {*} dbUser The user instance from the database
     */
    fromData(dbUser) {
        this.id = dbUser.id;
        this.name = dbUser.name;
        this.invalidLogins = dbUser.invalid_login;
        this.lastLogin = dbUser.last_login;
        this.lockout = dbUser.lockout;
        this.email = dbUser.email;
        this.emailVerified = dbUser.email_verified;
        this.givenName = dbUser.given_name;
        this.familyName = dbUser.family_name;
        this.profileText = dbUser.description;
        this.tel = dbUser.tel;
        this.telVerified = dbUser.tel_verified;
        this.address = {
            street: dbUser.street,
            unitOrSuite: dbUser.unit_suite,
            city: dbUser.city,
            stateOrProvince: dbUser.state_prov,
            country: dbUser.country,
            postalOrZip: dbUser.postal_zip
        },
        this.creationTime = dbUser.creation_time;
        this.updatedTime = dbUser.updated_time;
        this.deactivationTime = dbUser.deactivation_time;
        return this;
    }

    /**
     * @method
     * @summary Converts this instance of the User class to a data layer compatible one
     */
    toData() {
        var retVal = {
            id : this.id,
            name : this.name,
            invalid_login: this.invalidLogins,
            last_login: this.lastLogin,
            lockout: this.lockout,
            email: this.email,
            email_verified: this.emailVerified,
            given_name: this.givenName,
            family_name: this.familyName,
            description: this.profileText,
            tel: this.tel,
            tel_verified: this.telVerified,
            // creation timestamp properites are skipped beecause they are set by repo
        };

        if(this.address) {
            retVal.street = this.address.street;
            retVal.unit_suite = this.address.unitOrSuite;
            retVal.city = this.address.city;
            retVal.state_prov = this.address.stateOrProvince;
            retVal.country = this.address.country;
            retVal.postal_zip = this.address.postalOrZip;
        }

        return retVal;
    }

    /**
     * @summary Gets the user groups for this user
     * @property
     */
    get groups() {
        if(this._groups)
            return this._groups;
        else {
            // load groups here
        }
    }

    /**
     * @method
     * @summary Serialize this instance to a JSON object
     */
    toJSON() {
        return stripHiddenFields(this);
    }

}

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
class Application {
    /**
     * @constructor
     * @summary Creates a new application instance
     */
    constructor () {
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
        this.deactivatedBy = dbApplication.deactived_by;
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
     * @method
     * @summary Serialize this instance to JSON object
     */
    toJSON() {
        return stripHiddenFields(this);
    }
}

/**
 * @class Session
 * @summary Represents a single session which is a user on a client device
 */
class Session {

    /**
     * @constructor
     * @summary Creates a new session between the user and application
     * @param {User} user The user to construct the session from
     * @param {Application} application The application to construct the session from
     * @param {number} expiry The expiration time
     */
    constructor(user, application, sessionLength) {
        this.userId = user.id;
        this.applicationId = application.id;
        this.notAfter = new Date(new Date().getTime() + expiry);
        this.notBefore = new Date();
        this._refreshToken = crypto.randomBytes(32).toString('hex');
        this._user = user;
        this._application = application;
    }

    /**
     * @method
     * @summary Constructs a new session instance from the specified dbsession information
     * @param {*} dbSession The session information from the database
     */
    fromData(dbSession) {
        this.id = dbSession.id;
        this.userId = dbSession.user_id;
        this.applicationId = dbSession.application_id;
        this.audience = dbSession.scope;
        this.notBefore = dbSession.not_before;
        this.notAfter = dbSession.not_after;
        this._refreshToken = dbSession._refreshToken;
        return this;
    }

    /**
     * @property
     * @summary Gets the user that this session belongs to
     * @type {User}
     */
    async getUser() {
        if(!this._user)
            this._user = uhc.Repositories.userRepository.get(id);
        return this._user;
    }

    /**
     * @property
     * @summary Get the application this session was granted to
     * @type {Application}
     */
    async getApplication() {
        if(!this._application)
            this._application = await uhc.Repositories.applicationRepository.get(this.applicationId);
        return this._application;
    }

    /**
     * @property
     * @summary Gets (or computes) the grants on this session
     * @type {*}
     */
    async getGrant() {

        if(!this._grants) {
            this._grants = {};

            // Fetch from the user and application objects
            var appPerms = await uhc.Repositories.permissionRepository.getApplicationPermission(this.applicationId);
            for(var p in appPerms)
                this._grants[appPerms[p].name] = appPerms[p].grant;
            
            var usrPerms = await uhc.Repositories.permissionRepository.getUserPermission(this.userId);
            for(var p in usrPerms) {
                var gp = this._grants[usrPerms[p].name];
                if(gp)
                    gp.grant &= usrPerms[p].grant;
            }
        }
        return this._grants;

    }
}

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
 */
class PermissionSet {

    /**
     * @constructor
     * @summary Creates a new permission set instance
     */
    constructor () {
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
        this.deactivatedBy = dbPermission.deactived_by;
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

    /**
     * @summary Represet this object as JSON
     */
    toJSON() {
        stripHiddenFields(this);
    }
}

/**
 * @class
 * @summary Represents an instace of the permission set against a group or application
 */
class PermissionSetInstance extends PermissionSet {

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

// Module exports
module.exports.User = User;
module.exports.Application = Application;
module.exports.Session = Session;
module.exports.PermissionSet = PermissionSet;
module.exports.PermissionSetInstance = PermissionSetInstance;