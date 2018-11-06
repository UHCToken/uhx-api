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
    Purchase = require("../model/Purchase");

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
                    "path":"purchase/method",
                    "get": {
                        "demand": null,
                        "method": this.getPaymentMethod
                    }
                },
                {
                    "path": "purchase",
                    "get": {
                        "demand" : security.PermissionType.LIST,
                        "method" : this.getAll
                    },
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method": this.post
                    }
                },
                {
                    "path": "purchase/:pid",
                    "get" : {
                        "demand": security.PermissionType.READ,
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
     * @swagger
     * /user/{userId}/purchase:
     *  post:
     *      tags:
     *      - "purchase"
     *      summary: Posts a new purchase request to the API
     *      description: Posts a new purchase request to the API, a purchase request can be executed immediately or sometime in the future and may or may not be completed successfully
     *      produces:
     *      - "application/json"
     *      consumes:
     *      - "application/json"
     *      parameters:
     *      - name: "userId"
     *        in: "path"
     *        required: "true"
     *        type: "string"
     *        description: "The user which is buying or purchasing"
     *      - name: "body"
     *        in: "body"
     *        required: "true"
     *        description: "The purchase request being made"
     *        schema: 
     *          $ref: "#/definitions/Purchase"
     *      responses:
     *          201: 
     *              description: "The purchase request was successfully created"
     *              schema: 
     *                  $ref: "#/definitions/Purchase"
     *          207: 
     *              description: "The purchase request was recorded, however the transaction failed"
     *              schema:
     *                  $ref: "#/definitions/Purchase"
     *          422:
     *              description: "The purchase request failed due to a business rule being violated"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *          500: 
     *              description: "The purchase request failed due to an internal server error"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - write:purchase
     */
    async post(req, res)  {
        if(!req.body.assetId)
            throw new exception.ArgumentException("assetId missing");
        else if(!req.body.quantity)
            throw new exception.ArgumentException("quantity missing");

        var status;

        req.body.buyerId = req.params.uid;
        var purchase = await uhx.TokenLogic.createPurchase(new Purchase().copy(req.body), req.principal);
        purchase.forEach(o=>{
            if(o.payor)
                o._payor = o.payor.summary();
            if(o.payee)
                o._payee = o.payee.summary();
            if(o.buyer)
                o._buyer = o.buyer.summary();
            if(o.memo == "ERR_NSF"){
                status = 500;
                purchase = new exception.Exception("Insufficient funds for this purchase.", exception.ErrorCodes.INSUFFICIENT_FUNDS);
            }
        })

        if (!status)
            status = 201;

        res.status(status)
            .set("Location", `${uhx.Config.api.scheme}://${uhx.Config.api.host}:${uhx.Config.api.port}${uhx.Config.api.base}/user/${req.params.uid}/purchase/${purchase.id}`)
            .json(purchase);
        return true;
    }
    /**
     * @method
     * @summary Get all payments posted to a particular user's account
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /user/{userId}/purchase:
     *  get:
     *      tags:
     *      - "purchase"
     *      summary: Gets the purchases transacted by the specified user
     *      description: Gets all purchases of UH* assets made by the specified user
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userId"
     *        in: "path"
     *        required: "true"
     *        type: "string"
     *        description: "The user for which the query should be executed"
     *      - name: "dateFrom"
     *        in: "query"
     *        required: "true"
     *        type: "date"
     *        description: "The lower date of purchases made"
     *      - name: "dateTo"
     *        in: "query"
     *        required: "true"
     *        type: "date"
     *        description: "The upper date of purchases made"
     *      responses:
     *          200: 
     *              description: "The query executed successfully, results in the body"
     *              schema: 
     *                  $ref: "#/definitions/Purchase"
     *          500: 
     *              description: "The query failed due to an internal server error"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - list:purchase
     */
    async getAll(req, res) {
        // Remember to filter on UID
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single payment posted to a user's account
     * @param {Express.Request} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/{userId}/purchase/{id}:
     *  get:
     *      tags:
     *      - "purchase"
     *      summary: Gets the purchases transacted by the specified user
     *      description: Gets a specific purchase for the user
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userId"
     *        in: "path"
     *        required: "true"
     *        type: "string"
     *        description: "The user for which the query should be executed"
     *      - name: "id"
     *        in: "path"
     *        required: "true"
     *        type: "string"
     *        description: "The identifier of the purchase"
     *      responses:
     *          200: 
     *              description: "The query executed successfully, results in the body"
     *              schema: 
     *                  $ref: "#/definitions/Purchase"
     *          500: 
     *              description: "The query failed due to an internal server error"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - get:purchase
     */
    async get(req, res) {
        // Remember to filter on UID
        throw new exception.NotImplementedException();
    }

    /**
     * @method
     * @summary Get the payment methods allowed on this service
     * @param {Express.Request} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /purchase/method:
     *  get:
     *      tags:
     *      - "purchase"
     *      summary: Gets the methods of payment accepted by this service
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *              description: "The query executed successfully, results in the body"
     *              schema: 
     *                  properties:
     *                      name: 
     *                          description: The english name of the payment method
     *                          type: string
     *                      network: 
     *                          description: A system identifier for the payment method
     *                          type: string
     *                      description: 
     *                          description: A full description of the payment method
     *                          type: string
     *                      note: 
     *                          description: A descriptive note for user's transacting with this currency
     *                          type: string
     *                      currency: 
     *                          description: The currency code of the payment method
     *                          type: string
     *          500: 
     *              description: "The query failed due to an internal server error"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     * 
     */
    async getPaymentMethod(req, res) {
        res.status(200).json([
            {
                "name": "Stellar Lumens",
                "network": "Stellar",
                "description": "Pay with Lumens",
                "note": "Your UHX account must contain 2 XLM for transaction processing, if you use this option you should transfer an extra 2 XLM to your account",
                "currency": "XLM"
            },
            {
                "name": "Ether",
                "network": "Ethereum",
                "description": "Pay with Ether",
                "note": "You must transfer a desired amount of ETH to the ethereum account associated with your user account",
                "currency": "ETH"
            }
        ]);
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

// Module exports
module.exports.PurchaseApiResource = PurchaseApiResource;