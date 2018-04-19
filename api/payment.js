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
 * This file contains implementation of the UHC payment gateway
 * 
 */

const uhc = require('../uhc');

/**
 * @class
 * @summary Represents a user payment service
 */
class UserPaymentResource {

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
            "permission_group": "payment",
            "routes" : [
                {
                    "path" : "user/:uid/payment",
                    "post": {
                        "demand" : uhc.Permission.WRITE,
                        "method" : this.post
                    },
                    "get" : {
                        "demand":uhc.Permission.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path":"user/:uid/payment/:pid",
                    "get" :{
                        "demand": uhc.Permission.READ,
                        "method": this.get
                    }
                }
            ]
        };
    }
    /**
     * @method
     * @summary Posts a new payment to the system
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     */
    post(req, res)  {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all payments posted to a particular user's account
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    getAll(req, res) {
        throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single payment posted to a user's account
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    get(req, res) {
        throw new uhc.NotImplementedException();
    }

}

// Module exports
module.exports.UserPaymentResource = UserPaymentResource;