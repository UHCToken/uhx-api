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
    model = require('../model/model');

/**
 * @class
 * @summary Represents a provider address services service
 * @swagger
 * tags:
 *  - name: "providerservice"
 *    description: "The provider address service resource represents a single provider address for a single provider"
 */
class ProviderServiceApiResource {

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
            "permission_group": "providerService",
            "routes": [
                {
                    "path": "addressservice",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.query
                    }
                },
                {
                    "path": "addressservice/:addressid",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getAll
                    },
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.addServices
                    },
                    "put": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.updateServices
                    }
                },
                {
                    "path": "addressservice/service/:serviceid",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "put": {
                        "demand": security.PermissionType.WRITE | security.PermissionType.READ,
                        "method": this.put
                    },
                    "delete": {
                        "demand": security.PermissionType.WRITE | security.PermissionType.READ,
                        "method": this.delete
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Allows for a query of all provider address services with parameters
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /addressservice:
     *  get:
     *      tags:
     *      - "addressservice"
     *      summary: "Gets all address services with filters results"
     *      description: "This method will fetch all address services and filter the results"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          404:
     *              description: "The specified address service cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "list:user"
     */
    async query(req, res) {
        throw new exception.NotImplementedException();
        return true;
    }

    /**
     * @method
     * @summary Gets all provider address services for the provider address
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /addressservice/{addressid}:
     *  get:
     *      tags:
     *      - "addressservice"
     *      summary: "Gets all address services"
     *      description: "This method will fetch all address services"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          404:
     *              description: "The specified address service cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:user"
     */
    async getAll(req, res) {
         var services = await uhx.UserLogic.getAllServices(req.params.addressid);

        res.status(200).json(services);
        return true;
    }

    /**
     * @method
     * @summary Creates a new provider address service
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /addressservice/{addressid}:
     *  post:
     *      tags:
     *      - "addressservice"
     *      summary: "Registers a new provider address service in the UhX API"
     *      description: "This method will register a new provider address service in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "addressid"
     *        in: "path"
     *        description: "The provider address ID"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider address service that is to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ProviderService"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          422:
     *              description: "The provider object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:user"
     *      - app_auth:
     *          - "write:user"
     */
    async addServices(req, res) {
        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        if (!Array.isArray(req.body))
            req.body = [req.body];

        var newServices = await uhx.UserLogic.addProviderServices(req.params.addressid, req.body.map(o => new model.ProviderService().copy(o)), req.principal);
        if (newServices) {
            var services = await uhx.UserLogic.getAllServices(req.params.addressid);
        }
        res.status(201).json(services);

        return true;
    }

    /**
     * @method
     * @summary Creates a new provider address service
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /addressservice/{addressid}:
     *  put:
     *      tags:
     *      - "addressservice"
     *      summary: "Updates provider address services for an address in the UhX API"
     *      description: "This method will update existing address services in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "addressid"
     *        in: "path"
     *        description: "The provider address ID"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider address services to update"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ProviderService"
     *      responses:
     *          201: 
     *             description: "The requested resources were updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          422:
     *              description: "The provider object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:user"
     *      - app_auth:
     *          - "write:user"
     */
    async updateServices(req, res) {
        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        if (!Array.isArray(req.body))
            req.body = [req.body];

        var editedServices = await uhx.UserLogic.editProviderServices(req.params.addressid, req.body.map(o => new model.ProviderService().copy(o)), req.body.map(o => o.action), req.principal);
        if (editedServices) {
            var services = await uhx.UserLogic.getAllServices(req.params.addressid);
        }
        res.status(201).json(services);

        return true;
    }

    /**
     * @method
     * @summary Get a single provider address service
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /addressservice/{serviceid}:
     *  get:
     *      tags:
     *      - "addressservice"
     *      summary: "Gets an existing provider address service from the UhX member database"
     *      description: "This method will fetch an existing provider address service from the UhX member database"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "serviceid"
     *        in: "path"
     *        description: "The service ID"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          404:
     *              description: "The specified provider address service cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:user"
     */
    async get(req, res) {
        var service = await uhx.Repositories.providerServiceRepository.get(req.params.serviceid);
        if (service)
            await service.loadServiceTypeDetails();
        res.status(200).json(service);
        return true;
    }

    /**
     * @method
     * @summary Updates an existing provider address service
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /addressservice/{serviceid}:
     *  put:
     *      tags:
     *      - "addressservice"
     *      summary: "Updates an existing provider address service in the UhX API"
     *      description: "This method will update an existing provider address service in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "serviceid"
     *        in: "path"
     *        description: "The service ID of the provider address service being updated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider address service that is to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ProviderService"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          404:
     *              description: "The specified provider address service cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The provider object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:user"
     *          - "read:user"
     */
    async put(req, res) {
        req.body.id = req.params.serviceid;
        res.status(200).json(await uhx.UserLogic.updateProviderService(new model.ProviderService().copy(req.body), req.principal));
        return true;
    }

    /**
     * @method
     * @summary Deactivates an existing provider address service
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /addressservice/{serviceid}:
     *  put:
     *      tags:
     *      - "addressservice"
     *      summary: "Deactivates an existing provider address service in the UhX API"
     *      description: "This method will deactivate an existing provider address service in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "serviceid"
     *        in: "path"
     *        description: "The service ID of the provider address service being deactivated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider address service that is to be deactivated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ProviderService"
     *      responses:
     *          201: 
     *             description: "The requested resource was deactivated successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderService"
     *          404:
     *              description: "The specified provider address service cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The provider object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:user"
     *          - "read:user"
     */
    async delete(req, res) {
        req.body.id = req.params.serviceid;
        res.status(200).json(await uhx.UserLogic.deleteProviderService(new model.ProviderService().copy(req.body), req.principal));
        return true;
    }
}

// Module exports
module.exports.ProviderServiceApiResource = ProviderServiceApiResource;
