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
 * @summary Represents a provider address service
 * @swagger
 * tags:
 *  - name: "provideraddress"
 *    description: "The providerAddress resource represents a single provider address"
 */
class ProviderAddressApiResource {

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
            "permission_group": "user",
            "routes": [
                {
                    "path": "provideraddress",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.query
                    },
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.post
                    }
                },
                {
                    "path": "provideraddress/:addressid",
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
                },
                {
                    "path": "provideraddress/provider/:providerid",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getAllForProvider
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Allows for a query of all provider addresses with filters
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /provideraddress:
     *  get:
     *      tags:
     *      - "provideraddress"
     *      summary: "Gets filted address results"
     *      description: "This method will fetch all addresses and filter the results"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderAddress"
     *          404:
     *              description: "The specified address cannot be found"
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
    async query(req, res) {
        if (req.query.address && !req.query.lat && !req.query.lon) {
            var geometry = await uhx.GoogleMaps.getLatLon(req.query.address);
            req.query.lat = geometry.lat;
            req.query.lon = geometry.lon;
        }
        var addresses = await uhx.Repositories.providerAddressRepository.query(req.query);
        if (addresses) {
            addresses = await uhx.GoogleMaps.getDistances(req.query.address, addresses);
            for (var adr in addresses) {
                await addresses[adr].loadAddressServiceTypes();
                await addresses[adr].loadProviderDetails();
                if (req.query.serviceType)
                    addresses[adr].services = await uhx.Repositories.providerServiceRepository.getAllForAddressByType(addresses[adr].id, req.query.serviceType);
                else 
                    addresses[adr].loadAddressServices();
            }
        }
        var query = {latitude: req.query.lat, longitude: req.query.lon};
        res.status(201).json({addresses, query});
        return true;
    }

    /**
     * @method
     * @summary Creates a new provider address
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /provideraddress:
     *  post:
     *      tags:
     *      - "provideraddress"
     *      summary: "Registers a new provider address in the UhX API"
     *      description: "This method will register a new provider address in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderAddress"
     *          422:
     *              description: "The provider address object sent by the client was rejected"
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
    async post(req, res) {

        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        if (!req.body.providerId)
            throw new exception.Exception("Must have a providerId", exception.ErrorCodes.MISSING_PROPERTY);

        if (!req.body.addressName)
            throw new exception.Exception("Must have an addressName", exception.ErrorCodes.MISSING_PROPERTY);

        var address = new model.ProviderAddress().copy(req.body);
        var newAddress = await uhx.UserLogic.addProviderAddress(address, req.body.serviceTypes, req.principal);
        if (newAddress)
            await newAddress.loadAddressServiceTypes();
        res.status(201).json(newAddress);

        return true;
    }

    /**
     * @method
     * @summary Get a single provider address
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /provideraddress/{addressid}:
     *  get:
     *      tags:
     *      - "provideraddress"
     *      summary: "Gets an existing provider address from the UhX member database"
     *      description: "This method will fetch an existing provider address from the UhX member database"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "addressid"
     *        in: "path"
     *        description: "The provider address ID"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderAddress"
     *          404:
     *              description: "The specified provider cannot be found"
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

        var address = await uhx.Repositories.providerAddressRepository.get(req.params.addressid);
        if (address) {
            await address.loadAddressServiceTypes();
            await address.loadAddressServices();
        }

        res.status(200).json(address);

        return true;
    }

    /**
     * @method
     * @summary Get all addresses for the provider
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /provideraddress/{providerid}:
     *  get:
     *      tags:
     *      - "provideraddress"
     *      summary: "Gets all address for the provider specified"
     *      description: "This method gets all addresses for a provider"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "providerid"
     *        in: "params"
     *        description: "The providerid to get addresses for"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was queried successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderAddress"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:user"
     */
    async getAllForProvider(req, res) {

        var addresses = await uhx.Repositories.providerAddressRepository.getAllForProvider(req.params.providerid);
        if (addresses) {
            for (var adr in addresses) {
                await addresses[adr].loadAddressServiceTypes();
                await addresses[adr].loadAddressServices();
            }
        }

        res.status(200).json(addresses);

        return true;
    }

    /**
     * @method
     * @summary Updates an existing provider address
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /provideraddress/{addressid}:
     *  put:
     *      tags:
     *      - "provideraddress"
     *      summary: "Updates an existing provider address in the UhX API"
     *      description: "This method will update an existing provider address in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "addressid"
     *        in: "path"
     *        description: "The address ID of the provider address being updated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider address that is to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ProviderAddress"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderAddress"
     *          404:
     *              description: "The specified provider cannot be found"
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

        req.body.id = req.params.addressid;
        var address = await uhx.UserLogic.updateProviderAddress(new model.ProviderAddress().copy(req.body), req.body.serviceTypes, req.principal);
        if (address)
            await address.loadAddressServiceTypes();
        res.status(201).json(address);
        return true;
    }

    /**
     * @method
     * @summary Deactivates an existing provider address
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /provideraddress/{addressid}:
     *  delete:
     *      tags:
     *      - "provideraddress"
     *      summary: "Deactivates an existing provider address in the UhX API"
     *      description: "This method will deactivate an existing provider address in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "addressid"
     *        in: "path"
     *        description: "The ID of the provider address being deactivated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider address that is to be deactivated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ProviderAddress"
     *      responses:
     *          201: 
     *             description: "The requested resource was deactivated successfully"
     *             schema: 
     *                  $ref: "#/definitions/ProviderAddress"
     *          404:
     *              description: "The specified provider address cannot be found"
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
        req.body.id = req.params.addressid;
        res.status(200).json(await uhx.UserLogic.deleteProviderAddress(new model.ProviderAddress().copy(req.body), req.principal));
        return true;
    }

}

// Module exports
module.exports.ProviderAddressApiResource = ProviderAddressApiResource;
