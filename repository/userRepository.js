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
        this.getAllWithoutWallet = this.getAllWithoutWallet.bind(this);
        this.getByNameSecret = this.getByNameSecret.bind(this);
        this.getByName= this.getByName.bind(this);
        this.incrementLoginFailure = this.incrementLoginFailure.bind(this);
        this.getExternalIds = this.getExternalIds.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getClaims = this.getClaims.bind(this);
        this.addClaim = this.addClaim.bind(this);
        this.deleteClaim = this.deleteClaim.bind(this);
        this.getTfaMethod = this.getTfaMethod.bind(this);
        this.assertClaim = this.assertClaim.bind(this);
        this.getByPublicAddress = this.getByPublicAddress.bind(this);
    }

    /**
     * @method
     * @summary Gets a tfa method
     * @param {number} tfaMethodId The ID of the TFA method to fetch
     * @param {*} _txc The connection on an active transaction to be used
     * @returns {string} The module for the TFA method
     */
    async getTfaMethod(tfaMethodId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            var rdr = await dbc.query("SELECT * FROM tfa_methods WHERE id = $1", [tfaMethodId]);
            if(rdr.rows.length > 0)
                return rdr.rows[0].modulename;
            return null;
        }
        finally {
            if(!_txc) dbc.end();
        }
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
     * @summary Retrieve all users without a wallet on a network
     * @param {string} network Network id
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {users} The retrieved users
     */
    async getAllWithoutWallet(network, _txc) {

        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM users WHERE users.id IN (SELECT user_group.user_id from user_group WHERE user_group.group_id='330d2fb4-ba61-4b48-a0a1-8162a4708e96') AND users.id NOT IN (SELECT wallets.user_id from wallets WHERE wallets.network_id=$1)", [network]);
            if(rdr.rows.length == 0)
                return [];
            else{
                var users = [];
                rdr.rows.forEach(function(user){
                    users.push(new User().fromData(user));
                });
                return (users);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Get claims for the specified user id
     * @param {string} userId The user id for which claims should be fetched
     * @param {Client} _txc When present, the postgresql connection to load claims on
     * @returns {*} The claims for the user in key=value format
     */
    async getClaims(userId, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM user_claims WHERE user_id = $1 AND expiry > CURRENT_TIMESTAMP", [userId]);
            var retVal = {};
            for(var r in rdr.rows)
                retVal[rdr.rows[r].claim_type] = rdr.rows[r].claim_value;
            return retVal;
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
    async query(filter, offset, count, sort, _txc) {
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            
            var dbFilter = filter.toData();
            dbFilter.deactivation_time = filter.deactivationTime; // Filter for deactivation time?

            if(sort) {
                var sortExpr = {}, order = "asc";
                // Is there a column : order?
                if(sort.indexOf(":") > -1)
                {
                    order = sort.split(":")[1];
                    sort = sort.split(":")[0];
                }
                sortExpr[sort] = "__sort_control__";
                var dbSort = new User().copy(sortExpr).toData();
                for(var k in dbSort)
                    if(dbSort[k] == "__sort_control__") {
                        sort = { col: [ k ], order: order }
                        break;
                    }
            }
            else {
                sort = { col: ["updated_time", "creation_time"], order: "desc"};
            }

            var sqlCmd = model.Utils.generateSelect(dbFilter, "users", offset, count, sort );
            const rdr = await dbc.query(sqlCmd.sql, sqlCmd.args);
            
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

            const rdr = await dbc.query("SELECT * FROM users WHERE LOWER(name) = $1 AND password = crypt($2, password)", [ username, password ]);
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
     * @summary Get the user information by using the username
     * @param {string} username The identifier of the user 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The fetched user
     */
    async getByName(username, _txc) {
        
        const dbc =  _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("SELECT * FROM users WHERE LOWER(name) = $1", [username]);
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
            delete(dbUser.id);
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
                throw new exception.Exception("Duplicate user name", exception.ErrorCodes.DUPLICATE_NAME);
            else if(e.code == "23502")
                throw new exception.Exception("Missing mandatory field", exception.ErrorCodes.DATA_ERROR, e);
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
            const rdr = await dbc.query("SELECT users.* FROM wallets INNER JOIN users ON (wallets.user_id = users.id) WHERE wallets.id = $1", [walletId]);
            if(rdr.rows.length == 0)
                return null; // Wallet is an anonymous wallet
            else
                return new User().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

        /**
     * @method
     * @summary Retrieves a user from the database given their wallet ID
     * @param {string} addr The public address of the user' wallet
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The user whom the wallet belongs to
     */
    async getByPublicAddress(addr, _txc) {
        const dbc =  _txc ||new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT users.* FROM users INNER JOIN wallets ON (wallets.user_id = users.id) WHERE address = $1", [addr]);
            if(rdr.rows.length == 0)
                return null; // Wallet is an anonymous wallet
            else
                return new User().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

     /**
     * @method
     * @summary Retrieves a user from the database given a secure claim (note, secure claims are claims which start with $)
     * @param {string} claimType The type of claim 
     * @param {string} claimValue The value of the claim
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} The user whom the wallet belongs to
     */
    async getByClaim(claimType, claimValue, _txc) {
        const dbc =  _txc ||new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT users.* FROM user_claims INNER JOIN users ON (user_claims.user_id = users.id) WHERE expiry > CURRENT_TIMESTAMP AND claim_type = $1 AND claim_value = crypt($2, claim_value) LIMIT 1", [claimType, claimValue]);
            var retVal = [];
            rdr.rows.forEach((r) => retVal.push(new User().fromData(r)));
            return retVal;
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

    /**
     * @method
     * @summary Deletes a claim from the user's account
     * @param {string} userId The id of the user from which to delete the claim
     * @param {string} claimType The type of claim to remove
     * @param {Client} _txc When populated, the transaction to execute as part of
     */
    async deleteClaim(userId, claimType, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try{
            if(!_txc) dbc.connect();
            await dbc.query("DELETE FROM user_claims WHERE user_id = $1 AND claim_type = $2", [ userId, claimType ]);
        }
        finally{ 
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Add a claim value to the user
     * @param {string} userId The user to which the claim is being made
     * @param {*} claim The claim which is to be added to the user
     * @param {string} claim.type The name of the claim
     * @param {*} claim.value The value of the claim
     * @param {date} claim.expiry The time that the claim will cease to be valid
     * @param {Client} _txc When populated the transaction to execute under
     */
    async addClaim(userId, claim, _txc) {
        // Validate parameters
        if(!userId)
            throw new exception.ArgumentException("userId");
        if(!claim)
            throw new exception.ArgumentException("claim");
        if(!claim.type || !claim.value)
            throw new exception.ArgumentException("claim.type || claim.value");
        
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var sql = "INSERT INTO user_claims (claim_type, claim_value, expiry, user_id) VALUES ($1, $2, $3, $4)";
            if(claim.type.startsWith("$")) // crypt
                sql = "INSERT INTO user_claims (claim_type, claim_value, expiry, user_id) VALUES ($1, crypt($2, gen_salt('bf')), $3, $4)";
            
            await dbc.query(sql, [ claim.type, claim.value, claim.expiry, userId ]);

        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Asserts that the specified user has a claim with a specific value
     * @param {string} userId The user for which the claim is being tested
     * @param {string} claimType The type of claim that is being tested
     * @param {*} claimValue The value of the claim that is being asserted
     * @param {Client} _txc The database transaction to use 
     * @returns {boolean} True if the assertion is correct
     */
    async assertClaim(userId, claimType, claimValue, _txc) {
        // Validate parameters
        if(!userId)
            throw new exception.ArgumentException("userId");
        if(!claimType)
            throw new exception.ArgumentException("claimType");
        if(!claimValue)
            throw new exception.ArgumentException("claimValue");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var sql = "SELECT TRUE FROM user_claims WHERE user_id = $1 AND claim_type = $2 AND expiry > CURRENT_TIMESTAMP AND claim_value = ";
            if(claimType.startsWith("$")) // crypt
                sql += "crypt($3, claim_value)";
            else
                sql += "$3"
            sql += " LIMIT 1";

            var rdr = await dbc.query(sql, [ userId, claimType, claimValue ]);
            return rdr.rows.length > 0;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }
}
