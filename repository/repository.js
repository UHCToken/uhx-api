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

const UserRepository = require('./userRepository'),
    ApplicationRepository = require("./applicationRepository"),
    SessionRepository = require('./sessionRepository'),
    PermissionRepository = require('./permissionRepository');

/**
 * @class
 * @summary Represents UHC's database repositories
 */
class UhcRepositories {

    /**
     * @constructor
     * @summary Creates a new repositories collection with the specified connection data
     * @param {String} connectionString The path to the database on which the repositories should be accessed
     */
    constructor(connectionString) {
        this.connectionString = connectionString;
    }

    /**
     * @property
     * @summary Gets the user repository
     * @type {UserRepository}
     */
    get userRepository() {
        if(!this._userRepository)
            this._userRepository = new UserRepository(this.connectionString);
        return this._userRepository;
    }

    /**
     * @property
     * @summary Gets the application repository
     * @type {ApplicationRepository}
     */
    get applicationRepository() {
        if(!this._applicationRepository)
            this._applicationRepository = new ApplicationRepository(this.connectionString);
        return this._applicationRepository;
    }

    /**
     * @property
     * @summary Gets the session repository
     * @type {SessionRepository}
     */
    get sessionRepository() {
        if(!this._sessionRepository)
            this._sessionRepository = new SessionRepository(this.connectionString);
        return this._sessionRepository;
    }

    /**
     * @property 
     * @summary Get the permission repository
     * @type {PermissionRepository}
     */
    get permissionRepository() {
        if(!this._permissionRepository)
            this._permissionRepository = new PermissionRepository(this.connectionString);
        return this._permissionRepository;
    }
}

module.exports.UhcRepositories = UhcRepositories;