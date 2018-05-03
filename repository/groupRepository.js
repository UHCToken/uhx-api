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
    Group = require('../model/Group'),
    User = require('../model/User'),
    model = require('../model/model'),
    security = require('../security');

/**
 * @class
 * @summary Represents a data access class to the group tables
 */
module.exports = class GroupRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the group repository
     * @param {string} connectionString The connection string to the database to interact with
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getByName = this.getByName.bind(this);
        this.getAll = this.getAll.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.addUser = this.addUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.getByUserId = this.getByUserId.bind(this);
    }

    /**
     * @method
     * @summary Get a specific group from the repository
     * @param {string} groupId The identifier of the group to get
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Group} The group with matching id
     */
    async get(groupId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM groups WHERE id = $1", [groupId]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("group", groupId);
            else
                return new Group().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get a specific group from the repository
     * @param {string} groupName The name of the group to get
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Group} The group with matching name
     */
    async getByName(groupName, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM groups WHERE name = $1", [groupName]);
            if(rdr.rows.length == 0)
                return null;
            else
                return new Group().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get all the groups from the database that the user belongs to
     * @param {string} userId The identifier of the user to fetch group information for
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Group} The group with matching name
     */
    async getByUserId(userId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM groups INNER JOIN user_group ON (user_group.group_id = groups.id) WHERE user_group.user_id = $1", [userId]);
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new Group().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get all groups from the data repository
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Group} All groups which match the specified parameters
     */
    async getAll(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM groups WHERE deactivated_time IS NULL");
            var retVal = [];
            for(var r in rdr.rows)
                retVal.push(new Group().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Insert the specified group into the data repository
     * @param {Group} group The group to be inserted into the data store
     * @param {Principal} runAs The principal to run this operation as
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Group} The inserted group
     */
    async insert(group, runAs, _txc) {

        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbGroup = group.toData();
            dbGroup.created_by = runAs.session.userId;
            delete(dbGroup.id);
            
            var insertCmd = model.Utils.generateInsert(dbGroup, "groups");

            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Error inserting group", exception.ErrorCodes.DATA_ERROR);
            else
                return new Group().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified group in the data repository
     * @param {Group} group The group to be updated
     * @param {Principal} runAs The prinicpal which should be used to update this group
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     */
    async update(group, runAs, _txc) {
        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!group || !group.id)
            throw new exception.Exception("Update requires that the target have an id", exception.ErrorCodes.MISSING_PROPERTY);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var dbGroup = group.toData();
            dbGroup.updated_by = runAs.session.userId;
            var insertCmd = model.Utils.generateUpdate(dbGroup, "groups", "updated_time");

            const rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Error updating group", exception.ErrorCodes.DATA_ERROR);
            else
                return new Group().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Deactivates the specified group in the database
     * @param {string} groupId The identifier of the group to be deactivated 
     * @param {Principal} runAs The principal to delete the group as
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     */
    async delete(groupId, runAs, _txc) {
        // Verify input parameters
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!groupId)
            throw new exception.Exception("Delete requires that the target have an id", exception.ErrorCodes.MISSING_PROPERTY);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE groups SET deactivated_time = CURRENT_TIMESTAMP, deactivated_by = $2 WHERE id = $1 RETURNING *", [ groupId, runAs.session.userId ]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Error deleting group", exception.ErrorCodes.DATA_ERROR);
            else
                return new Group().fromData(rdr.rows[0]);
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get all users in the specified group
     * @param {string} groupId
     * @param {*} filter The filter parameters to add
     * @param {number} filter._offset The offset of the user result set
     * @param {number} filter._count The number the user results to retrieve
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {User} A list of users in this group (limited data model)
     */
    async getUsers(groupId, filter, _txc) {

        filter = filter || { _offset: 0, _count: 100 }; // Default filter if not supplied 

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const rdr = await dbc.query("SELECT users.* FROM user_group WHERE group_id = $1 OFFSET $2 LIMIT $3", [groupId, filter._offset || 0, filter._count || 100]);
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
     * @summary Adds the specified user to the group
     * @param {string} groupId The group to which the user should be added
     * @param {string} userId The user to be added to the group
     * @param {Principal} runAs The principal to insert the user as (for auditing)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @return {boolean} True if the user was added to the group successfully
     */
    async addUser(groupId, userId, runAs, _txc) {

        // Verify inputs
        if(!groupId)
            throw new exception.Exception("groupId is required", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!userId)
            throw new exception.Exception("userId is required", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            var existing = await dbc.query("SELECT 1 FROM user_group WHERE user_id = $1 AND group_id = $2", [userId, groupId]);
            if(existing.rows.length == 0) // needs insert
                await dbc.query("INSERT INTO user_group (user_id, group_id) VALUES ($1, $2) RETURNING *", [userId, groupId]);
            return true;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Removes a user from the specified group
     * @param {string} groupId The group from which the user should be removed
     * @param {string} userId The user which should be removed from the group
     * @param {Principal} runAs The principal to run as 
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {boolean} True if the user was removed from the group, false if the user was not a member of the group (and was not removed)
     */
    async removeUser(groupId, userId, runAs, _txc) {
        // Verify inputs
        if(!groupId)
            throw new exception.Exception("groupId is required", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!userId)
            throw new exception.Exception("userId is required", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        if(!runAs || !(runAs instanceof security.Principal))
            throw new exception.Exception("runAs must be principal and must be supplied", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            var result = await dbc.query("DELETE FROM user_group  WHERE user_id = $1 AND group_id = $2 RETURNING *", [userId, groupId]);
            return result.rows.length > 0;
        }
        finally {
            if(!_txc) dbc.end();
        }
    }
}