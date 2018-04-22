'use strict';

/**
 * Universal Health Coin API Service
 * Copyright (C) 2018, Universal Health Coin
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Original Authors: Justin Fyfe (justin-fyfe), Rory Yendt (RoryYendt)
 * Original Date: 2018-04-18
 * 
 * This file contains the user repository which is the glue logic between the database and 
 * business objects
 * 
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
                retVal.push(new model.PermissionSetInstance(appId, "Application").fromData(rdr.rows[0]));
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
    async getApplicationPermission(uid) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT permission_sets.*, group_permissions.acl_flags FROM user_group INNER JOIN group_permissions USING (group_id) " + 
                "INNER JOIN permission_sets ON (group_permissions.permission_set_id = permission_sets.id) " +
                "WHERE user_id = $1", [uid]);
            
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new model.PermissionSetInstance(uid, "User").fromData(rdr.rows[0]));
            return retVal;
        }
        finally {
            dbc.end();
        }
    }
 }