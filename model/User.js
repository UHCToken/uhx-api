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
    ModelBase = require('./ModelBase');
 
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
  * @swagger
  * definitions:
  *     User: 
  *         properties:
  *             id: 
  *                 type: string
  *                 description: The unique identifier for the user
  *             name:
  *                 type: string
  *                 description: The user name for the user
  *             invalidLogins:
  *                 type: int
  *                 description: The number of times that the user has invalid logins
  *             lastLogin:
  *                 type: Date
  *                 description: The last moment in time that the user successfully logged in
  *             lockout:
  *                 type: Date
  *                 description: When populated, indicates that time that the user's account is locked out until
  *             email: 
  *                 type: string
  *                 description: Identifies the e-mail address of the user
  *             emailVerified:
  *                 type: boolean
  *                 description: Identifies whether the user has confirmed their e-mail address
  *             givenName:
  *                 type: string
  *                 description: The user's given name
  *             familyName:
  *                 type: string
  *                 description: The user's family name
  *             profileText:
  *                 type: string
  *                 description: Descriptive text which the user has set (their profile)
  *             tel:
  *                 type: string
  *                 description: The user's primary telephone number
  *             telVerified:
  *                 type: boolean
  *                 description: True if the user has verified their telephone number
  *             address:
  *                 description: The user's primary addrss
  *                 $ref: "#/definitions/Address"
  *             creationTime:
  *                 type: Date
  *                 description: The time that this user account was created
  *             updatedTime:
  *                 type: Date
  *                 description: The time that the user account was last updated
  *             deactivatedTime:
  *                 type: Date
  *                 description: The time that the user account did or will become deactivated
  *     Address:
  *         properties:
  *             street:
  *                 type: string
  *                 description: The primary street address (Example; 123 Main Street West)
  *             unitOrSuite:
  *                 type: string
  *                 description: The unit or suite number (Example; Apt 100)
  *             city:
  *                 type: string        
  *                 description: The city for the address (Example; Las Vegas)
  *             stateOrProvince:
  *                 type: string
  *                 description: The state or province of the address in a 2 digit ISO code (Example; NV)
  *             country:
  *                 type: string
  *                 description: The two digit country code for the address (Example; US)
  *             postalOrZip:
  *                 type: string
  *                 description: The postal or zip code for the address
  *     
  */
 module.exports = class User extends ModelBase {

    /**
     * @constructor
     * @summary Constructs a new user instance based on the database
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);

        this._externIds = [];
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
        this.walletId = dbUser.wallet_id;
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
     * @property
     * @summary Get the external identities
     */
    get externalIds() {
        return this._externIds;
    }

    /**
     * @method
     * @summary Prefetch external identifiers if they aren't already
     */
    async loadExternalIds() {
        if(!this._externIds)
            this._externIds = await uhc.Repositories.userRepository.getExternalIdentities(this);
        return this._externIds;
    }

    /**
     * @method
     * @summary Prefetch user's wallet information
     */
    async loadWallet() {
//      if(!this._wallet)
//            this._wallet = await uhc.Repositories.walletRepository.get(this.walletId);
        return this._wallet;
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
        var retVal = this.stripHiddenFields();
        retVal.externalIds = this._externIds;
        retVal.wallet = this._wallet;
        return retVal;
    }

}
