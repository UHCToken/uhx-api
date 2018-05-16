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
 * @swagger
 * tags:
 *  - name: "transaction"
 *    description: "The transaction resource represents a single blockchain based (cryptocurrency) transaction from the blockchain"
 */
class TransactionApiResource {

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
            "permission_group": "transaction",
            "routes" : [
                {
                    "path" : "user/:uid/wallet/transaction",
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
                    "path":"user/:uid/wallet/transaction/:txid",
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
     * @summary Retrieves a specific transaction
     * @param {Express.Request} req The HTTP request made by the client
     * @param {Express.Response} res The HTTP response being sent back to the client
     * @swagger
     * /user/{userid}/wallet/transaction/{txid}:
     *  get:
     *      tags:
     *      - "transaction"
     *      summary: "Gets a specific transaction from the user's wallet"
     *      description: "This method will request the server to produce a detailed transaction result for a single transaction"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The ID of the user whose wallet this transaction should be posed to"
     *        required: true
     *        type: "string"
     *      - in: "path"
     *        name: "txid"
     *        description: "The identifier of the transaction to fetch"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The query completed successfully and the result is in the payload"
     *             schema: 
     *                  $ref: "#/definitions/Transaction"
     *          404:
     *              description: "The specified user cannot be found or the specified user does not have an active wallet, or the specified transaction could not be found on the user's wallet"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "read:transaction"
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }

    /**
     * @method
     * @summary Retrieves all transactions for the specified user's wallet
     * @param {Express.Request} req The HTTP request made by the client
     * @param {Express.Response} res The HTTP response being sent back to the client
     * @swagger
     * /user/{userid}/wallet/transaction:
     *  get:
     *      tags:
     *      - "transaction"
     *      summary: "Gets all transactions posted to the user's wallet"
     *      description: "This method will request the server to produce a complete list of transactions executed on the blockchain against the user's wallet"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The ID of the user whose wallet this transaction should be posed to"
     *        required: true
     *        type: "string"
     *      - in: "query"
     *        name: "asset"
     *        description: "The type of asset to filter"
     *        required: false
     *        type: string
     *      - in: "query"
     *        name: "_count"
     *        description: "Limit the number of results to the provided number"
     *        required: false
     *        type: number
     *      responses:
     *          200: 
     *             description: "The query completed successfully and the results are in the payload"
     *             schema: 
     *                  $ref: "#/definitions/Transaction"
     *          404:
     *              description: "The specified user cannot be found or the specified user does not have an active wallet"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "list:transaction"
     */
    async getAll(req, res) {
        var transactions = await uhc.TokenLogic.getTransactionHistory(req.params.uid, req.query, req.principal);

        // Minify user information
        transactions = transactions.map((t)=> {
            if(t.payee)
                t._payee = t.payee.summary();
            if(t.payor)
                t._payor = t.payor.summary();
            return t;
        });
        res.status(200).json(transactions);
        return true;
    }

    /**
     * @method
     * @summary Posts a new transaction to the user's wallet
     * @param {Express.Request} req The HTTP request made by the client
     * @param {Express.Response} res The HTTP response being sent back to the client
     * @swagger
     * /user/{userid}/wallet/transaction:
     *  post:
     *      tags:
     *      - "transaction"
     *      summary: "Posts a new transaction to the user's wallet"
     *      description: "This method will request that a transaction be posted to the user's wallet. Note: All requests to this resource require that the token presented be for the {userid} of this wallet. All other requests will fail. To request a payment from another user, use the /contract mechanism"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The ID of the user whose wallet this transaction should be posed to"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The transaction details"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Transaction"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Transaction"
     *          404:
     *              description: "The specified user cannot be found or the specified user does not have an active wallet"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The transaction object sent by the client was rejected due to a business rule violation"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "write:transaction"
     */
    async post(req, res) {
        throw new exception.NotImplementedException();
    }
}

module.exports.TransactionApiResource = TransactionApiResource;