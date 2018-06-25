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

const uhx = require('../uhx'),
    exception = require('../exception'),
    security = require('../security'),
    invoiceRepository = require('../repository/invoiceRepository'),
    Invoice = require('../model/Invoice'),
    model = require('../model/model');

/**
 * @class
 * @summary Represents an echeck invoice resource
 * @swagger
 * tags:
 *  - name: "invoice"
 *    description: "A resource to create echeck invoice requests and look up invoice status"
 */
class InvoiceApiResource {

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
            "routes": [
                {
                    "path": "user/:uid/invoice",
                    "put": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.put
                    },
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getAll
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Posts a new echeck invoice request
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /user/{userid}/invoice:
     *  put:
     *      tags:
     *      - "invoice"
     *      summary: "Creates a new echeck invoice request for the user"
     *      description: "This method will create an echeck invoice for the user"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to create the invoice for"
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "body"
     *        description: "The amount of USD credit being purchased"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Invoice"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Invoice"
     *          422:
     *              description: "The user object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:wallet"
     */
    async put(req, res) {
        var not_implemented = {};
        not_implemented.status = "0"
        res.status(200).json(not_implemented);
        return true;
    }
    /**
     * @method
     * @summary Get invoices posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/{userid}/invoice:
     *  get:
     *      tags:
     *      - "invoice"
     *      summary: "Gets summary of invoices for the user's wallet"
     *      description: "This method will return summary of invoices for the user's wallet"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to find invoices for"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The user's invoice information"
     *             schema: 
     *                  $ref: "#/definitions/Invoices"
     *          404: 
     *             description: "The user does not have any pending or completed invoices"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:wallet"
     */
    async getAll(req, res) {
        var invoices = await uhx.Repositories.invoiceRepository.getAllForUser(req.params.uid);
        res.status(200).json(invoices);
        return true
    }


    async checkStatus(invoiceId){
        var greenMoneyBaseUrl = 'https://www.greenbyphone.com/eCheck.asmx/InvoiceStatus';

        // Promise 
        return new Promise((fulfill, reject) => {
            request(greenMoneyBaseUrl,
                function (err, res, body) {
                    var retVal = [];
                    if (err) {
                        uhx.log.error(`HTTP ERR: ${err}`)
                        retVal.push("fail");
                        reject(new exception.Exception("Error contacting GreenMoney API", exception.ErrorCodes.COM_FAILURE, err));
                    }
                    else if (res.statusCode == 200) {
                        retVal.push("success");
                        fulfill(retVal);
                    }
                })
        });
        return retVal;
    }
}

// Module exports
module.exports.InvoiceApiResource = InvoiceApiResource;
