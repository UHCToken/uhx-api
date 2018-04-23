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
 module.exports = class SessionRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getActiveUserSession = this.getActiveUserSession.bind(this);
        this.insert = this.insert.bind(this);
    }

    /**
     * @summary Executes the functions in fntx within a transaction
     * @method 
     * @param {*} fntx A function to be executed in the transaction
     */
    async transact(fntx) {
        const dbc = new pg.Client(this._connectionString);
        try {

            await dbc.connect();
            await dbc.query("BEGIN TRANSACTION");

            var retVal = await fntx(dbc);

            await dbc.query("COMMIT");
            return retVal;
        }
        catch(e) {
            await dbc.query("ROLLBACK");
            throw e;
        }
        finally {
            dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a specific user from the database
     * @param {uuid} id Gets the specified session
     * @param {Client} _tx A database connection within a transaction to execute this
     */
    async get(id, _tx) {
        const dbc = _tx || new pg.Client(this._connectionString);
        try {
            if(!_tx) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM sessions WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('session', id);
            else
                return new model.Session().fromData(rdr.rows[0]);
        }
        finally {
            if(!_tx) dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieve a specific user session
     * @returns {Session} The active session if one exists
     * @param {uuid} userId The key (user subject) of the user to retrieve the active session for
     * @param {Client} _tx A database connection within a transaction to execute this
     */
    async getActiveUserSession(userId, _tx) {
        const dbc = _tx || new pg.Client(this._connectionString);
        try {
            if(!_tx) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM sessions WHERE user_id = $1 AND CURRENT_TIMESTAMP BETWEEN not_before AND not_after", [userId]);
            if(rdr.rows.length == 0)
                return null;
            else
                return new model.Session().fromData(rdr.rows[0]);
        }
        finally {
            if(!_tx) dbc.end();
        }
    }

    /**
     * @method
     * @summary Insert the specified session into the database
     * @param {Session} session The session to insert into the database
     * @param {Principal} runAs The identity to run as the session insertion
     * @param {Client} _tx A database connection within a transaction to execute this
     */
    async insert(session, runAs, _tx) {
        const dbc = _tx || new pg.Client(this._connectionString);
        try {
            if(!_tx) await dbc.connect();
            var insertCmd = model.Utils.generateInsert(session, "sessions");
            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                return null;
            else {
                return session.fromData(rdr.rows[0]);
            }
        }
        finally {
            if(!_tx) dbc.end();
        }
    }

    /**
     * @method
     * @summary Gets a session by refresh token
     * @param {uuid} token The refresh token to fetch the session by
     * @param {Client} _tx A database connection within a transaction to execute this
     * @returns {Session} The session that was abandoned
     */
    async getByRefreshToken(token, maxAge, _tx) {
        const dbc = _tx || new pg.Client(this._connectionString);
        try {
            if(!_tx) await dbc.connect();
            maxAge = maxAge + ' MILLISECONDS'
            const rdr = await dbc.query('SELECT * FROM sessions WHERE refresh_token = crypt($1, refresh_token) AND CURRENT_TIMESTAMP BETWEEN not_before AND not_after + $2::INTERVAL', [token, maxAge]);
            if(rdr.rows.length == 0)
                return null;
            else
                return new model.Session().fromData(rdr.rows[0]);
        }
        finally {
            if(!_tx) 
                dbc.end();
        }
    }

    /**
     * @method
     * @summary Abandons a session
     * @param {uuid} sessionId The identification of the session to abandon
     * @returns {Session} The session that was abandoned
     * @param {Client} _tx A database connection within a transaction to execute this
     */
    async abandon(id, _tx) {
        const dbc = _tx || new pg.Client(this._connectionString);
        try {
            if(!_tx) await dbc.connect();
            const rdr = await dbc.query("UPDATE sessions SET not_after = CURRENT_TIMESTAMP - '1 SECOND'::INTERVAL, refresh_token = null WHERE id = $1 RETURNING *;", [id]);
            if(rdr.rows.length == 0)
                return null;
            else
                return new model.Session().fromData(rdr.rows[0]);
        }
        finally {
            if(!_tx) dbc.end();
        }
    }
 }
