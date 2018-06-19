
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
    Transaction = require('../model/Transaction'),
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
                        "demand" : security.PermissionType.WRITE | security.PermissionType.EXECUTE,
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
                },
                {
                    "path":"transaction",
                    "post": {
                        "demand": security.PermissionType.WRITE | security.PermissionType.EXECUTE,
                        "method": this.post
                    },
                    "get": {
                        "demand": security.PermissionType.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path": "transaction/:txid",
                    "get": {
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
     *      - uhx_auth:
     *          - "read:transaction"
     */
    async get(req, res) {
        
        var txInfo = await uhx.TokenLogic.getTransaction(req.params.txid, req.principal);
        res.status(200).json(txInfo);
        return true;
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
     *      - uhx_auth:
     *          - "list:transaction"
     * /transaction:
     *  get:
     *      tags:
     *      - "transaction"
     *      summary: "Gets all transactions posted matching the filter parameter"
     *      description: "This method will request the server to produce a complete list of transactions. When payorId or payeeId are specified the blockchain is used to fetch records, when these fields are missing only locally registered transactions are returned"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "payorId"
     *        in: "query"
     *        description: "The ID of the wallet or user which paid the transaction cost"
     *        required: false
     *        type: "string"
     *      - name: "payeeId"
     *        in: "query"
     *        description: "The ID of the wallet or user which was paid the transaction cost"
     *        required: false
     *        type: "string"
     *      - in: "query"
     *        name: "asset"
     *        description: "The code of the asset to query"
     *        required: false
     *        type: string
     *      - in: "query"
     *        name: "_count"
     *        description: "Limit the number of results to the provided number"
     *        required: false
     *        type: number
     *      - in: "query"
     *        name: "_offset"
     *        description: "The offset of the first result"
     *        required: false
     *        type: number
     *      - in: "query"
     *        name: "_localOnly"
     *        description: "When true, indicates the query should be done against the local api database only not the blockchain"
     *        required: false
     *        type: boolean
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
     *      - uhx_auth:
     *          - "list:transaction"
     */
    async getAll(req, res) {
        var transactions = await uhx.TokenLogic.getTransactionHistory(req.params.uid, req.query, req.principal);

        // Minify user information
        transactions = transactions.map((t)=> {
            if(t._payor)
                t._payor = t._payor.summary();
                if(req.params.uid === t.payor.id)
                    t.fee = 100;
                else if(req.params.uid === t.buyerId && t._payor.id === t.buyerId)
                    t.fee = 200;
            if(t._payee) 
                try { t._payee = t._payee.summary(); }
                catch(e){}
            if(t._buyer)
                t._buyer = t._buyer.summary();
            if(t._asset)
                t._asset = t._asset.summary();
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
     *      - uhx_auth:
     *          - "write:transaction"
     * /transaction:
     *  post:
     *      tags:
     *      - "transaction"
     *      summary: "Posts a new transaction for general processing"
     *      description: "This method will request that a transaction be posted to the UhX API for further processing"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
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
     *          202: 
     *              description: "The request was performed however some of the transaction batch failed, or have not yet completed"
     *              schema: 
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
     *      - uhx_auth:
     *          - "write:transaction"
     */
    async post(req, res) {
        
        if(!req.body)
            throw new exception.ArgumentException("body missing");

        if(!Array.isArray(req.body))
            req.body = [req.body];
        
        var transactions = await uhx.TokenLogic.createTransaction(req.body.map(o=>new Transaction().copy(o)), req.principal);

        var status = transactions.find(o=>o.state != 2) ? 400 : 201;
        res.status(status).json(transactions);

        return true;
    }

    /**
     * @method
     * @summary Determines additional access control on the user resource
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @returns {boolean} An indicator of whether the user has access to the resource
     */
    async acl(principal, req, res) {

        if(!(principal instanceof security.Principal)) {
            uhx.log.error("ACL requires a security principal to be passed");
            return false;
        }

        // if the token has OWNER set for USER permission then this user must be SELF
        return (principal.grant.user & security.PermissionType.OWNER && req.params.uid == principal.session.userId) // the permission on the principal is for OWNER only
                ^ !(principal.grant.user & security.PermissionType.OWNER); // XOR the owner grant flag is not set.
                
    }
}

module.exports.TransactionApiResource = TransactionApiResource;