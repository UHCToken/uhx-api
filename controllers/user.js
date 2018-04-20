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

const uhc = require('../uhc');

/**
 * @class
 * @summary Represents a user payment service
 */
class UserResource {

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
                        "demand" : uhc.Permission.WRITE,
                        "method" : this.post
                    },
                    "get": {
                        "demand" : uhc.Permission.LIST,
                        "method" : this.getAll
                    }
                },
                {
                    "path":"user/:uid",
                    "get" :{
                        "demand": uhc.Permission.READ | uhc.Permission.SELF,
                        "method": this.get
                    },
                    "put" : {
                        "demand":uhc.Permission.WRITE | uhc.Permission.SELF,
                        "method": this.put
                    },
                    "delete" : {
                        "demand":uhc.Permission.WRITE,
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
    post(req, res)  {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Updates an existing user
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    put(req, res) {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single user 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    get(req, res) {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all users from the UHC database (optional search parameters)
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    getAll(req, res) {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Deactivate a user account from the UHC database
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    delete(req, res) {
        throw new uhc.NotImplementedException();
    }

}

// Module exports
module.exports.UserResource = UserResource;