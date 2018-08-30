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
    config = require ('../config'),
    uhx = require('../uhx');

/**
 * @class Karis
 * @summary Represents the Karis object to be sent for subscribing users to services
 * @property {string} memberNumber The subscription id used for change management
 * @property {string} memberFullName The full name of the patient
 * @property {string} memberFirstName The first name of the patient
 * @property {string} memberLastName The last name of the patient
 * @property {string} addressLine1 The address of the patient
 * @property {string} addressLine2 Any additional address information for the patient
 * @property {string} city The city the patient resides
 * @property {string} state The state the patient resides
 * @property {string} zipcode The zipcode of the patient residence
 * @property {string} phoneNumber The phone number of the patient
 * @property {string} faxNumber The fax number of the patient
 * @property {string} email The email address of the patient
 * @property {string} gender The gender of the patient
 * @property {Date} effectiveDate The date the subscription started
 * @property {Date} terminationDate The date the subscription ends
 * @property {string} dob The date of birth of the patient
 * @property {string} clientCode A code assigned by Karis that represents the organization
 * @property {string} groupCode A code assigned by Karis that represents a specific set of offerings
 * @property {string} planCode A code used to distinguish different plans offered to patients
 * @property {string} memberAffiliation The familiar name a customer may reference to equate to the relationship with Universal Health Coin
 * @swagger
 * definitions:
 *  Karis:
 *      properties:
 *          memberNumber: 
 *              type: string
 *              description: The subscription id referenced for when a subscription needs to be updated
 *          memberFullName: 
 *              type: string
 *              description: The full name of the patient
 *          memberFirstName: 
 *              type: string
 *              description: The first name of the patient
 *          memberLastName: 
 *              type: string
 *              description: The last name of the patient
 *          addressLine1: 
 *              type: string
 *              description: The address of the patient
 *          addressLine2: 
 *              type: string
 *              description: Any additional address information for the patient
 *          city: 
 *              type: string
 *              description: The city the patient resides
 *          state: 
 *              type: string
 *              description: The state the patient resides
 *          zipcode: 
 *              type: string
 *              description: The zipcode of the patient residence
 *          phoneNumber: 
 *              type: string
 *              description: The phone number of the patient
 *          faxNumber: 
 *              type: string
 *              description: The fax number of the patient
 *          email: 
 *              type: string
 *              description: The email address of the patient
 *          gender: 
 *              type: string
 *              description: The gender of the patient
 *          effectiveDate: 
 *              type: Date
 *              description: The date the subscription started
 *          terminationDate: 
 *              type: Date
 *              description: The date the subscription ends
 *          dob: 
 *              type: string
 *              description: The birth date of the patient
 *          clientCode: 
 *              type: string
 *              description: A code assigned by Karis that represents the organization
 *          groupCode: 
 *              type: string
 *              description: A code assigned by Karis that represents a specific set of offerings
 *          planCode: 
 *              type: string
 *              description: A code used to distinguish different plans offered to patients
 *          memberAffiliation: 
 *              type: string
 *              description: The familiar name a customer may reference to equate to the relationship with Universal Health Coin
 */
module.exports = class Karis extends ModelBase {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.toJSON = this.toJSON.bind(this);
    }

    /**
     * @method
     * @summary Converts this object into a data model
     */
    fromData(patient, subscription) {
        this.memberNumber = patient.email;
        this.memberFullName = patient.givenName + " " + patient.familyName;
        this.memberFirstName = patient.givenName;
        this.memberLastName = patient.familyName;
        this.addressLine1 = patient.address.street;
        this.city = patient.address.city;
        this.state = patient.address.stateProv;
        this.zipcode = patient.address.postalZip;
        this.phoneNumber = patient.tel;
        this.faxNumber = patient.fax;
        this.email = patient.email;
        this.gender = patient.gender;
        this.effectiveDate = subscription.dateSubscribed;
        this.terminationDate = subscription.dateTerminated;
        this.dob = patient.dob;
        this.clientCode = config.karis.clientCode;
        this.groupCode = config.karis.groupCode;
        this.planCode = config.karis.planCode;
        this.memberAffiliation = config.karis.memberAffiliation;

        return this;
    }

    /**
     * @method
     * @summary Converts this object into a data model
     */
    toData() {
        return {
            memberNumber : this.memberNumber,
            memberFullName : this.memberFullName,
            memberFirstName : this.memberFirstName,
            memberLastName : this.memberLastName,
            addressLine1 : this.addressLine1,
            addressLine2 : this.addressLine2,
            city : this.city,
            state : this.state,
            zipcode : this.zipcode,
            phoneNumber : this.phoneNumber,
            faxNumber : this.faxNumber,
            email : this.email,
            gender : this.gender,
            effectiveDate : this.effectiveDate,
            terminationDate : this.terminationDate,
            dob : this.dob,
            clientCode : this.clientCode,
            groupCode : this.groupCode,
            planCode : this.planCode,
            memberAffiliation : this.memberAffiliation
        };
    }

    /**
     * @method
     * @summary Represents this object as JSON
     */
    toJSON() {
        return {
            memberNumber : this.member_number,
            memberFullName : this.member_full_name,
            memberFirstName : this.member_first_name,
            memberLastName : this.member_last_name,
            addressLine1 : this.address_line_1,
            addressLine2 : this.address_line_2,
            city : this.city,
            state : this.state,
            zipcode : this.zipcode,
            phoneNumber : this.phone_number,
            faxNumber : this.fax_number,
            email : this.email,
            gender : this.gender,
            effectiveDate : this.effective_date,
            terminationDate : this.termination_date,
            dob : this.dob,
            clientCode : this.client_code,
            groupCode : this.group_code,
            planCode : this.plan_code,
            memberAffiliation : this.member_affiliation
        }
    }
}
