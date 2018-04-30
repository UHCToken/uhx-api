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
class PurchaseApiResource {

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
            "permission_group": "purchase",
            "routes" : [
                {
                    "path" : "user/:uid/purchase",
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
                    "path":"user/:uid/purchase/:pid",
                    "get" :{
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    }
                },
                {
                    "path":"paymentMethod",
                    "get": {
                        "demand": null,
                        "method": this.getPaymentProvider
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
    async post(req, res)  {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all payments posted to a particular user's account
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    async getAll(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single payment posted to a user's account
     * @param {Express.Request} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }

    /**
     * @method
     * @summary Get the payment methods allowed on this service
     * @param {Express.Request} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async getPaymentProvider(req, res) {
        res.status(200).json([
            {
                "name": "Credit Card",
                "note": "2 XLM fee (market rate) and a 2.5% processing fee applies",
                "type": "CreditCard",
                "description": "Pay with credit card",
                "currency": "USD"
            },
            {
                "name": "Stellar Lumens",
                "type": "StellarLumen",
                "description": "Pay with Lumens",
                "note": "Your UHX account must contain 2 XLM for transaction processing, if you use this option you should transfer an extra 2 XLM to your account",
                "currency": "XLM"
            }
        ]);
        return true;
    }
}

// Module exports
module.exports.PurchaseApiResource = PurchaseApiResource;