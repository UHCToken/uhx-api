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
    security = require('../security'),
    model = require('../model/model');

/**
 * @class ServiceTypeRepository
 * @summary Represents the service type repository logic
 */
module.exports = class ServiceTypeRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific service type from the database
     * @param {uuid} id Gets the specified service type
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved service type
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM service_types WHERE id = $1", [id]);
            if (rdr.rows.length == 0)
                return null;
            else
                return rdr.rows[0];
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieves all service types from the database
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved service types
     */
    async getAll(_txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM service_types");
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal.push(rdr.rows[r]);
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Inserts a new service type
     * @param {string} name The name of the service type to insert
     * @param {string} desc The description of the service type to insert
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved service types
     */
    async insert(name, desc, _txc) {

        if (!name)
            throw new exception.Exception("Missing values", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("INSERT INTO service_types (type_name, description) VALUES ($1, $2) RETURNING *", [name, desc]);
            if (rdr.rows.length == 0)
                return null;
            else 
                return rdr.rows[0];
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Updates a specific service type
     * @param {string} id The identity of the service type to update
     * @param {string} name The name of the service type to update
     * @param {string} desc The description of the service type to update
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved service types
     */
    async update(id, name, desc, _txc) {

        if (!id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        if (!name || !desc)
            throw new exception.Exception("Missing values", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("UPDATE service_types SET type_name = $2, description = $3 WHERE id = $1 RETURNING *", [id, name, desc]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Service type update failed", exception.ErrorCodes.NOT_FOUND);
            else
                return rdr.rows[0];
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete a service type in the system
     * @param {string} id The identity of the service type to delete
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The status
     */
    async delete(id, _txc) {

        if (!id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("DELETE FROM service_types WHERE id = $1 RETURNING *", [id]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not delete the service type in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return true;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }
}
