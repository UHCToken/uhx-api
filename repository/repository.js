'use strict';

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