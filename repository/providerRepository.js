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
    Provider = require('../model/Provider'),
    security = require('../security'),
    model = require('../model/model');

/**
 * @class ProviderRepository
 * @summary Represents the provider repository logic
 */
module.exports = class ProviderRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.checkIfExists = this.checkIfExists.bind(this);
        this.serviceTypeExists = this.serviceTypeExists.bind(this);
        this.getAllProviders = this.getAllProviders.bind(this);
        this.update = this.update.bind(this);
        this.insert = this.insert.bind(this);
        this.getProviderServiceTypes = this.getProviderServiceTypes.bind(this);
        this.insertServiceType = this.insertServiceType.bind(this);
        this.deleteServiceType = this.deleteServiceType.bind(this);
        this.delete = this.delete.bind(this);
        this.reactivate = this.reactivate.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific provider from the database
     * @param {string} id Gets the specified provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Provider} The retrieved provider
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM providers WHERE deactivation_time IS NULL AND (user_id = $1 OR id = $1)", [id]);
            if (rdr.rows.length == 0)
                return null;
            else
                return new Provider().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Checks if a user has a provider profile
     * @param {string} id Gets the specified provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The boolean of whether or not the profile exists
     */
    async checkIfExists(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT id FROM providers WHERE user_id = $1 OR id = $1", [id]);
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
     * @summary Checks if a provider has a specified service type
     * @param {string} providerId The provider id
     * @param {string} typeId The service type id
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The providers service types
     */
    async serviceTypeExists(providerId, typeId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM providers WHERE id = $1 AND id IN (SELECT provider_id FROM provider_types WHERE service_type = $2)", [providerId, typeId]);
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
     * @summary Retrieve all providers
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved providers
     */
    async getAllProviders(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM providers");
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = new Provider().fromData(rdr.rows[r]);
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Update the specified provider
     * @param {Provider} provider The instance of the provider that is to be updated
     * @param {Principal} runAs The principal that is updating this provider 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Provider} The updated provider data from the database
     */
    async update(provider, runAs, _txc) {
        if (!provider.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbProvider = provider.toData();

            var updateCmd = model.Utils.generateUpdate(dbProvider, 'providers', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return provider.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }


    /**
     * @method
     * @summary Insert the specified provider
     * @param {Provider} provider The instance of the provider that is to be inserted
     * @param {Principal} runAs The principal that is inserting this provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Provider} The inserted provider
     */
    async insert(provider, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbProvider = provider.toData();
            delete (dbProvider.id);
            var updateCmd = model.Utils.generateInsert(dbProvider, 'providers');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return provider.fromData(rdr.rows[0]);
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
     * @summary Gets the providers listed services types
     * @param {string} providerId The provider Id
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The providers service types
     */
    async getProviderServiceTypes(providerId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT type_name AS name, description, service_types.id AS type_id FROM service_types JOIN provider_types ON provider_types.service_type = service_types.id WHERE provider_types.provider_id = $1", [providerId]);
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = rdr.rows[r];
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
 * @method
 * @summary Insert the specified service type for a provider
 * @param {string} providerId The provider to add the service type to
 * @param {string} serviceTypeId The service type to add to the provider
 * @param {Client} _txc The postgresql connection with an active transaction to run in
 * @returns {Boolean} The status of the insert
 */
    async insertServiceType(providerId, serviceTypeId, _txc) {
        if (!providerId || !serviceTypeId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("INSERT INTO provider_types (provider_id, service_type) VALUES ($1, $2) RETURNING *", [providerId, serviceTypeId]);

            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register provider types in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return true;
        }
        catch (e) {
            if (e.code == "23502")
                throw new exception.Exception("Missing mandatory field", exception.ErrorCodes.DATA_ERROR, e);
            if (e.code == "23505")
                throw new exception.Exception("Provider type already exists", exception.ErrorCodes.DATA_ERROR, e);
            throw e;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete a service type for a provider
     * @param {string} providerId The identity of the provider to delete the service type for
     * @param {string} serviceTypeId The service type to delete for the provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The status of the delete
     */
    async deleteServiceType(providerId, serviceTypeId, _txc) {

        if (!providerId || !serviceTypeId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("DELETE FROM provider_types WHERE provider_id = $1 AND service_type = $2 RETURNING *", [providerId, serviceTypeId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not delete provider service type in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return true;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Delete / de-activate a provider in the system
     * @param {string} id The identity of the provider to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Provider} The deactivated provider instance
     */
    async delete(id, runAs, _txc) {

        if (!id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE providers SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 OR user_id = $1 RETURNING *", [id]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not DEACTIVATE provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new Provider().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Reactivate a provider in the system
     * @param {string} id The identity of the provider to reactivate
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Provider} The deactivated provider instance
     */
    async reactivate(id, runAs, _txc) {

        if (!id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE providers SET deactivation_time = NULL WHERE id = $1 OR user_id = $1 RETURNING *", [id]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not REACTIVATE provider in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new Provider().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }
}
