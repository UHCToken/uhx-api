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
 * @summary Represents a contract in the system
 * @swagger
 * tags:
 *  - name: "contract"
 *    description: "The contract resource is used to coordinate agreements between two parties in UHC (requests for payment, escrow agreements, recurring transfers, etc.)"
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
     * @swagger
     * /user/{userid}/wallet/contract:
     *  post:
     *      tags:
     *      - "contract"
     *      summary: "Creates a new contract agreement on the UHC API"
     *      description: "This method will save the provided contract and will perform the necessary operations on the blockchain to setup the contract template. Note that {userid} is the originator of the contract"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user who is the originator of the contract"
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "body"
     *        description: "The details of the contract to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Contract"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Contract"
     *          422:
     *              description: "The user object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "write:contract"
     */
    async post(req, res)  {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get all contracts in a particular user's wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /user/{userid}/wallet/contract:
     *  get:
     *      tags:
     *      - "contract"
     *      summary: "Gets all contracts which the specified {userid} is a party to"
     *      description: "This method will retrieve all active (and even deactivated) contracts associated with the specified user account."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user for which contracts are to be fetched"
     *        required: true
     *        type: string
     *      - in: "query"
     *        name: "dateFrom"
     *        description: "The lower limit of the date to filter on"
     *        required: false
     *        type: Date
     *      - in: "query"
     *        name: "dateTo"
     *        description: "The upper limit of the date to filter on"
     *        required: false
     *        type: Date
     *      - in: "query"
     *        name: "_offset"
     *        description: "The offset to begin fetching for"
     *        required: false
     *        type: number
     *      - in: "query"
     *        name: "_count"
     *        description: "The number of contracts to fetch"
     *        required: false
     *        type: number
     *      - in: "query"
     *        name: "_all"
     *        description: "When true indicates that the API should return all contracts (even those that are cancelled)"
     *        required: false
     *        type: boolean
     *      responses:
     *          200: 
     *             description: "The query was executed successfully, the response contains the matching contracts"
     *             schema: 
     *                  $ref: "#/definitions/Contract"
     *          404:
     *              description: "The user doesn't exist, or doesn't have an active wallet"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "list:contract"
     */
    async getAll(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single contract posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/{userid}/wallet/contract/{contractid}:
     *  get:
     *      tags:
     *      - "contract"
     *      summary: "Gets the specified contract from the API"
     *      description: "This method will fetch the specified contract if the user specified is party to that contract"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user who is the originator of the contract"
     *        required: true
     *        type: string
     *      - in: "path"
     *        name: "contractid"
     *        description: "The identifier for the contract to retrieve"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The requested resource was retrieved successfully"
     *             schema: 
     *                  $ref: "#/definitions/Contract"
     *          404:
     *              description: "The requested user cannot be found, the user doesn't have an active wallet, or the contract does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "read:contract"
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Updates a contract details
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /user/{userid}/wallet/contract/{contractid}:
     *  put:
     *      tags:
     *      - "contract"
     *      summary: "Updates the specified contract"
     *      description: "Updates detailes of the specified contract. Note that only agreement and status can be changed on this resource, any attempt to change other properties will result in either a 422 error or will be ignored"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user who is the target of the contract"
     *        required: true
     *        type: string
     *      - in: "path"
     *        name: "contractid"
     *        description: "The identity of the contract to be updated"
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "body"
     *        description: "The details of the contract to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Contract"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/Contract"
     *          404:
     *              description: "The user object does not exist, the user does not have an active wallet, or the contract requested does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          410:
     *              description: "The contract for which the update is being requested has already be cancelled"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The user object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "write:contract"
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
     * @swagger
     * /user/{userid}/wallet/contract/{contractid}:
     *  delete:
     *      tags:
     *      - "contract"
     *      summary: "Cancels the specified contract"
     *      description: "This method will cancel a contract that has been created. Note that cancellation can be performed by either the originator or the target"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user who is the target of the contract"
     *        required: true
     *        type: string
     *      - in: "path"
     *        name: "contractid"
     *        description: "The identity of the contract to be updated"
     *        required: true
     *        type: string
     *      responses:
     *          201: 
     *             description: "The requested resource was canceled successfully"
     *             schema: 
     *                  $ref: "#/definitions/Contract"
     *          404:
     *              description: "The user object does not exist, the user does not have an active wallet, or the contract requested does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          410:
     *              description: "The contract for which the update is being requested has already be cancelled"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "Cancellation request cannot be performed (perhaps due to constraints on the contract itself)"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "write:contract"
     */
    async delete(req, res) {
        throw new exception.NotImplementedException();
    }
}

// Module exports
module.exports.ContractApiResource = ContractApiResource;