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
 security = require('../security'),
  exception = require('../exception'),
  PermissionSet = require('../model/PermissionSet');

  /**
   * @class
   * @summary Represents a resource to fetch Permissions
   * @swagger
   * tags:
   *    - name: permission
   *      description: A resource to fetch permission information from the UHX API
   */
module.exports.PermissionApiResource = class PermissionApiResource {

    /**
     * @property
     * @summary Returns the routes to the API controller
     */
    get routes() {
        return { 
            permission_group: "permission",
            routes: [
                {
                    "path": "permission",
                    "get" : {
                        demand: security.PermissionType.LIST,
                        method: this.getAll
                    },
                    "post" : {
                        demand: security.PermissionType.WRITE,
                        method: this.create
                    }
                },
                {
                    "path": "permission/:pid",
                    "get": {
                        demand: security.PermissionType.READ,
                        method: this.get
                    },
                    "delete" : {
                        demand: security.PermissionType.WRITE,
                        method: this.delete
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Get all permissions from the server
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response from the server
     */
    async getAll(req, res) {
        res.status(200).json(await uhx.Repositories.permissionRepository.getAll());
        return true;
    }

    /**
     * @method
     * @summary Creates a new permission in the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async create(req, res) {
        
        if(!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);
        
        var permission = new PermissionSet().copy(req.body);
        res.status(201).json(await uhx.Repositories.permissionRepository.insert(permission, req.Principal));
        return true;
    }

    /**
     * @method
     * @summary Get a specific permission in the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async get(req, res) {
        if(!req.params.pid)
            throw new exception.Exception("Missing permission id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        res.status(200).json(await uhx.Repositories.permissionRepository.get(req.params.pid));
        return true;
    }

    /**
     * @method
     * @summary Deactivates the specified permission from the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async delete(req, res) {
        if(!req.params.pid)
            throw new exception.Exception("Missing permission id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        res.status(201).json(await uhx.Repositories.permissionRepository.delete(req.params.pid));
        return true;
    }
}
  
