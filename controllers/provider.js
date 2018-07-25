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
 * @summary Represents a provider service
 * @swagger
 * tags:
 *  - name: "provider"
 *    description: "The provider resource represents a single provider (client, provider, etc.) which is a member of UhX"
 */
class ProviderApiResource {

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
                    "path": "provider",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.post
                    }
                },
                {
                    "path": "provider/:uid",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "put": {
                        "demand": security.PermissionType.WRITE | security.PermissionType.READ,
                        "method": this.put
                    }
                },
                {
                    "path": "provider/:uid/upload",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.upload
                    }
                },
                {
                    "path": "provider/:uid/img",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getProfilePicture
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Creates a new provider
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /provider:
     *  post:
     *      tags:
     *      - "provider"
     *      summary: "Registers a new provider in the UhX API"
     *      description: "This method will register a new provider in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The provider that is to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Provider"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Provider"
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
    async post(req, res) {

        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        if (!req.body.userId)
            throw new exception.Exception("Must have a userId", exception.ErrorCodes.MISSING_PROPERTY);

        var provider = new model.Provider().copy(req.body);
        var newProvider = await uhx.UserLogic.addProvider(provider, req.body.serviceTypes, req.principal);
        await newProvider.loadProviderServiceTypes();
        res.status(201).json(newProvider);

        return true;
    }

    /**
     * @method
     * @summary Updates an existing provider
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /provider/{providerid}:
     *  put:
     *      tags:
     *      - "provider"
     *      summary: "Updates an existing provider in the UhX API"
     *      description: "This method will update an existing  provider in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "providerid"
     *        in: "path"
     *        description: "The user ID of the provider being updated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The provider that is to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Provider"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/Provider"
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
        req.body.id = req.params.uid;
        var provider = await uhx.UserLogic.updateProvider(new model.Provider().copy(req.body), req.body.serviceTypes, req.principal);
        if (provider)
            await provider.loadProviderServiceTypes();
        res.status(201).json(provider);
        return true;
    }

    /**
     * @method
     * @summary Get a single provider 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /provider/{providerid}:
     *  get:
     *      tags:
     *      - "provider"
     *      summary: "Gets an existing provider from the UhX member database"
     *      description: "This method will fetch an existing provider from the UhX member database"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "providerid"
     *        in: "path"
     *        description: "The provider ID of the provider"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/Provider"
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
        var provider = await uhx.Repositories.providerRepository.get(req.params.uid);
        if (provider)
            await provider.loadProviderServiceTypes();
        res.status(200).json(provider);
        return true;
    }


    /**
     * @method
     * @summary Uploads an image for the provider
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /provider/{userid}/upload:
     *  post:
     *      tags:
     *      - "provider"
     *      summary: "Uploads an image for the provider"
     *      description: "This method will allow the provider to upload an image into object storage"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The user ID of the provider adding an image"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The file to upload"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Provider"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/Provider"
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
     */
    async upload(req, res) {
        req.body.id = req.params.uid;
        var result = await uhx.ObjectStorage.uploadProfileImage(req, res, 'provider');
        var status = result instanceof exception.Exception ? 500 : 201;

        res.status(status).json(result);

        return true;
    }

    /**
 * @method
 * @summary Get a single providers profile picture
 * @param {Express.Reqeust} req The request from the client 
 * @param {Express.Response} res The response from the client
 * @swagger
 * /provider/{providerid}/img:
 *  get:
 *      tags:
 *      - "provider"
 *      summary: "Gets the profile picture for a specified provider"
 *      description: "This method will fetch the profile image for a specific provider"
 *      produces:
 *      - "application/json"
 *      parameters:
 *      - name: "providerid"
 *        in: "path"
 *        description: "The ID of the provider for the profile image"
 *        required: true
 *        type: "string"
 *      responses:
 *          200: 
 *             description: "The requested resource was fetched successfully"
 *             schema: 
 *                  $ref: "#/definitions/Provider"
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
    async getProfilePicture(req, res) {
        var image = await uhx.ObjectStorage.getProfileImage(req, res, 'provider');
        var status = image instanceof exception.Exception ? 404 : 201;
        if (status == 201)
            image.pipe(res);
        else
            res.status(status).json(image);

        return true;
    }
    /**
     * @method
     * @summary Determines additional access control on the provider resource
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @returns {boolean} An indicator of whether the provider has access to the resource
     */
    async acl(principal, req, res) {

        if (!(principal instanceof security.Principal)) {
            uhx.log.error("ACL requires a security principal to be passed");
            return false;
        }

        // if the token has OWNER set for USER permission then this provider must be SELF
        return (principal.grant.provider & security.PermissionType.OWNER && req.params.uid == principal.session.providerId) // the permission on the principal is for OWNER only
            ^ !(principal.grant.provider & security.PermissionType.OWNER); // XOR the owner grant flag is not set.

    }
}

// Module exports
module.exports.ProviderApiResource = ProviderApiResource;
