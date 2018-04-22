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
 * This file contains implementation of user wallet function
 * 
 */

 
const uhc = require('../uhc'),
    exception = require('../exception'),
    security = require('../security');

/**
 * @class
 * @summary Represents a contract in the system
 */
class ContractApiResource {

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
            "permission_group": "contract",
            "routes" : [
                {
                    "path" : "user/:uid/wallet/contract",
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method" : this.post
                    },
                    "get" : {
                        "demand": security.PermissionType.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path":"user/:uid/wallet/contract/:ctid",
                    "get" :{
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "put" :{
                        "demand": security.PermissionType.WRITE,
                        "method": this.put
                    },
                    "delete" : {
                        "demand": security.PermissionType.WRITE,
                        "method": this.delete
                    }
                }
            ]
        };
    }
    /**
     * @method
     * @summary Posts a new cotract to the wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     */
    async post(req, res)  {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all contracts in a particular user's wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    async getAll(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single contract posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Updates a contract details
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async put(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Cancels a contract that is active. 
     * @description This method is used to cancel a contract control, for example if there is a contract to withdraw 10 coins per month on the wallet then this method would cancel that 
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async delete(req, res) {
        throw new exception.NotImplementedException();
    }
}

// Module exports
module.exports.ContractApiResource = ContractApiResource;