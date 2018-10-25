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

const pg = require('pg'),
    exception = require('../exception'),
    Patient = require('../model/Patient'),
    security = require('../security'),
    model = require('../model/model');

/**
 * @class PatientRepository
 * @summary Represents the patient repository logic
 */
module.exports = class PatientRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.checkIfExists = this.checkIfExists.bind(this);
        this.getAllPatients = this.getAllPatients.bind(this);
        this.update = this.update.bind(this);
        this.insert = this.insert.bind(this);
        this.delete = this.delete.bind(this);
        this.reactivate = this.reactivate.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific patient from the database
     * @param {string} id Gets the specified patient
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Patient} The retrieved patient
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM patients WHERE deactivation_time IS NULL AND (user_id = $1 OR id = $1)", [id]);
            if (rdr.rows.length == 0)
                return null;
            else
                return new Patient().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Checks if a user has a patient profile
     * @param {string} id Gets the specified patient
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The boolean of whether or not the profile exists
     */
    async checkIfExists(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT id FROM patients WHERE user_id = $1 OR id = $1", [id]);
            if (rdr.rows.length == 0)
                return false;
            else
                return true;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }


    /**
     * @method
     * @summary Retrieve all patients
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved patients
     */
    async getAllPatients(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM patients");
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = new Patient().fromData(rdr.rows[r]);
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Update the specified patient
     * @param {Patient} patient The instance of the patient that is to be updated
     * @param {Principal} runAs The principal that is updating this patient 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Patient} The updated patient data from the database
     */
    async update(patient, runAs, _txc) {
        if (!patient.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbPatient = patient.toData();

            var updateCmd = model.Utils.generateUpdate(dbPatient, 'patients', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update patient in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return patient.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }


    /**
     * @method
     * @summary Insert the specified patient
     * @param {Patient} patient The instance of the patient that is to be inserted
     * @param {Principal} runAs The principal that is inserting this patient
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Patient} The inserted patient
     */
    async insert(patient, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbPatient = patient.toData();
            delete (dbPatient.id);
            var updateCmd = model.Utils.generateInsert(dbPatient, 'patients');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register patient in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return patient.fromData(rdr.rows[0]);
        }
        catch (e) {
            if (e.code == "23502")
                throw new exception.Exception("Missing mandatory field", exception.ErrorCodes.DATA_ERROR, e);
            throw e;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a patient in the system
     * @param {string} id The identity of the patient to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Patient} The deactivated patient instance
     */
    async delete(id, runAs, _txc) {

        if (!id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE patients SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 OR user_id = $1 RETURNING *", [id]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not DEACTIVATE patient in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new Patient().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Reactivate a patient in the system
     * @param {string} id The identity of the patient to reactivate
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Patient} The deactivated patient instance
     */
    async reactivate(id, runAs, _txc) {

        if (!id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE patients SET deactivation_time = NULL WHERE id = $1 OR user_id = $1 RETURNING *", [id]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not REACTIVATE patient in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new Patient().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }
}
