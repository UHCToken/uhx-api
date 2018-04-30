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

 module.exports.Config = require('./config');
 const uhc = require('./uhc'),
    exception = require('./exception'),
    crypto = require('crypto'),
    model = require('./model/model');

 
/**
 * @namespace Security
 */
 /**
  * @enum UHC Permissions
  * @description Permissions
  */
 const PermissionType = {
    EXECUTE : 1,
    READ : 2,
    WRITE : 4,
    RWX : 7,
    LIST: 8,
    OWNER : 16 // When this flag is present, the permission only applies to the owner For example READ | OWNER means that the user can READ only if they are also the OWNER of that resource
}

 /**
  * @class
  * @summary Represents a security exception
  */
 class SecurityException extends exception.Exception {

    /**
     * @constructor
     * @param {Permission} failedPermission Represents the permission group [0] and permission demanded that failed
     */
    constructor(failedPermission) {
        super(`Security violation: ${failedPermission.permission} ${failedPermission.object}`, exception.ErrorCodes.SECURITY_ERROR);
        this._permission = failedPermission;
        this.toJSON = this.toJSON.bind(this);
    }

    /**
     * @property
     * @summary Get the object (wallet, user, etc.) for the permission
     */
    get object() {
        return this._permission.object;
    }

    /**
     * @property
     * @summary Get the permission (read, write, etc.) that failed
     */
    get permission() {
        return this._permission.permission;
    }

    /**
     * @method
     * @summary Represent object as JSON
     */
    toJSON() {
        return {
            message:this._message,
            code:this._code,
            object: this.object,
            permission: this.permission,
            cause:this._cause
        };
    }
 }

 /**
  * @class 
  * @property Represents a specific permission that can be demanded
  */
 class Permission {

    /**
     * @constructor
     * @param {string} object The name of the object that is being demanded
     * @param {PermissionType} permissionType The type of permission being demanded
     */
    constructor(object, permissionType) {
        this._object = object;
        this._permissionType = permissionType;
        this.demand = this.demand.bind(this);
    }

        /**
     * @property
     * @summary Gets the object that the particular security demand was attempting to access
     * @type {string}
     */
    get object() {
        return this._object;
    }

    /**
     * @property
     * @summary Gets the permission that was demanded
     * @type {string} The permission demanded
     */
    get permission() {
        var permission = [];
        if(this._permissionType & PermissionType.READ) 
            permission.push("read");
        if(this._permissionType & PermissionType.WRITE)
            permission.push("write");
        if(this._permissionType & PermissionType.EXECUTE)
            permission.push("execute");
        if(this._permissionType & PermissionType.LIST)
            permission.push("list");
        if(this._permissionType & PermissionType.OWNER)
            permission.push("owner");
        return permission.join(";");
    }

    /**
     * @method
     * @summary Demands the permission
     * @param {SecurityPrincipal} claimPrincipal The current principal for demanding permission. This should be a claims based principal instance like JWT token
     */
    demand(claimPrincipal) {
        
        if(!(claimPrincipal instanceof SecurityPrincipal))
            throw new exception.Exception("Parameter claimPrincipal expects instance of Principal", exception.ErrorCodes.ARGUMENT_EXCEPTION);
        else if(!claimPrincipal.isAuthenticated)
            throw new exception.Exception("Demand was made of an unauthenticated principal", exception.ErrorCodes.SECURITY_ERROR);
            
        var grantedAccess = claimPrincipal.grant[this._object];

        if(!(grantedAccess & this._permissionType))
            throw new SecurityException(this);

        return true;
    }

 }

 /**
  * @class
  * @summary The security principal class represents a single authenticated or non-authenticated security principal with a series of claims
  */
 class SecurityPrincipal {

    /**
     * 
     * @param {data.User} user The instace of the user or session from the database
     */
    constructor(sessionOrUser) {
        // "private" members
        var _isAuthenticated = sessionOrUser instanceof model.Session;

        var user = null, session = null;
        if(sessionOrUser instanceof model.User) {
            user = sessionOrUser;
            session = { application: null };
        }
        else if(sessionOrUser instanceof model.Application) // application principal
        {
            user = {};
            session = { 
                application: sessionOrUser, 
                applicationId: sessionOrUser.id, 
                notBefore: new Date(),
                notAfter: new Date(new Date().getTime() + uhc.Config.security.sessionLength),
                grant: sessionOrUser._grants,
                loadApplication: async () => { } };
        }
        else {
            session = sessionOrUser;
            user = session.user;
        }

        // "public" members
        this._user = user;
        this._claims = {
            mail: user.email,
            telephoneNumber: user.tel,
            displayName: user.givenName || user.email
        };

        this._session = session;

        this.getAuthenticated = function() { return _isAuthenticated; }

    }

    /**
     * @property
     * @summary Gets whether the user represeneted in this principal is authenticated
     * @type {boolean}
     */
    get isAuthenticated() { return this.getAuthenticated() }

    /**
     * @property
     * @summary Gets the list of claims that this user has
     * @type {*}
     */
    get claims() { return this._claims; }
    
    /**
     * @property 
     * @summary Get the user information related to the user
     * @type {data.User} 
     */
    get user() { return this._user; }

    /**
     * @property 
     * @summary Get the session associated with the session
     * @type {Session}
     */
    get session(){ return this._session; }

    /**
     * @property
     * @summary Get the grant
     * @type List of grants
     */
    get grant() { return this._session.grant; }

    /**
     * Represent this as a token 
     */
    toJSON() {
        var retVal = {};
        
        for(var k in this.claims)
            retVal[k] = this.claims[k];

        retVal.sub = this._session.userId || this._session.applicationId;
        retVal.app = this._session.applicationId;
        retVal.iat = Math.floor(this._session.notBefore.getTime() / 1000);
        retVal.nbf = Math.floor(this._session.notBefore.getTime() / 1000);
        retVal.exp = Math.floor(this._session.notAfter.getTime() / 1000);
        retVal.jti = this._session.id;
        retVal.grant = this._session.grant;

        // Scopes = Grant translated to non bitmap for other users
        retVal.scope = [];
        Object.keys(retVal.grant).forEach((g) => {
            Object.keys(PermissionType).forEach((pt) => {
                if(retVal.grant[g] & PermissionType[pt] && pt != "RWX" && pt != "OWNER")
                    retVal.scope.push(pt.toLowerCase() + ":" + g)
            });
        });

        return retVal;
    }
 }

 /**
  * @class
  * @summary Represents a principal that was constructed from a JWT token
  */
 class JwtPrincipal extends SecurityPrincipal {

    /**
     * @constructor
     * @summary Constructs a new principal from a JWT token
     * @param {*} jwtToken The JWT token data to be converted to a principal
     * @param {boolean} isAuthenticated True if the principal is authenticated
     */
    constructor(jwtToken, isAuthenticated) {
        if(!jwtToken.sub && !jwtToken.jti)
            throw new exception.Exception("JWT token must contain SUB or JTI indicator", exception.ErrorCodes.SECURITY_ERROR);

        // Load user from SUB or load session from JTI
        var session = new model.Session();
        session.applicationId = jwtToken.app;
        session.audience = jwtToken.aud;
        session.id = jwtToken.jti;
        session.notAfter = new Date(jwtToken.exp);
        session.notBefore = new Date(jwtToken.nbf);
        session.userId = jwtToken.sub;
        session.creationTime = new Date(jwtToken.iat);
        session._grants = jwtToken.grant;
        session._user = session._user || {}

        if(jwtToken.displayName) 
            session._user.name = jwtToken.displayName;
        if(jwtToken.mail)
            session._user.email = jwtToken.mail;
        if(jwtToken.telephone)
            session._user.tel = jwtToken.telephone;

        super(session, isAuthenticated);

    }
 }

 // Module exports
 module.exports.SecurityException = SecurityException;
 module.exports.PermissionType = PermissionType;
 module.exports.Permission = Permission;
 module.exports.Principal = SecurityPrincipal;
 module.exports.JwtPrincipal = JwtPrincipal;
