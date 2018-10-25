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
  * @class Patient
  * @summary Represents a patient instance
  * @property {string} id The identifier for the patient
  * @property {string} userId The user id of the patient
  * @property {string} givenName The given name of the patient
  * @property {string} familyName The family name of the patient
  * @property {string} tel The patient's telephone 
  * @property {string} telExt The patient's telephone extension
  * @property {string} fax The patient's fax number
  * @property {string} email The patient's contact email
  * @property {string} profileImage The patient's profile image
  * @property {string} gender The patient's gender
  * @property {string} dob The patient's dtae of birth
  * @property {string} history The patient's history
  * @property {string} sensitivities The patient's sensitivities
  * @property {Object} address The patient's address information
  * @property {string} address.street The patient's street address
  * @property {string} address.unitOrSuite The unit or suit information for the patient
  * @property {string} address.city The city for the patient
  * @property {string} address.stateOrProvince The state or province for the patient
  * @property {string} address.country The country of residence
  * @property {string} address.postalOrZip The postal/zip code for the patient
  * @property {Date} creationTime The time that the patient was created
  * @property {Date} updatedTime The time that the patient was updated
  * @property {Date} deactivatedTime The time that the patient was deactivated
  * @swagger
  * definitions:
  *     Patient: 
  *         properties:
  *             id: 
  *                 type: string
  *                 description: The unique identifier for the patient
  *             userId:
  *                 type: string
  *                 description: The user id of the patient
  *             givenName:
  *                 type: string
  *                 description: The patients's given name
  *             familyName:
  *                 type: string
  *                 description: The patients's family name
  *             tel:
  *                 type: string
  *                 description: The patients's contact telephone number
  *             telExt:
  *                 type: string
  *                 description: The patients's contact telephone number extension
  *             fax:
  *                 type: string
  *                 description: The patients's fax number
  *             email: 
  *                 type: string
  *                 description: Identifies the e-mail address of the patient
  *             profileImage:
  *                 description: The filename for the profile image for the patient
  *                 type: string
  *             gender:
  *                 description: The patient's gender
  *                 type: string
  *             dob:
  *                 description: The patient's date of birth
  *                 type: date
  *             history:
  *                 description: A description field for medical history/conditions/etc.
  *                 type: string
  *             sensitivities:
  *                 description: A description field for allergies or other sentivities.
  *                 type: string
  *             address:
  *                 description: The patients's address
  *                 $ref: "#/definitions/Address"
  *             creationTime:
  *                 type: Date
  *                 description: The time that this patient account was created
  *             updatedTime:
  *                 type: Date
  *                 description: The time that the patient account was last updated
  *             deactivatedTime:
  *                 type: Date
  *                 description: The time that the patient account did or will become deactivated
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
  *                 description: The state or province of the address
  *             country:
  *                 type: string
  *                 description: The two digit country code for the address (Example; US)
  *             postalOrZip:
  *                 type: string
  *                 description: The postal or zip code for the address
  *     
  */
 module.exports = class Patient extends ModelBase {

    /**
     * @constructor
     * @summary Constructs a new patient instance based on the database
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
        this._externIds = [];
    }

    /**
     * Create object from database patient
     * @param {*} dbPatient The patient instance from the database
     */
    fromData(dbPatient) {
        this.id = dbPatient.id;
        this.userId = dbPatient.user_id;
        this.givenName = dbPatient.given_name;
        this.familyName = dbPatient.family_name;
        this.tel = dbPatient.tel;
        this.telExt = dbPatient.tel_ext;
        this.fax = dbPatient.fax;
        this.email = dbPatient.email;
        this.profileImage = dbPatient.profile_image;
        this.gender = dbPatient.gender;
        this.dob = dbPatient.dob;
        this.history = dbPatient.history;
        this.sensitivities = dbPatient.sensitivities;
        this.address = {
            street: dbPatient.street,
            unitSuite: dbPatient.unit_suite,
            city: dbPatient.city,
            stateProv: dbPatient.state_prov,
            country: dbPatient.country,
            postalZip: dbPatient.postal_zip
        },
        this.creationTime = dbPatient.creation_time;
        this.updatedTime = dbPatient.updated_time;
        this.deactivationTime = dbPatient.deactivation_time;
        return this;
    }

    /**
     * @method
     * @summary Converts this instance of the Patient class to a data layer compatible one
     */
    toData() {
        var retVal = {
            id : this.id,
            user_id : this.userId,
            given_name: this.givenName,
            family_name: this.familyName,
            tel: this.tel,
            tel_ext: this.telExt,
            fax: this.fax,
            email: this.email,
            profile_image: this.profileImage,
            gender: this.gender,
            dob: this.dob,
            history: this.history,
            sensitivities: this.sensitivities
        };

        if(this.address) {
            retVal.street = this.address.street;
            retVal.unit_suite = this.address.unitSuite;
            retVal.city = this.address.city;
            retVal.state_prov = this.address.stateProv;
            retVal.country = this.address.country;
            retVal.postal_zip = this.address.postalZip;
        }

        return retVal;
    }

    /**
     * @method
     * @summary Serialize this instance to a JSON object
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        return retVal;
    }

    /**
     * @method 
     * @summary Returns a summary object
     */
    summary() {
        return new Patient().copy({
            id: this.id,
            email: this.email,
            userId: this.user_id
        });
    }
}
