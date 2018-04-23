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
 
const uhc = require('../uhc'),
    exception = require('../exception'),
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
    async post(req, res)  {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all transactions in a particular user's wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    async getAll(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single transaction posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }

}

// Module exports
module.exports.WalletApiResource = WalletApiResource;