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
  *             wallet: 
  *                 $ref: "#/definitions/Wallet"
  *                 description: The wallet information for the user
  *             groups:
  *                 $ref: "#/definitions/Group"
  *                 description: "The groups to which the user belongs"
  *             externalIds:
  *                 description: Systems for which the user has an external login registered
  *                 type: string
  *             tfaMethod:
  *                 description: The Two-factor authentication method set on the account
  *                 type: number
  *                 enum: 
  *                 - 1: SMS
  *                 - 2: E-MAIL
  *             profileImage:
  *                 description: The filename for the profile image for the user
  *                 type: string
  *             claims:
  *                 description: Additional claims that systems have made about the user
  *                 schema:
  *                     properties:
  *                         key:
  *                             description: The name of the claim
  *                             type: string
  *                         value:
  *                             description: The value of the claim
  *                             type: string
  * 
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
  *             poBox:
  *                 type: string
  *                 description: The post office box for the address
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
        this.loadGroups = this.loadGroups.bind(this);
        this.loadClaims = this.loadClaims.bind(this);
        this._externIds = [];
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
        this.tfaMethod = dbUser.tfa_method;
        this.address = {
            street: dbUser.street,
            unitOrSuite: dbUser.unit_suite,
            city: dbUser.city,
            stateOrProvince: dbUser.state_prov,
            country: dbUser.country,
            postalOrZip: dbUser.postal_zip,
            poBox: dbUser.po_box
        },
        this.creationTime = dbUser.creation_time;
        this.updatedTime = dbUser.updated_time;
        this.deactivationTime = dbUser.deactivation_time;
        this.profileImage = dbUser.profile_image;
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
            tfa_method: this.tfaMethod,
            profile_image: this.profileImage
            // creation timestamp properites are skipped beecause they are set by repo
        };

        if(this.address) {
            retVal.street = this.address.street;
            retVal.unit_suite = this.address.unitOrSuite;
            retVal.city = this.address.city;
            retVal.state_prov = this.address.stateOrProvince;
            retVal.country = this.address.country;
            retVal.postal_zip = this.address.postalOrZip;
            retVal.po_box = this.address.poBox;
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
    async loadExternalIds(_txc) {
        if(!this._externIds)
            this._externIds = await uhx.Repositories.userRepository.getExternalIds(this, _txc);
        return this._externIds;
    }

    /**
     * @method
     * @summary Prefetch user's stellar wallet information
     */
    async loadStellarWallet(_txc) {
      if(!this._wallet)  {
            if(this._wallets)
                this._wallet = this._wallets.find(o=>o.networkId == 1);
            else 
                this._wallet = await uhx.Repositories.walletRepository.getByUserId(this.id, _txc);
            if(this._wallet)
                this._wallet._user = this;
      }
      return this._wallet;
    }

    /**
     * @method
     * @summary Prefetch all user's wallet information
     */
    async loadWallets(_txc) {
        if(!this._wallet)  {
                this._wallets = await uhx.Repositories.walletRepository.getAllForUserId(this.id, _txc);
                this._wallets.forEach(w=>w._user = this);
        }
        return this._wallets;
    }

    /**
     * @method
     * @summary Load the groups and return them if needed
     * @returns {Group} The loaded groups to which the user belongs
     */
    async loadGroups(_txc) {
        if(!this._groups)
            this._groups = await uhx.Repositories.groupRepository.getByUserId(this.id, _txc);
        return this._groups;
    }

    /**
     * @method
     * @summary Load the tfa method of the user
     */
    async loadTfaMethod(_txc) {
        if(!this.tfaMethod)
            return null;
        return await uhx.Repositories.userRepository.getTfaMethod(this.tfaMethod, _txc);
    }
    
    /**
     * @summary Gets the user groups for this user
     * @property
     */
    get groups() {
        return this._groups;
    }

    /**
     * @summary Get the claims for the user
     * @return {*} The claims for the user
     */
    async loadClaims(_txc) {
        if(!this._claims)
            this._claims = await uhx.Repositories.userRepository.getClaims(this.id, _txc);
        return this._claims;
    }

    /**
     * @property
     * @summary Get the claims for the user
     * @type {*}
     */
    get claims() {
        return this._claims;
    }

    /**
     * @method
     * @summary Serialize this instance to a JSON object
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.externalIds = this._externIds;
        retVal.wallets = this._wallets;
        retVal.claims = {};
        for(var k in this._claims){
            if(!k.startsWith("$"))
                retVal.claims[k] = this._claims[k];
            if(k != "$tfa.secret")
                retVal.claims.activeClaims = true;
        }
        retVal.groups = this._groups;
        return retVal;
    }

    /**
     * @method 
     * @summary Returns a summary object
     */
    summary() {
        return new User().copy({
            id: this.id,
            givenName: this.givenName,
            familyName: this.familyName,
            email: this.email,
            name: this.name
        });
    }
}
