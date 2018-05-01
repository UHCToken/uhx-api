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
    PermissionSet = require('../model/PermissionSet');

 /**
  * @class
  * @summary Represents the user repository logic
  */
 module.exports = class PermissionRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getApplicationPermission = this.getApplicationPermission.bind(this);
        this.getUserPermission = this.getUserPermission.bind(this);
        this.getAll = this.getAll.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    /**
     * @method
     * @summary Inserts the specified permission set into the database.
     * @param {PermissionSet} permission The permission which is being inserted
     * @param {Principal} runAs The user which this operation should be run as (for tracking)
     * @param {Client} _txc The postgresql client to use (for transaction control)
     * @returns {PermissionSet} The inserted permission set
     */
    async insert(permission, runAs, _txc) {

        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        // Insert into the database
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const dbPermission = permission.toData();

            // Set the createdBy
            dbPermission.created_by = runAs.session.userId;
            delete(dbPermission.id);
            
            var insertCmd = model.Utils.generateInsert(dbPermission, "permission_set");
            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not create permission set in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return permission.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified permission set in the database.
     * @param {PermissionSet} permission The permission which is being inserted
     * @param {Principal} runAs The user which this operation should be run as (for tracking)
     * @param {Client} _txc The postgresql client to use (for transaction control)
     * @returns {PermissionSet} The updated permission set
     */
    async update(permission, runAs, _txc) {

        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!permission.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        // Insert into the database
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const dbPermission = permission.toData();

            // Set the createdBy
            dbPermission.updated_by = runAs.session.userId;
            var updateCmd = model.Utils.generateUpdate(dbPermission, "permission_set", "updated_time");
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not update permission set in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return permission.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Deactivate the specified permission set in the database.
     * @param {string} permissionId The ID of the permission to delete
     * @param {Principal} runAs The user which this operation should be run as (for tracking)
     * @param {Client} _txc The postgresql client to use (for transaction control)
     * @returns {PermissionSet} The deactivated permission set
     */
    async delete(permissionId, runAs, _txc) {

        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!permissionId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        // Insert into the database
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE permission_set SET deactivation_time = CURRENT_TIMESTAMP, deactivated_by = $2 WHERE id = $1 RETURNING *", [permissionId, runAs.session.userId]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not deactivate permission set in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return permission.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a specific permission set from the database
     * @param {uuid} id Gets the specified permission set
     * @param {Client} _txc The postgresql client to use (for transaction control)
     * @returns {PermissionSet} The permission set with the specified identifier
     */
    async get(id, _txc) {

        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM permission_sets WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('permission_set', id);
            else
                return new model.PermissionSet().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieve all permission sets from the database
     * @param {Client} _txc The postgresql client to use (for transaction control)
     */
    async getAll(_txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM permission_sets WHERE deactivation_time IS NULL");
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSet().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Constructs the application permission information
     * @param {string} appId The identification for the application to gather permissions for
     * @param {boolean} client_only When true, filter for only those permissions which are marked as CLIENT_ONLY
     * @param {Client} _txc The postgresql client to use (for transaction control)
     * @returns {PermissionSetInstance} The permission for the object
     */
    async getApplicationPermission(appId, client_only, _txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT permission_sets.*, application_permissions.acl_flags FROM application_permissions INNER JOIN permission_sets ON (application_permissions.permission_set_id = permission_sets.id) " +
                "WHERE application_id = $1 " + 
                (client_only ? " AND client_only = TRUE" : ""), [appId]);
            
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSetInstance(appId, "Application").fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Constructs the user permission information
     * @param {string} uid The identification for the user to gather permissions for
     * @param {Client} _txc The postgresql client to use (for transaction control)
     * @returns {PermissionSetInstance} The permission for the object
     */
    async getUserPermission(uid, _txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT permission_sets.*, group_permissions.acl_flags FROM user_group INNER JOIN group_permissions USING (group_id) " + 
                "INNER JOIN permission_sets ON (group_permissions.permission_set_id = permission_sets.id) " +
                "WHERE user_id = $1", [uid]);
            
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSetInstance(uid, "User").fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }
 }