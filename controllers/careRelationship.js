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
    carePlanRepository = require('../repository/carePlanRepository'),
    CarePlan = require('../model/CarePlan'),
    model = require('../model/model');

/**
 * @class
 * @summary Represents a user payment service
 * @swagger
 * tags:
 *  - name: "wallet"
 *    description: "The wallet resource represents a single user's wallet (stellar or other blockchain account, etc.)"
 */
class CareRelationshipApiResource {

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
                    "path": "careRelationship",
                    "post": {
                        "demand": security.PermissionType.READ,
                        "method": this.post
                    },
                    "delete": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.delete
                    }
                },
                {
                    "path": "careRelationship/:id",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    }
                },
                {
                    "path": "careRelationship/accept",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.accept
                    }
                },
                {
                    "path": "careRelationship/decline",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.decline
                    }
                },
                {
                    "path": "careRelationships",
                    "post": {
                        "demand": security.PermissionType.READ,
                        "method": this.getAll
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Creates a new care relationship
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /careRelationship:
     *  post:
     *      tags:
     *      - "careRelationship"
     *      summary: "Creates a new care relationship between a patient and provider"
     *      description: "This method create a care relationship between patient and provider"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The care relationship to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/CareRelationship"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/CareRelationship"
     *          422:
     *              description: "The care relationship object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:careRelationship"
     */
    async post(req, res) {
        var careRelationship = await uhx.CareLogic.createCareRelationship(req.body, req.principal);
        res.status(201).json(careRelationship);
        return true;
    }

    /**
     * @method
     * @summary Deletes a care relationship
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
    * @swagger
     * /careRelationship:
     *  delete:
     *      tags:
     *      - "careRelationship"
     *      summary: "Deletes a care relationship"
     *      description: "This method will delete a care relationship"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "careRelationship"
     *        description: "The care relation that is to be deleted"
     *        required: true
     *        type: #/definitions/CareRelationship
     *      responses:
     *          201: 
     *             description: "The deletion was successful"
     *             schema: 
     *                  $ref: "#/definitions/CareRelationship"
     *          404: 
     *             description: "That care relationship does not exist"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:careRelationship"
     */
    async delete(req, res) {
        var retVal = [];
        retVal.push(await uhx.Repositories.careRelationshipRepository.delete(req.params.id));
        res.status(201).json(retVal);
        return true;
    }

    /**
     * @summary Gets the specified care relationship
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async get(req, res) {

        var serviceInvoice = await uhx.Repositories.careRelationshipRepository.get(req.params.id);
        await serviceInvoice.loadPatient();
        await serviceInvoice.loadProvider();
        res.status(200).json(serviceInvoice);
        return true;
    }

    /**
 * @summary Accept the care relationshups as a provider
 * @method
 * @param {Express.Request} req The HTTP request from the client
 * @param {Express.Response} res The HTTP response to the client
 */
    async accept(req, res) {

        var careRelationship = await uhx.CareLogic.acceptCareRelationship(req.body, req.principal);
        res.status(200).json(careRelationship);
        return true;
    }


    /**
 * @summary Declines the specified care relationship
 * @method
 * @param {Express.Request} req The HTTP request from the client
 * @param {Express.Response} res The HTTP response to the client
 */
    async decline(req, res) {

        var careRelationship = await uhx.CareLogic.declineCareRelationship(req.body, req.principal);
        res.status(200).json(careRelationship);
        return true;
    }


    /**
 * @summary Gets all care relationships associated with either the provider or patient
 * @method
 * @param {Express.Request} req The HTTP request from the client
 * @param {Express.Response} res The HTTP response to the client
 */
    async getAll(req, res) {
        if (req.body.providerId) {
            var careRelationships = await uhx.Repositories.careRelationshipRepository.getByProviderId(req.body.providerId, req.body.status);

            for (var i = 0; i < careRelationships.length; i++) {
                await careRelationships[i].loadAddress();
                await careRelationships[i].loadPatient();
            }
        }
        else {
            var careRelationships = await uhx.Repositories.careRelationshipRepository.getByPatientId(req.body.patientId, req.body.status);

            for (var i = 0; i < careRelationships.length; i++) {
                await careRelationships[i].loadAddress();
                await careRelationships[i].loadProvider();
            }
        }
        res.status(200).json(careRelationships);
        return true;
    }

}

// Module exports
module.exports.CareRelationshipApiResource = CareRelationshipApiResource;
