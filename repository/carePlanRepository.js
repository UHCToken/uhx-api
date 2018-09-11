
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
    CarePlan = require('../model/CarePlan'),
    CareService = require('../model/CareService');

/**
 * @class
 * @summary Represents the asset data repository logic
 */
module.exports = class CarePlanRepository {

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
    async insert(carePlan, runAs, _txc) {

        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbCarePlan = carePlan.toData();
            dbCarePlan.created_by = runAs.session.userId;
            var insertCmd = model.Utils.generateInsert(dbCarePlan, "care_plans");
            // Insert the service invoice
            var rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not insert care plan", exception.ErrorCodes.DATA_ERROR);
            else
                return carePlan.fromData(rdr.rows[0]);
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
    async update(carePlan, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Delete the asset offer
            var dbCarePlan = carePlan.toData();
            dbCarePlan.updated_by = runAs.session.userId;
            var updateCmd = model.Utils.generateUpdate(dbCarePlan, "care_plans", "updated_time");
            var rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update care plan", exception.ErrorCodes.DATA_ERROR);
            else
                return carePlan.fromData(rdr.rows[0]); 
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
            var rdr = await dbc.query("SELECT * FROM care_plans WHERE id = $1", [id]);
            if (rdr.rows.length == 0)
                throw new exception.NotFoundException("carePlan", id);
            else
                return new CarePlan().fromData(rdr.rows[0]);
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
            
            var query =
            `SELECT *
            FROM(
              SELECT cp.id, cp.total, cp.care_relationship_id, cp.status, cp.creation_time,
              (SELECT json_agg(cs)
              FROM (
                SELECT * FROM care_services WHERE care_plan_id = cp.id
              ) cs
             ) AS care_services
            FROM care_plans as cp) care_plans WHERE care_plans.care_relationship_id IN (SELECT id FROM care_relationships WHERE provider_id = $1)`;
            
            if(status && status != "*"){
                query = query + 'AND status=$2';
                var rdr = await dbc.query(query, [providerId, status]);
            }
            else{
                var rdr = await dbc.query(query, [providerId]);
            }
            if (rdr.rows.length == 0)
                return [];
                else{
                    var retVal = [];
                    for(var i = 0; i<rdr.rows.length; i++){
                        var carePlan = new CarePlan().fromData(rdr.rows[i]);
                        carePlan.careServices = [];
                        if(rdr.rows[i].care_services){
                            for(var j = 0; j<rdr.rows[i].care_services.length; j++){
                                carePlan.careServices.push(new CareService().fromData(rdr.rows[i].care_services[j]));
                            }
                        }
                        retVal.push(carePlan);
                    }
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
            var query =
            `SELECT *
            FROM(
              SELECT cp.id, cp.total, cp.care_relationship_id, cp.status, cp.creation_time,
              (SELECT json_agg(cs)
              FROM (
                SELECT * FROM care_services WHERE care_plan_id = cp.id
              ) cs
             ) AS care_services
            FROM care_plans as cp) care_plans WHERE care_plans.care_relationship_id IN (SELECT id FROM care_relationships WHERE patient_id = $1)`;
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
                for(var i = 0; i<rdr.rows.length; i++){
                    var carePlan = new CarePlan().fromData(rdr.rows[i]);
                    carePlan.careServices = [];
                    if(rdr.rows[i].care_services){
                        for(var j = 0; j<rdr.rows[i].care_services.length; j++){
                            carePlan.careServices.push(new CareService().fromData(rdr.rows[i].care_services[j]));
                        }
                    }
                    retVal.push(carePlan);
                }
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
            var selectCmd = model.Utils.generateSelect(dbFilter, "care_plans", offset, count);
            var rdr = await dbc.query(selectCmd.sql, selectCmd.args);
            var retVal = [];
            for (var r in rdr.rows)
                retVal.push(new CarePlan().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }
}