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
    model = require('../model/model'),
    Asset = require('../model/Asset');

 /**
  * @class
  * @summary Represents the asset data repository logic
  */
 module.exports = class AsssetRepository {

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
     * @summary Gets the specified asset by ID
     * @param {string} id The id of the asset to get
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Asset} The asset with identifier matching
     */
    async get(id, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM assets WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("asset", id);
            else 
                return new Asset().fromData(rdr.rows[0]);
        }
        finally{
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get the specified asset by code
     * @param {Asset} filter The filter to query on
     * @param {number} offset The offset to start filter on
     * @param {number} count The number of results to return
     * @param {Client} _txc When present, the database transaction to use
     * @return {Asset} The asset with the matching code
     */
    async query(filter, offset, count, _txc) {

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbFilter = {};
            // User supplied filter
            if(filter) {
                dbFilter = filter.toData();
                if(!filter.deactivationTime)
                    dbFilter.deactivation_time = filter.deactivationTime;
            }
            var selectCmd = model.Utils.generateSelect(dbFilter, "assets", offset, count);
            var rdr = await dbc.query(selectCmd.sql, selectCmd.args);
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new Asset().fromData(rdr.rows[r]));
            return retVal;
        }
        finally{
            if(!_txc) dbc.end();
        }
    }
}