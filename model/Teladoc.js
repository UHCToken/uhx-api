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
    moment = require('moment');

/**
 * @class Teladoc
 * @summary Represents the Teladoc object to be sent for subscribing users to services
 * @property {string} groupId The ID provided by Teladoc
 * @property {number} relationshiptoPrimary Default to 0 representing this report is for the Primary member
 * @property {string} memberId ID from Teladoc of the primary account holder
 * @property {string} primaryId Email address for the patient being reported 
 * @property {string} namePrefix Prefix for the patient's name
 * @property {string} firstName The first name of the patient
 * @property {string} middleName The middle name of the patient
 * @property {string} lastName The last name of the patient
 * @property {string} nameSuffix Suffix for the patient's name
 * @property {string} gender The gender of the patient
 * @property {string} language The preferred communication language for the patient
 * @property {Date} birthDate The patient's date of birth
 * @property {string} addressLine1 The address of the patient
 * @property {string} addressLine2 Any additional address information for the patient
 * @property {string} city The city the patient resides
 * @property {string} state The state the patient resides
 * @property {string} zipcode The zipcode of the patient residence
 * @property {string} homePhone The home phone number of the patient
 * @property {string} cellPhone The cell phone number of the patient
 * @property {string} workPhone The work phone number of the patient
 * @property {string} email The email address of the patient
 * @property {Date} startDate The date the subscription started
 * @property {Date} termDate The date the subscription ends
 * @property {string} healthPlanID The Health Plan ID of the memeber
 * @swagger
 * definitions:
 *  Teladoc:
 *      properties:
 *          groupId: 
 *              type: string
 *              description: The ID provided by Teladoc
 *          relationshiptoPrimary: 
 *              type: number
 *              description: Default to 0 representing this report is for the Primary member
 *          memberId: 
 *              type: string
 *              description: ID from Teladoc of the primary account holder
 *          primaryId: 
 *              type: string
 *              description: Email address for the patient being reported 
 *          namePrefix: 
 *              type: string
 *              description: Prefix for the patient's name
 *          firstName: 
 *              type: string
 *              description: The first name of the patient
 *          middleName: 
 *              type: string
 *              description: The middle name of the patient
 *          lastName: 
 *              type: string
 *              description: The last name of the patient
 *          nameSuffix: 
 *              type: string
 *              description: Suffix for the patient's name
 *          gender: 
 *              type: string
 *              description: The gender of the patient
 *          language: 
 *              type: string
 *              description: The preferred communication language for the patient
 *          birthDate: 
 *              type: Date
 *              description: The patient's date of birth
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
 *          homePhone: 
 *              type: string
 *              description: The home phone number of the patient
 *          cellPhone: 
 *              type: string
 *              description: The cell phone number of the patient
 *          workPhone: 
 *              type: string
 *              description: The work phone number of the patient
 *          email: 
 *              type: string
 *              description: The email address of the patient
 *          startDate: 
 *              type: Date
 *              description: The date the subscription started
 *          termDate: 
 *              type: Date
 *              description: The date the subscription ends
 *          healthPlanId: 
 *              type: string
 *              description: The Health Plan ID of the memeber
 */
module.exports = class Teladoc extends ModelBase {

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
        let gender;
        switch(patient.gender.toLowerCase()) {
            case 'male':
                gender = 'M';
                break;
            case 'female':
                gender = 'F';
                break;
            case 'other':
                gender = 'O';
                break;
            default:
                gender = 'O';
                break;
        }

        this.groupId = config.teladoc.groupId;
        this.relationshipToPrimary = 0;
        this.memberId = '';
        this.primaryId = patient.email;
        this.namePrefix = '';
        this.firstName = patient.givenName;
        this.middleName = '';
        this.lastName = patient.familyName;
        this.nameSuffix = '';
        this.gender = gender;
        this.language = '';
        this.birthDate = moment(patient.dob).format('YYYY-MM-DD');
        this.addressLine1 = patient.address.street;
        this.addressLine2 = '';
        this.city = patient.address.city;
        this.state = patient.address.stateProv;
        this.zipcode = patient.address.postalZip;
        this.homePhone = patient.tel;
        this.cellPhone = '';
        this.workPhone = '';
        this.email = patient.email;
        this.startDate = moment(new Date(subscription.dateSubscribed)).format('YYYY-MM-DD');
        this.termDate = subscription.dateTerminated === null ? null : moment(new Date(subscription.dateTerminated)).format('YYYY-MM-DD');
        this.healthPlanId = '';

        return this;
    }

    /**
     * @method
     * @summary Converts this object into a data model
     */
    toData() {
        return {
            groupId : this.groupId,
            relationshipToPrimary : this.relationshipToPrimary,
            memberId : this.memberId,
            primaryId : this.primaryId,
            namePrefix : this.namePrefix,
            firstName : this.firstName,
            middleName : this.middleName,
            lastName : this.lastName,
            nameSuffix : this.nameSuffix,
            gender : this.gender,
            language : this.language,
            birthDate : this.birthDate,
            addressLine1 : this.addressLine1,
            addressLine2 : this.addressLine2,
            city : this.city,
            state : this.state,
            zipcode : this.zipcode,
            homePhone : this.homePhone,
            cellPhone : this.cellPhone,
            workPhone : this.workPhone,
            email : this.email,
            startDate: this.startDate,
            termDate : this.termDate,
            healthPlanId : this.healthPlanId
        };
    }
}
