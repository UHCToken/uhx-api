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
 *  - name: "carePlan"
 *    description: "The carePlan resource represents care plans created for services between two parties"
 */
class CarePlanApiResource {

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
                    "path": "carePlan",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.post
                    },
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "delete": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.delete
                    }
                },
                {
                    "path": "carePlan/:id",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                },
                {
                    "path": "carePlan/:id/fund",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.fund
                    }
                },
                {
                    "path": "carePlan/:id/decline",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.decline
                    }
                },
                {
                    "path": "carePlan/:id/dispute",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.dispute
                    }
                },
                {
                    "path": "carePlan/:id/confirm",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.confirm
                    }
                },
                {
                    "path": "carePlans",
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
     * @summary Creates a new care plan
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /carePlan:
     *  post:
     *      tags:
     *      - "carePlan"
     *      summary: "Creates a new care plan for a patient"
     *      description: "This creates a care plan containing care services to e given to the patient"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The care plan to be created, and the services to be associated and created as well"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/CarePlan"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/CarePlan"
     *          422:
     *              description: "The user object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:carePlan"
     */
    async post(req, res) {
        var plan = await uhx.CareLogic.createCarePlan(req.body, req.principal);
        res.status(201).json(plan);
        return true;
    }

    /**
     * @method
     * @summary Deactivates a wallet
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
    * @swagger
     * /user/{userid}/wallet:
     *  delete:
     *      tags:
     *      - "wallet"
     *      summary: "Deactivates the specified user wallet"
     *      description: "This method will set the deactivation time of the user's wallet"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to deactivate a wallet for"
     *        required: true
     *        type: string
     *      responses:
     *          201: 
     *             description: "The deactivation was successful"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          404: 
     *             description: "The user has not bought any UhX yet and does not have an active wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:wallet"
     */
    async delete(req, res) {
        var retVal = [];
        retVal.push(await uhx.Repositories.carePlanRepository.delete(req.params.id));
        res.status(201).json(retVal);
        return true;
    }

    /**
     * @summary Gets the detailed care plan with services
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async get(req, res) {
        var carePlan = await uhx.Repositories.carePlanRepository.get(req.params.id);
        var careServices = await uhx.Repositories.careServiceRepository.getByCarePlan(carePlan.id);
        carePlan.services = careServices;
        res.status(200).json(carePlan);
        return true;
    }

    /**
     * @summary Funds the specified care plan
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async fund(req, res) {

        var carePlan = await uhx.CareLogic.fundCarePlan(req.body, req.principal);
        res.status(200).json(carePlan);
        return true;
    }


    /**
     * @summary Declines a specified care plan
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async decline(req, res) {

        var carePlan = await uhx.CareLogic.declineCarePlan(req.params.id, req.principal);
        res.status(200).json(carePlan);
        return true;
    }

        /**
     * @summary Disputes a specified care plan
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async dispute(req, res) {

        var carePlan = await uhx.CareLogic.disputeCarePlan(req.body, req.principal);
        res.status(200).json(carePlan);
        return true;
    }
        /**
     * @summary Confirms the care plan as both patient and provider
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async confirm(req, res) {

        var carePlan = await uhx.CareLogic.confirmCarePlan(req.params, req.principal);
        res.status(200).json(carePlan);
        return true;
    }

    
        /**
     * @summary Gets all care plans associated with either the provider or patient
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async getAll(req, res) {
        if(req.body.providerId){
            var carePlans = await uhx.Repositories.carePlanRepository.getByProviderId(req.body.providerId, req.body.status);
        }
        else{
            var carePlans = await uhx.Repositories.carePlanRepository.getByPatientId(req.body.patientId, req.body.status);
        }
        res.status(200).json(carePlans);
        return true;
    }

}

// Module exports
module.exports.CarePlanApiResource = CarePlanApiResource;
