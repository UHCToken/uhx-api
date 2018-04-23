/// <Reference path="../repository/userRepository.js" />
/// <Reference path="../repository/applicationRepository.js" />
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

    for(var k in instance) 
        if(!k.startsWith("_"))
            retVal[k] = instance[k];

    return retVal;
 }

 /**
  * @class
  * @summary Provides helper methods for dealing with model classes
  */
 class ModelUtil {

    /**
     * @method
     * @summary Generate update SET statement
     * @param {*} modelObject Represents the model object to generate update text for
     * @param {string} tableName The index of parameters 
     * @param {string} timestampColumn The name of the update timestamp column to insert
     * @returns {Object} The SET portion of a SQL update and an array of parameters
     */
    generateUpdate(modelObject, tableName, timestampColumn) {
        var dbModel = modelObject.toData ? modelObject.toData() : modelObject;

        var updateSet = "", parmId = 1, parameters = [], whereClause = "";
        for(var k in dbModel) 
            {

                if(k == "id")
                    whereClause += `${k} = $${parmId++}`;
                else if(k.startsWith("$"))
                    updateSet += `${k.substring(1)} = crypt($${parmId++}, gen_salt('bf')), `;
                else
                    updateSet += `${k} = $${parmId++}, `;
                parameters.push(dbModel[k]);
            }

        // Append timestamp?
        if(timestampColumn)
            updateSet += ` ${timestampColumn} = CURRENT_TIMESTAMP`;    
        else
            updateSet = updateSet.substr(0, updateSet.length - 2);
            
        return {
            sql: `UPDATE ${tableName} SET ${updateSet} WHERE ${whereClause} RETURNING *`,
            args : parameters
        };
    }

    /**
     * @method
     * @summary Generate a select statement
     * @param {*} filter The query filter to be created
     * @param {string} tableName The name of the database table to query
     * @param {number} offset The starting record number
     * @param {number} count The number of records to return
     */
    generateSelect(filter, tableName, offset, count) {
        var dbModel = filter.toData ? filter.toData() : filter;

        var parmId = 1, parameters = [], whereClause = "";
        for(var k in dbModel) 
            if(dbModel[k]) {
                
                whereClause += `${k} = $${parmId++}`;
                parameters.push(dbModel[k]);
            }
            
        var control = "";
        if(offset)
            control += `OFFSET ${offset} `;
        if(count)
            control += `LIMIT ${count} `;

        return {
            sql: `SELECT * FROM ${tableName} WHERE ${whereClause} ${control}`,
            args : parameters
        };
    }

    /**
     * @method
     * @summary Generate the column names and values portions of an insert statement
     * @param {*} modelObject Represents the model object to generate the insert text for
     * @param {string} tableName The name of the table to insert into
     * @returns {Object} The column and values tuple for the insert statement
     */
    generateInsert(modelObject, tableName) {

        var dbModel = modelObject.toData ? modelObject.toData() : modelObject;
        var parmId = 1, colNames = "", values = "", parameters = [];
        for(var k in dbModel) {
            var val = dbModel[k];
            if(val) {

                if(k.startsWith("$")) {
                    colNames += `${k.substring(1)},`;
                    values += `crypt($${parmId++}, gen_salt('bf')),`;
                }
                else {
                    colNames += `${k},`;
                    values += `$${parmId++},`;
                }
                parameters.push(val);
            }
        }

        return {
            sql: `INSERT INTO ${tableName} (${colNames.substring(0, colNames.length - 1)}) VALUES (${values.substring(0, values.length - 1)}) RETURNING *`,
            args: parameters
        };
    }
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
    constructor(copyData) {
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
    }

    /**
     * @method
     * @summary Copy all the values from otherUser into this user
     * @returns {User} This user with copied fields
     * @param {User} otherUser The user from which the values for this user should be copied
     */
    copy(otherUser) {
        this.fromData({});
        for(var p in this)
            if(!p.startsWith("_"))
                this[p] = otherUser[p] || this[p];
        return this;
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
    constructor(user, application, scope, sessionLength) {

        if(!user && !application) return;

        this.userId = user.id;
        this.applicationId = application.id;
        this.notAfter = new Date(new Date().getTime() + sessionLength);
        this.notBefore = new Date();
        this._refreshToken = crypto.randomBytes(32).toString('hex');
        this._user = user;
        this.audience = scope;
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
        this._refreshToken = dbSession.refresh_token;
        return this;
    }

    /**
     * @method
     * @summary Convert this session to data stream
     */
    toData() {
        return {
            id : this.id,
            user_id: this.userId,
            application_id: this.applicationId,
            scope: this.audience,
            not_before: this.notBefore,
            not_after: this.notAfter,
            refresh_token: this._refreshToken
        };
    }

    /**
     * @property
     * @summary Get the refresh token
     */
    get refreshToken() {
        return this._refreshToken;
    }

    /**
     * @summary Get user proeprty 
     * @remarks If this property returns null you can populate it by calling await getUser()
     */
    get user() {
        return this._user;
    }
    
    /**
     * @summary Get user proeprty 
     * @remarks If this property returns null you can populate it by calling await getUser()
     */
    get application() {
        return this._application;
    }
    
    /**
     * @summary Get user proeprty 
     * @remarks If this property returns null you can populate it by calling await getUser()
     */
    get grant() {
        return this._grants;
    }

    /**
     * @method
     * @summary Gets the user that this session belongs to
     * @type {User}
     */
    async loadUser() {
        if(!this._user)
            this._user = await uhc.Repositories.userRepository.get(id);
        return this._user;
    }

    /**
     * @method
     * @summary Get the application this session was granted to
     * @type {Application}
     */
    async loadApplication() {
        if(!this._application)
            this._application = await uhc.Repositories.applicationRepository.get(this.applicationId);
        return this._application;
    }

    /**
     * @method
     * @summary Gets (or computes) the grants on this session
     * @type {*}
     */
    async loadGrants() {

        if(!this._grants) {
            this._grants = {};

            // Fetch from the user and application objects
            var usrPerms = await uhc.Repositories.permissionRepository.getUserPermission(this.userId);
            for(var p in usrPerms)
                this._grants[usrPerms[p].name] = usrPerms[p].grant;
            
            var appPerms = await uhc.Repositories.permissionRepository.getApplicationPermission(this.applicationId);
            for(var p in appPerms) {
                var gp = this._grants[appPerms[p].name];
                if(gp)
                    this._grants[appPerms[p].name] &= appPerms[p].grant;
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
module.exports.Utils = new ModelUtil();
