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
* @class
* @summary Represents a single invitation from a user to join UHX
* @swagger
* definitions:
*  Invitation:
*      properties:
*             id: 
*                 type: string
*                 description: The unique identifier for the invitation
*             email: 
*                 type: string
*                 description: Identifies the e-mail address the invite was sent to
*             givenName:
*                 type: string
*                 description: The invitee's given name
*             familyName:
*                 type: string
*                 description: The invitee's family name
*             tel:
*                 type: string
*                 description: The invitee's primary telephone number
*             address:
*                 description: The invitee's primary addrss
*                 $ref: "#/definitions/Address"
*             creationTime:
*                 type: Date
*                 description: The time that this invite account was created
*             expirationTime:
*                 type: Date
*                 description: The time that the invitation will expire
*             claimTime:
*                 type: Date
*                 description: The time that the invitation was claimed
*             deactivationTime:
*                 type: Date
*                 description: The time that the invitation was rescinded
*             createdById:
*                 type: string
*                 description: The identifier of the user that created the invitation
*             createdBy:
*                 $ref: "#/definitions/User"
*                 description: The user that created the invitation
*             userId:
*                 type: string
*                 description: The id of the user that was created when this invitation was claimed
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
            this._createdBy = uhx.Repositories.userRepository.get(this.createdById);
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
