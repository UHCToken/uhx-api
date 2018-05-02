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
                        demand: security.Permission.WRITE,
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
                }
            ]
        }
    }

    async post(req, res) {

    }

    async lock(req, res) {

    }

    async unlock(req, res) {

    }

    async put(req, res) {

    }
    
    /**
     * @method
     * @summary Gets a single asset type from the database
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async get(req, res) {
        var asset = await uhc.Repositories.assetRepository.get(req.params.id);
        res.status(200).json(asset);
        return true;
    }

    /**
     * @method
     * @summary Queries for asset types on the server
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async getAll(req, res) {

        var assetFilter = new Asset().copy({
            code: req.param("code"),
            type: req.param("type"),
            deactivationTime: req.param("_all") == "true" ? null : "null"
        });
        res.status(200).json(await uhc.Repositories.assetRepository.query(assetFilter, req.param("_offset"), req.param("_count")));
        return true;
        
    }
    
    /**
     * @method
     * @summary Retrieves a quote for the specified asset
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async quote(req, res) {

        if(!req.param("from"))
            throw new exception.ArgumentException("from");
        if(!req.param("to"))
            throw new exception.ArgumentException("to");
        
        throw new exception.NotImplementedException();

    }
}