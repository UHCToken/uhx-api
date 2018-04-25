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
    }

    /**
     * @method
     * @summary Retrieve a specific permission set from the database
     * @param {uuid} id Gets the specified permission set
     */
    async get(id) {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM permission_sets WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('permission_set', id);
            else
                return new model.PermissionSet().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieve all permission sets from the database
     */
    async getAll() {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM permission_sets");
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSet().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            dbc.end();
        }

    }

    /**
     * @method
     * @summary Constructs the application permission information
     * @param {string} appId The identification for the application to gather permissions for
     * @returns {PermissionSetInstance} The permission for the object
     */
    async getApplicationPermission(appId) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT permission_sets.*, application_permissions.acl_flags FROM application_permissions INNER JOIN permission_sets ON (application_permissions.permission_set_id = permission_sets.id) " +
                "WHERE application_id = $1", [appId]);
            
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSetInstance(appId, "Application").fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            dbc.end();
        }
    }

    /**
     * @method
     * @summary Constructs the user permission information
     * @param {string} uid The identification for the user to gather permissions for
     * @returns {PermissionSetInstance} The permission for the object
     */
    async getUserPermission(uid) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT permission_sets.*, group_permissions.acl_flags FROM user_group INNER JOIN group_permissions USING (group_id) " + 
                "INNER JOIN permission_sets ON (group_permissions.permission_set_id = permission_sets.id) " +
                "WHERE user_id = $1", [uid]);
            
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSetInstance(uid, "User").fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            dbc.end();
        }
    }
 }