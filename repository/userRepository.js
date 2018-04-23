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
    model = require('../model/model'),
    security = require('../security');

 /**
  * @class UserRepository
  * @summary Represents the user repository logic
  */
 module.exports = class UserRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getByNameSecret = this.getByNameSecret.bind(this);
        this.incrementLoginFailure = this.incrementLoginFailure.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific user from the database
     * @param {uuid} id Gets the specified session
     */
    async get(id) {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM users WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('user', id);
            else
                return new model.User().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }

    }

     /**
     * @method
     * @summary Get the user information by using the id and secret
     * @param {string} username The identifier of the user 
     * @param {string} password The password for the client
     * @returns {User} The fetched user
     */
    async getByNameSecret(username, password) {
        
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            const rdr = await dbc.query("SELECT * FROM users WHERE name = $1 AND password = crypt($2, password)", [ username, password ]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("user", username);
            else
                return new model.User().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }
    }

    /**
     * @method 
     * @summary Increments the login failures for the user account
     * @param {string} username The name of the user to increment the login failure attempts by
     * @param {number} lockoutThreshold The maximum number of invalid logins to permit
     * @returns {User} The updated user object.
     */
    async incrementLoginFailure(username, lockoutThreshold) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            const rdr = await dbc.query("UPDATE users SET invalid_login = invalid_login + 1, lockout = CASE WHEN invalid_login > $2 THEN current_timestamp + '1 DAY'::interval ELSE null END WHERE name = $1 RETURNING *", [ username, lockoutThreshold ]);
            if(rdr.rows.length > 0) {
                return new model.User().fromData(rdr.rows[0]);
            }
            else 
                return null;
        }
        finally {
            dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified user
     * @param {User} user The instance of the user that is to be updated
     * @param {Principal} runAs The principal that is updating this user 
     * @returns {User} The updated user data from the database
     */
    async update(user, runAs) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            var updateCmd = model.Utils.generateUpdate(user, 'users', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                return null;
            else
                return user.fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }
    }

    
    /**
     * @method
     * @summary Insert  the specified user
     * @param {User} user The instance of the user that is to be inserted
     * @param {Principal} runAs The principal that is inserting this user 
     */
    async insert(user, runAs) {
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            var updateCmd = model.Utils.generateInsert(user, 'users');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                return null;
            else
                return user.fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a user in the system
     * @param {string} userId The identity of the user to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     */
    async delete(userId, runAs) {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            const rdr = await dbc.query("UPDATE users SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", userId);
            if(rdr.rows.length == 0)
                return null;
            else
                return new model.User().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }

    }
}
