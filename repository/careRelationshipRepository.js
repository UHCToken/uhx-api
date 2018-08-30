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
    CareRelationship = require('../model/CareRelationship')

/**
 * @class
 * @summary Represents the service data repository logic
 */
module.exports = class CareRelationshipRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.insert = this.insert.bind(this);
        this.query = this.query.bind(this);
        this.update = this.update.bind(this);
    }

    /**
     * @method
     * @summary Inserts the specified asset into the database
     * @param {Asset} asset The asset to be inserted
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transaction to run this in
     * @returns {Asset} The inserted asset
     */
    async insert(careRelationship, runAs, _txc) {

        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbCareRelationship = careRelationship.toData();
            dbCareRelationship.created_by = runAs.session.userId;
            var insertCmd = model.Utils.generateInsert(dbCareRelationship, "care_relationships");
            // Insert the service
            var rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not insert care relationship", exception.ErrorCodes.DATA_ERROR);
            else
                return careRelationship.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Updates an asset offer 
     * @param {Asset} asset The  asset to be updated
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transactional client
     * @returns {Asset} The updated asset offer
     */
    async update(careRelationship, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Delete the asset offer
            var dbCareRelationship = careRelationship.toData();
            dbCareRelationship.updated_by = runAs.session.userId;
            var updateCmd = model.Utils.generateUpdate(dbCareRelationship, "care_relationships", "updated_time");
            var rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update care relationship", exception.ErrorCodes.DATA_ERROR);
            else
                return careRelationship.fromData(rdr.rows[0]); 
        }
        finally {
            if (!_txc) dbc.end();
        }
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
            if (!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM care_relationships WHERE id = $1", [id]);
            if (rdr.rows.length == 0)
                throw new exception.NotFoundException("care_relationships", id);
            else
                return new CareRelationship().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

        /**
     * @method
     * @summary Gets the specified asset by ID
     * @param {string} id The id of the asset to get
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Asset} The asset with identifier matching
     */
    async getByProviderId(providerId, status, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Get by ID
            var query = 'SELECT care_relationships.id, care_relationships.note, care_relationships.creation_time, care_relationships.status, care_relationships.provider_note,\
                 patients.given_name, patients.family_name,\
                 service_types.id as service_type_id, service_types.type_name,\
                 provider_addresses.id as address_id, provider_addresses.address_name\
                 FROM care_relationships, patients, service_types, provider_addresses\
                 WHERE care_relationships.provider_id = $1 AND patients.id = care_relationships.patient_id AND provider_addresses.id = care_relationships.address_id AND service_types.id = care_relationships.service_type_id';
            
            if(status && status != "*"){
                query = query + "AND care_relationship.status = $2";
                var rdr = await dbc.query(query, [providerId, status]);
            }
            else{
                 var rdr = await dbc.query(query, [providerId]);
            }
            if (rdr.rows.length == 0)
                return [];
            else{
                var retVal = [];
                rdr.rows.forEach(o=>retVal.push(new CareRelationship().fromData(o)));
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

            /**
     * @method
     * @summary Gets the specified asset by ID
     * @param {string} id The id of the asset to get
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Asset} The asset with identifier matching
     */
    async getByPatientId(patientId, status, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Get by ID
            var query = 'SELECT care_relationships.id, care_relationships.note, care_relationships.creation_time, care_relationships.status, care_relationships.provider_note,\
                 providers.name, providers.id as provider_id,\
                 service_types.id as service_type_id, service_types.type_name,\
                 provider_addresses.id as address_id, provider_addresses.address_name\
                 FROM care_relationships, providers, service_types, provider_addresses\
                 WHERE patient_id = $1 AND providers.id = care_relationships.provider_id AND provider_addresses.id = care_relationships.address_id AND service_types.id = care_relationships.service_type_id';
            if(status && status != "*"){
                query = query + 'AND status=$2';
                var rdr = await dbc.query(query, [patientId, status]);
            }
            else{
                var rdr = await dbc.query(query, [patientId]);
            }
            if (rdr.rows.length == 0)
                return [];
            else{
                var retVal = [];
                rdr.rows.forEach(o=>retVal.push(new CareRelationship().fromData(o)));
                
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get the specified asset by code
     * @param {Asset} filter The filter to query on
     * @param {number} offset The offset to start filter on
     * @param {number} count The number of results to return
     * @param {Client} _txc When present, the database transaction to use
     * @return {Array<Asset>} The asset with the matching code
     */
    async query(filter, offset, count, _txc) {

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbFilter = {};
            // User supplied filter
            if (filter) {
                dbFilter = filter.toData();
                if (!filter.deactivationTime)
                    dbFilter.deactivation_time = filter.deactivationTime;
            }
            var selectCmd = model.Utils.generateSelect(dbFilter, "care_relationships", offset, count);
            var rdr = await dbc.query(selectCmd.sql, selectCmd.args);
            var retVal = [];
            for (var r in rdr.rows)
                retVal.push(new CareRelationship().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }
}