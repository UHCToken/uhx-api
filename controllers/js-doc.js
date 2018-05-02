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

 const swagger = require('swagger-jsdoc'),
    uhc = require('../uhc'),
    security = require('../security');
 /**
  * @class
  * @summary Exporter for swagger metadata
  */
 class SwaggerMetadata {

    /**
     * @constructor
     * @summary Initializes the swagger metadata spec
     */
    constructor() {
        this._spec = swagger(uhc.Config.swagger);

        // Add security def
        this._spec.securityDefinitions = {
            "uhc_auth" : {
                type: "oauth2",
                flow: "password",
                tokenUrl: uhc.Config.security.tokenServiceUri
            },
            "app_auth" : {
                type: "oauth2",
                flow: "application",
                tokenUrl: uhc.Config.security.tokenServiceUri
            }
        };
        
        this.swagger = this.swagger.bind(this);
    }

    /**
     * @property
     * @summary Get the routing for this object
     */
    get routes() {
        return {
            "permission_group": null,
            "routes" : [
                {
                    "path" : "swagger.json",
                    "get": {
                        "demand" : null,
                        "method" : this.swagger
                    }
                }
            ]
        };
    }


    /**
     * @method
     * @summary Retrieves the HTTP documentation
     * @param {Express.Request} req The HTTP request
     * @param {Express.Response} res The HTTP result
     */
    async swagger(req, res) {

        // Load permission sets
        if(!this._spec.securityDefinitions.uhc_auth.scopes) {
            this._spec.securityDefinitions.uhc_auth.scopes = {
                "*" : "all permissions for user"
            };
            this._spec.securityDefinitions.app_auth.scopes = {
                "*" : "all permissions for application"
            };

            var permissions = await uhc.Repositories.permissionRepository.getAll();
            permissions.forEach((o) => {
                Object.keys(security.PermissionType).forEach((p) => {
                    if(p == "OWNER" || p == "RWX") return;
                    this._spec.securityDefinitions.uhc_auth.scopes[p.toLowerCase() + ":" + o.name] = p + " " + o.description; 
                    this._spec.securityDefinitions.app_auth.scopes[p.toLowerCase() + ":" + o.name] = p + " " + o.description; 

                });
            });
        }

        res.set('Content-Type', 'application/json').send(this._spec);
        return true;
    }
 }

 module.exports.SwaggerMetadataResource = SwaggerMetadata;