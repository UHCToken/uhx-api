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
    User = require('../model/User'),
    security = require('../security'),
    model = require('../model/model');

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
        this.getExternalIds = this.getExternalIds.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }


    /**
     * @method
     * @summary Get external identifiers for the user
     * @param {string} userId The user which external identifiers should be fetched for
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} External identities for the user
     */
    async getExternalIds(userId, _txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM user_identity WHERE user_id = $1", [userId]);
            var retVal = [];
            for(var r in rdr.rows) 
                retVal.push({ provider: rdr.rows[r].provider });
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a specific user from the database
     * @param {uuid} id Gets the specified session
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The retrieved user
     */
    async get(id, _txc) {

        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM users WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('user', id);
            else
                return new User().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Query the database for the specified users
     * @param {*} filter The query template to use
     * @param {number} offset When specified indicates the offset of the query
     * @param {number} count When specified, indicates the number of records to return
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The matching users
     */
    async query(filter, offset, count, _txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            
            var dbFilter = filter.toData();
            dbFilter.deactivation_time = filter.deactivationTime; // Filter for deactivation time?

            var sqlCmd = model.Utils.generateSelect(dbFilter, "users", offset, count);
            const rdr = await dbc.query(sqlCmd.sql + " ORDER BY updated_time, creation_time DESC", sqlCmd.args);
            
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new User().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

     /**
     * @method
     * @summary Get the user information by using the id and secret
     * @param {string} username The identifier of the user 
     * @param {string} password The password for the client
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The fetched user
     */
    async getByNameSecret(username, password, _txc) {
        
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("SELECT * FROM users WHERE name = $1 AND password = crypt($2, password)", [ username, password ]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("users", username);
            else
                return new User().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method 
     * @summary Increments the login failures for the user account
     * @param {string} username The name of the user to increment the login failure attempts by
     * @param {number} lockoutThreshold The maximum number of invalid logins to permit
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The updated user object.
     */
    async incrementLoginFailure(username, lockoutThreshold, _txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE users SET invalid_login = invalid_login + 1, lockout = CASE WHEN invalid_login >= $2 THEN current_timestamp + '1 DAY'::interval ELSE null END WHERE name = $1 RETURNING *", [ username, lockoutThreshold ]);
            if(rdr.rows.length > 0) {
                return new User().fromData(rdr.rows[0]);
            }
            else 
                return null;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified user
     * @param {User} user The instance of the user that is to be updated
     * @param {string} password The new password to set for the user
     * @param {Principal} runAs The principal that is updating this user 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The updated user data from the database
     */
    async update(user, password, runAs, _txc) {
        if(!user.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbUser = user.toData();
            if(password)
                dbUser.$password = password;
            
            delete(dbUser.name); // <-- Constraint : Cannot update name

            var updateCmd = model.Utils.generateUpdate(dbUser, 'users', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
               throw new exception.Exception("Could not update user in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return user.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    
    /**
     * @method
     * @summary Insert  the specified user
     * @param {User} user The instance of the user that is to be inserted
     * @param {Principal} runAs The principal that is inserting this user
     * @param {string} password The password to set on the user account
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The inserted user
     */
    async insert(user, password, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbUser = user.toData();
            dbUser.$password = password;
            var updateCmd = model.Utils.generateInsert(dbUser, 'users');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not register user in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return user.fromData(rdr.rows[0]);
        }
        catch(e) {
            if(e.code == '23505') // duplicate key
                throw new exception.Exception("Duplicate user name", exception.ErrorCodes.DUPLICATE_USERNAME);
            throw e;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieves a user from the database given their wallet ID
     * @param {string} walletId The identifier of the wallet to retrieve the user by
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The user whom the wallet belongs to
     */
    async getByWalletId(walletId, _txc) {
        const dbc =  _txc ||new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT users.* FROM users WHERE wallet_id = $1", [walletId]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("wallet", walletId);
            else
                return new User().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a user in the system
     * @param {string} userId The identity of the user to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The deactivated user instance
     */
    async delete(userId, runAs, _txc) {

        if(!userId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE users SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [userId]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not DEACTIVATE user in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new User().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }

    }
}
