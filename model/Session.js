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


const ModelBase = require('./ModelBase'),
    uhc = require('../uhc'),
    Application = require('./Application'),
    User = require('./User'),
    crypto = require('crypto');

/**
 * @class Session
 * @summary Represents a single session which is a user on a client device
 */
module.exports = class Session extends ModelBase {

    /**
     * @constructor
     * @summary Creates a new session between the user and application
     * @param {User} user The user to construct the session from (or the id of the user)
     * @param {Application} application The application to construct the session from (or the id of application)
     * @param {number} expiry The expiration time
     */
    constructor(user, application, scope, sessionLength) {

        super();

        if(!user && !application) return;

        this.userId = user.id || user;
        this.applicationId = application.id || application;
        this.notAfter = new Date(new Date().getTime() + sessionLength);
        this.notBefore = new Date();
        this._refreshToken = crypto.randomBytes(32).toString('hex');
        this._user = user.id ? user : null;
        this.audience = scope;
        this._application = application.id ? application : null;
    }

    /**
     * @method
     * @summary Constructs a new session instance from the specified dbsession information
     * @param {*} dbSession The session information from the database
     */
    fromData(dbSession) {
        this.id = dbSession.id;
        this.userId = dbSession.user_id;
        this.applicationId = dbSession.application_id;
        this.audience = dbSession.scope;
        this.notBefore = dbSession.not_before;
        this.notAfter = dbSession.not_after;
        return this;
    }

    /**
     * @method
     * @summary Convert this session to data stream
     */
    toData() {
        return {
            id : this.id,
            user_id: this.userId,
            application_id: this.applicationId,
            scope: this.audience,
            not_before: this.notBefore,
            not_after: this.notAfter,
            $refresh_token: this._refreshToken
        };
    }

    /**
     * @property
     * @summary Get the refresh token
     */
    get refreshToken() {
        return this._refreshToken;
    }

    /**
     * @summary Get user proeprty 
     * @remarks If this property returns null you can populate it by calling await getUser()
     */
    get user() {
        return this._user;
    }
    
    /**
     * @summary Get user proeprty 
     * @remarks If this property returns null you can populate it by calling await getUser()
     */
    get application() {
        return this._application;
    }
    
    /**
     * @summary Get user proeprty 
     * @remarks If this property returns null you can populate it by calling await getUser()
     */
    get grant() {
        return this._grants;
    }

    /**
     * @method
     * @summary Gets the user that this session belongs to
     * @type {User}
     */
    async loadUser() {
        if(!this._user)
            this._user = await uhc.Repositories.userRepository.get(this.userId);
        return this._user;
    }

    /**
     * @method
     * @summary Get the application this session was granted to
     * @type {Application}
     */
    async loadApplication() {
        if(!this._application)
            this._application = await uhc.Repositories.applicationRepository.get(this.applicationId);
        return this._application;
    }

    /**
     * @method
     * @summary Gets (or computes) the grants on this session
     * @type {*}
     */
    async loadGrants() {

        if(!this._grants) {
            this._grants = {};

            // Fetch from the user and application objects
            var usrPerms = await uhc.Repositories.permissionRepository.getUserPermission(this.userId);
            for(var p in usrPerms)
                this._grants[usrPerms[p].name] = usrPerms[p].grant;
            
            var appPerms = await uhc.Repositories.permissionRepository.getApplicationPermission(this.applicationId);
            for(var p in appPerms) {
                var gp = this._grants[appPerms[p].name];
                if(gp)
                    this._grants[appPerms[p].name] &= appPerms[p].grant;
            }

            // Now we XRef with scope
            if(this.audience && this.audience != "*") {
                var scopedParms = {};
                this.audience.split(' ').forEach((a) => { 
                    var splt = a.split(':');
                    var aprm = security.PermissionType[splt[0].toUpperCase()];
                    scopedParms[splt[1]] = (scopedParms[splt[1]] | 0) | aprm | (this._grants[splt[1]] & security.PermissionType.OWNER);
                });

                // Now and 
                Object.keys(this._grants).forEach((k) => {
                    this._grants[k] &= (scopedParms[k] | 0)
                });
            }
        }
        return this._grants;

    }

    /**
     * @method
     * @summary Represent this class as JSON
     */
    toJSON() {
        return this.stripHiddenFields();
    }
}
