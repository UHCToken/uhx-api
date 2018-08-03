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
    ProviderService = require('../model/ProviderService'),
    security = require('../security'),
    model = require('../model/model');

/**
 * @class ProviderRepository
 * @summary Represents the provider repository logic
 */
module.exports = class ProviderServiceRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.update = this.update.bind(this);
        this.insert = this.insert.bind(this);
        this.delete = this.delete.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific provider address service from the database
     * @param {uuid} id Gets the specified provider address service
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderService} The retrieved provider address service
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_address_services WHERE id = $1", [id]);
            if (rdr.rows.length == 0)
                return null;
            else
                return new ProviderService().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Checks if an the service's address has the corresponding service type
     * @param {string} serviceId The service Id
     * @param {string} addressId The address Id
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The providers service types
     */
    async serviceTypeExists(serviceId, addressId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_address_services WHERE id = $1 AND service_type IN (SELECT service_type FROM provider_address_types WHERE provider_address_id = $2)", [serviceId, addressId]);
            if (rdr.rows.length == 0)
                return false;
            else {
                return true;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve all of an addresses services from the database
     * @param {uuid} addressId Gets all of the specified addresses services
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved addresses services
     */
    async getAllForAddress(addressId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_address_services WHERE address_id = $1 AND deactivation_time IS NULL ORDER BY GREATEST(updated_time, creation_time) DESC", [addressId]);
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = new ProviderService().fromData(rdr.rows[r]);
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified provider address service
     * @param {ProviderService} service The instance of the provider address service that is to be updated
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderService} The updated provider address service data from the database
     */
    async update(service, _txc) {
        if (!service.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbService = service.toData();

            var updateCmd = model.Utils.generateUpdate(dbService, 'provider_address_services', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return service.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }


    /**
     * @method
     * @summary Insert the specified provider address service
     * @param {ProviderService} service The instance of the provider address service that is to be inserted
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderService} The inserted provider address service
     */
    async insert(service, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbService = service.toData();
            delete (dbService.id);
            var updateCmd = model.Utils.generateInsert(dbService, 'provider_address_services');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return service.fromData(rdr.rows[0]);
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
     * @summary Delete / de-activate a provider address service in the system
     * @param {string} serviceId The identity of the provider address service to delete
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderService} The deactivated provider instance
     */
    async delete(serviceId, _txc) {

        if (!serviceId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE provider_address_services SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [serviceId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not DEACTIVATE provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new ProviderService().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }
}
