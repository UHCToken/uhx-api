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
    Invitation = require('../model/Invitation'),
    User = require("../model/User"),
    uhc = require("../uhc");

 /**
  * @class
  * @summary Represents the asset data repository logic
  */
 module.exports = class InvitationRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.getByClaimToken = this.getByClaimToken.bind(this);
        this.insert = this.insert.bind(this);
    }

    /**
     * @method
     * @summary Gets the specified invitation
     * @param {string} id The identifier of the invitation
     * @param {Client} _txc The database transaction to use
     * @returns {Invitation} The retrieved invitation
     */
    async get(id, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM invitations WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("invitation", id);
            else 
                return new Invitation().fromData(rdr.rows[0]);
        }
        finally{
            if(!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Gets the invitation by claim ticket
     * @param {string} token The value of the claim ticket
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Invitation} The asset with identifier matching
     */
    async getByClaimToken(token, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM invitations WHERE claim_token = crypt($1, claim_token) AND expiration_time > CURRENT_TIMESTAMP AND claim_time IS NULL AND deactivation_time IS NULL", [token]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("invitation", token);
            else 
                return new Invitation().fromData(rdr.rows[0]);
        }
        finally{
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Inserts the specified invitation into the data store
     * @param {Invitation} invitation The invitation to be inserted
     * @param {Principal} runAs The user principal which is creating the invitation
     * @param {string} claimToken The randomly generated claim token data
     * @param {Client} _txc The transaction to run this operation within
     * @return {Invitation} The inserted invitation information
     */
    async insert(invitation, claimToken, expirationPeriod, runAs, _txc) {
        
        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");
        if(!claimToken)
            throw new exception.ArgumentException("claimToken");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbInvitation = invitation.toData();
            delete(dbInvitation.id);
            dbInvitation.$claim_token = claimToken;
            dbInvitation.created_by = runAs.session.userId;
            dbInvitation.expiration_time = new Date(new Date().getTime() + expirationPeriod);
            var insertCmd = model.Utils.generateInsert(dbInvitation, "invitations");
            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Error inserting invitation", exception.ErrorCodes.DATA_ERROR);
            else 
                return invitation.fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Claims an invitation for the specified user
     * @param {Invitation} invitation The unique claim token to be claimed
     * @param {User} user The created user which is claiming this token
     * @param {Client} _txc The client on which transactions should be run
     * @return {Invitation} The user that was created as part of claiming the token
     */
    async update(invitation, user, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            
            if(!_txc) await dbc.connect();
            
            const rdr = await dbc.query("UPDATE invitations SET signup_user_id = $1, claim_time = CURRENT_TIMESTAMP WHERE id = $2 AND claim_time IS NULL AND expiration_time > CURRENT_TIMESTAMP AND deactivation_time IS NULL RETURNING *", [user.id, id]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Error claiming invitation", exception.ErrorCodes.DATA_ERROR);
            else
                return invitation.fromData(rdr.rows[0]);

        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Rescinds the invitation
     * @param {string} invitationId The id of the invitation to rescind
     * @param {Client} _txc The client which is in a transaction
     */
    async delete(invitationId, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            
            if(!_txc) await dbc.connect();
            
            const rdr = await dbc.query("UPDATE invitations SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [invitationId]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Error rescinding invitation", exception.ErrorCodes.DATA_ERROR);
            else
                return invitation.fromData(rdr.rows[0]);

        }
        finally {
            if(!_txc) dbc.end();
        }
    }
}