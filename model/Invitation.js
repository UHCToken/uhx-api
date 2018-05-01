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
 * @class
 * @summary Represents a single invitation from a user to join UHX
 * @swagger
 * definitions:
 *  Invitation:
 *      properties:
 */
module.exports = class Invitation extends ModelBase {

    /**
     * @constructor
     * @summary Instantiates the invitation
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
    }

    /**
     * @method
     * @summary Loads the referrer
     * @return {User} The user which referred or created this invite
     */
    async loadCreatedBy() {
        if(!this._createdBy)
            this._createdBy = uhc.Repositories.userRepository.get(this.createdById);
        return this._createdBy;
    }

    /**
     * @method
     * @summary Converts invitation information from the database format to the invite model
     * @param {*} dbInvite The invite object from the database to copy from
     */
    fromData(dbInvite) {
        this.id = dbInvite.id;
        this.email = dbInvite.email;
        this.givenName = dbInvite.given_name;
        this.familyName = dbInvite.family_name;
        this.tel = dbInvite.tel;
        this.address = {
            street: dbInvite.street,
            unitOrSuite: dbInvite.unit_suite,
            city: dbInvite.city,
            stateOrProvince: dbInvite.state_prov,
            country: dbInvite.country,
            postalOrZip: dbInvite.postal_zip
        },
        this.creationTime = dbInvite.creation_time;
        this.createdById = dbInvite.created_by;
        this.expirationTime = dbInvite.expiration_time;
        this.claimTime = dbInvite.claim_time;
        this.userId = dbInvite.signup_user_id;
        this.deactivatedTime = dbInvite.deactivation_time;
        return this;
    }

     /** 
     * @method
     * @summary Copy all the values from otherInvitation into this invitation
     * @returns {Invitation} This invitation with copied fields
     * @param {Invitation} otherInvitation The invitation from which the values for this user should be copied
     */
    copy(otherInvitation) {

        this.fromData({});
        for(var p in this)
            if(!p.startsWith("_"))
                this[p] = otherInvitation[p] || this[p];
        return this;
    }

    /**
     * @method
     * @summary Convert this model object into a database object
     */
    toData() {
        var retVal = {
            id : this.id,
            email: this.email,
            given_name: this.givenName,
            family_name: this.familyName,
            tel: this.tel
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
     * @summary Represent this as JSON object
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.createdBy = this._createdBy;
        return retVal;
    }
}
