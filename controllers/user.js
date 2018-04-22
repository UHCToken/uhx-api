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
 * This file contains implementation of the core /user resources on the API
 * 
 */

const uhc = require('../uhc'),
    exception = require('../exception'),
    security = require('../security');

/**
 * @class
 * @summary Represents a user payment service
 */
class UserApiResource {

    /**
     * @constructor
     */
    constructor() {

    }
    /**
     * @method
     * @summary Get routing information for this class
     */
    get routes() {
        return {
            "permission_group": "users",
            "routes" : [
                {
                    "path" : "user",
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method" : this.post
                    },
                    "get": {
                        "demand" : security.PermissionType.LIST,
                        "method" : this.getAll
                    }
                },
                {
                    "path":"user/:uid",
                    "get" :{
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "put" : {
                        "demand": security.PermissionType.WRITE,
                        "method": this.put
                    },
                    "delete" : {
                        "demand":security.PermissionType.WRITE,
                        "method": this.delete
                    }
                }
            ]
        };
    }
    /**
     * @method
     * @summary Creates a new user
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     */
    async post(req, res)  {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Updates an existing user
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    async put(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single user 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all users from the UHC database (optional search parameters)
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async getAll(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Deactivate a user account from the UHC database
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async delete(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * 
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async acl(principal, req, res) {

        if(!(principal instanceof security.Principal)) {
            console.error("ACL requires a security principal to be passed");
            return false;
        }

        // if the token has OWNER set for USER permission then this user must be SELF
        return (principal.grant.user & security.PermissionType.OWNER && req.params.uid == principal.sub) // the permission on the principal is for OWNER only
                ^ !(principal.grant.user & security.PermissionType.OWNER); // XOR the owner grant flag is not set.
                
    }
}

// Module exports
module.exports.UserApiResource = UserApiResource;