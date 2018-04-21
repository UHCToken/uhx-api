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
    security = require('../security');

/**
 * @class
 * @summary Represents a user payment service
 */
class WalletApiResource {

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
            "permission_group": "wallet",
            "routes" : [
                {
                    "path" : "user/:uid/wallet",
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method" : this.post
                    },
                    "get" : {
                        "demand":security.PermissionType.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path":"user/:uid/wallet/:txid",
                    "get" :{
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    }
                }
            ]
        };
    }
    /**
     * @method
     * @summary Posts a new transaction to the wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     */
    post(req, res)  {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all transactions in a particular user's wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    getAll(req, res) {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single transaction posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    get(req, res) {
        throw new uhc.NotImplementedException();
    }

}

// Module exports
module.exports.WalletApiResource = WalletApiResource;