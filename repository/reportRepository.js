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
    security = require('../security'),
    model = require('../model/model'),
    uhx = require("../uhx");

 /**
  * @class
  * @summary Represents the report repository logic
  */
 module.exports = class ReportRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.execute = this.execute.bind(this);
        this.query = this.query.bind(this);
    }

    /**
     * @method
     * @summary Get the report listing from the repository
     * @param {*} filter The filter to run on the repository
     * @param {number} offset The number of records to offset
     * @param {number} count The number of records to count
     * @param {Client} _txc The postgresql transaction to run this in
     */
    async query(filter, offset, count, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var selectCmd = model.Utils.generateSelect(filter, "reports", offset, count);
            const rdr = await dbc.query(selectCmd.sql, selectCmd.args);
            var retVal = [];
            rdr.rows.forEach((r)=> retVal.push({
                id: r.id,
                name: r.name,
                description: r.description
            }));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Executes the report
     * @param {string} reportId The id of the report to run
     * @param {*} filter The filter to be applied to the report
     * @param {number} offset The offset in the number of records
     * @param {number} count The number of records to return
     * @param {Client} _txc The transaction in which this transaction should be run
     */
    async execute(reportId, filter, offset, count, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var rdr = await dbc.query("SELECT * FROM reports WHERE id = $1", [reportId]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("reports", reportId);
            else {
                var selectCmd = model.Utils.generateSelect(filter, rdr.rows[0].view_name, offset, count, { col: ["1"], order: "ASC" });
                var retVal = {
                    name: rdr.rows[0].name,
                    description: rdr.rows[0].description,
                    data: []
                };
                rdr = await dbc.query(selectCmd.sql, selectCmd.args);
                rdr.rows.forEach((r)=> retVal.data.push(r));
                return retVal;
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }
}