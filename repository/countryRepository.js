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
 * @class CountryRepository
 * @summary Represents the country repository logic
 */
module.exports = class CountryRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.getCountryById = this.getCountryById.bind(this);
        this.getCountryByCode = this.getCountryByCode.bind(this);
        this.getAll = this.getAll.bind(this);
    }

    /**
     * @method
     * @summary Retrieves a specific country from the database
     * @param {uuid} id The unique identifier for the country
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved country
     */
    async getCountryById(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM countries WHERE id = $1", [id]);
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
     * @summary Retrieves a specific country from the database
     * @param {string} code The 2 digit country code
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved country
     */
    async getCountryByCode(code, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM countries WHERE code = $1", [code.toLowerCase()]);
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
     * @summary Retrieves all countries from the database
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved countries
     */
    async getAll(_txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            var rdr = await dbc.query("SELECT * FROM countries");
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
}
