/// <Reference path="../model/model.js"/>
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
    model = require('../model/model');

 /**
  * @class
  * @summary Represents the offering repository logic
  */
 module.exports = class OfferingRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a list of offerings
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Offering} The fetched offerings
     */
    async get(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM offerings");
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('offerings', null);
            else {
                const offerings = [];

                for (let i = 0; i < rdr.rows.length; i++) {
                    offerings.push(new model.Offering().fromData(rdr.rows[i]))
                }

                return offerings;
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a list of offerings available to the patient
     * @param {string} id The id for the current patient
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Offering} The fetched offerings available
     */
    async getOfferingsForPatient(id, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM offerings WHERE id = $1", [id]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('offerings', id);
            else {
                const offerings = [];

                for (let i = 0; i < rdr.rows.length; i++) {
                    offerings.push(new model.Offering().fromData(rdr.rows[i]))
                }

                return offerings;
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }
 }
