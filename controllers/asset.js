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
    security = require('../security'),
    exception = require('../exception'),
    Asset = require('../model/Asset');

  /**
   * @class
   * @summary Represents a resource to fetch assets
   * @swagger
   * tags:
   *    - name: asset
   *      description: A resource to fetch user blockchain asset (token types) information from the UHC API
   */
module.exports.AssetApiResource = class AssetApiResource {

    /**
     * @property
     * @summary Returns the routes to the API controller
     */
    get routes() {
        return {
            permission_group: "asset",
            routes: [
                {
                    "path": "asset",
                    "get": {
                        demand: null,
                        method: this.getAll
                    }, 
                    "post" : {
                        demand: security.PermissionType.WRITE,
                        method: this.post
                    }
                },
                {
                    "path":"asset/quote",
                    "post": {
                        demand: null, 
                        method: this.quote
                    }
                },
                {
                    "path":"asset/:id",
                    "get": {
                        demand: null, 
                        method: this.get
                    },
                    "lock": {
                        demand: security.PermissionType.EXECUTE | security.PermissionType.WRITE,
                        method: this.lock
                    },
                    "unlock": {
                        demand: security.PermissionType.EXECUTE | security.PermissionType.WRITE,
                        method: this.unlock
                    },
                    "put": {
                        demand: security.PermissionType.WRITE,
                        method: this.put
                    }
                },
                {
                    "path":"asset/:id/offer",
                    "get": {
                        demand: null, 
                        method: this.getOffer
                    }
                }
            ]
        }
    }

    /**
     * @method
     * @summary Executes a post (create) asset function.
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /asset:
     *  post:
    *      tags:
     *      - "asset"
     *      summary: "Creates a new asset type with the specified asset"
     *      description: "This method will create the distribution account, supply account (which will pay out specific amounts of tokens at specific times)"
     *      consumes:
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The asset being created"
     *        required: true
     *        schema:
     *          properties:
     *              asset:
     *                  $ref: "#/definitions/Asset"
     *                  description: "The asset being created including metadata about that asset"
     *              supply:
     *                  type: number
     *                  description: The total number of tokens which should be available, null if the token supply can be grown
     *              fixed:
     *                  type: boolean
     *                  description: When true, indicates that the supply of tokens is fixed
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Asset"
     *          422:
     *              description: "The creation request violated a business rule"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - write:asset
     */
    async post(req, res) {

        // verify body 
        if(!req.body)
            throw new exception.ArgumentException("body");
        if(!req.body.asset)
            throw new exception.ArgumentException("body.asset");

        // Create a new asset
        var asset = await uhc.TokenLogic.createAsset(new Asset().copy(req.body.asset), req.body.supply, req.body.fixed, req.principal);
        res.status(201)
            .set("Location", `${uhc.Config.api.scheme}://${uhc.Config.api.host}:${uhc.Config.api.port}${uhc.Config.api.base}/asset/${asset.id}`)
            .json(asset);
        return true;
    }

    /**
     * @method
     * @summary Gets the active offer for purchasing the coin
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async getOffer(req, res) {
        var activeOffer = await uhc.Repositories.assetRepository.getActiveOffer(req.params.id);
        if(!activeOffer)
            throw new exception.NotFoundException("offer", "__current");
        res.status(200).json(activeOffer);
        return true;
    }

    /**
     * @method
     * @summary Executes a lock asset which prevents the asset from being bought or sold
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async lock(req, res) {

    }

    /**
     * @method
     * @summary Executes an unlock asset which enables the asset to be bought or sold
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async unlock(req, res) {

    }

    /**
     * @method
     * @summary Updates the specified asset
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async put(req, res) {

    }
    
    /**
     * @method
     * @summary Gets a single asset type from the database
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /asset/{assetId}:
     *  get:
     *      tags:
     *      - "asset"
     *      summary: "Gets the specified asset with specified assetId"
     *      description: "This method will retrieve detailed information about the specified asset identifier"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "assetId"
     *        description: "The identity of the asset"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The requested resource was retrieved successfully"
     *             schema: 
     *                  $ref: "#/definitions/Asset"
     *          404:
     *              description: "The specified asset does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     */
    async get(req, res) {
        var asset = await uhc.Repositories.assetRepository.get(req.params.id);
        await asset.loadOffers();
        await asset.loadDistributorWallet();
        res.status(200).json(asset);
        return true;
    }

    /**
     * @method
     * @summary Queries for asset types on the server
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /asset:
     *  get:
     *      tags:
     *      - "asset"
     *      summary: "Gets all  assets from the server"
     *      description: "This method will return a collection of assets this API can work with"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was retrieved successfully"
     *             schema: 
     *                  $ref: "#/definitions/Asset"
     *          404:
     *              description: "The specified asset does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     */
    async getAll(req, res) {

        var assetFilter = new Asset().copy({
            code: req.query.code,
            type: req.query.type,
            deactivationTime: req.query("_all") == "true" ? null : "null"
        });
        res.status(200).json(await uhc.Repositories.assetRepository.query(assetFilter, req.query._offset, req.query._count));
        return true;

    }
    
    /**
     * @method
     * @summary Retrieves a quote for the specified asset
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /asset/quote:
     *  post:
     *      tags:
     *      - "asset"
     *      summary: "Retrieves a market rate quote from the API"
     *      description: "This method will return an exchange rate (market rate) between two asset classes"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "query"
     *        name: "from"
     *        description: "The code of the asset which is the buying asset"
     *        required: false
     *        type: string
     *      - in: "query"
     *        name: "to"
     *        description: "The type of the asset which is being bought"
     *        required: false
     *        type: string
     *      responses:
     *          200: 
     *             description: "The requested resource was retrieved successfully"
     *             schema: 
     *                  properties:
     *                      from: 
     *                          description: "The asset code which is the buying asset"
     *                          type: "string"
     *                      to: 
     *                          description: "The asset code which is being bought"
     *                          type: "string"
     *                      buy: 
     *                          description: "The buy rate of exchange being offered"
     *                          type: "number"
     *                      sell: 
     *                          description: "The sell rate of exchange being offered"
     *                          type: "number"
     *                      source: 
     *                          description: "Where the quote was obtained"
     *                          type: "string"
      *                      path: 
     *                          description: "If a path was obtained to get the quote (i.e. from USD to UHX quote may be: USD > XLM > UHX)"
     *                          type: "string"
    *          404:
     *              description: "The specified asset does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     */
    async quote(req, res) {

        if(!req.query.from)
            throw new exception.ArgumentException("from");
        if(!req.query.to)
            throw new exception.ArgumentException("to");
        
        throw new exception.NotImplementedException();

    }
}