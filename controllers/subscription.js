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
    subscriptionRepository = require('../repository/subscriptionRepository'),
    model = require('../model/model');

/**
 * @class
 * @summary Represents a patient's subscription
 * @swagger
 * tags:
 *  - name: subscription
 *    description: The subscription resource represents a single patient's subscription to an offering of services
 */
module.exports.SubscriptionApiResource = class SubscriptionApiResource {
    /**
     * @method
     * @summary Get routing information for this class
     */
    get routes() {
        return {
            "permission_group": "user",
            "routes": [
                {
                    "path": "patient/:id/subscription",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    }
                },
                {
                    "path": "patient/:id/subscription",
                    "post": {
                        "demand": security.PermissionType.READ,
                        "method": this.post
                    }
                },
                {
                    "path": "subscription",
                    "put": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.update
                    }
                },
                {
                    "path": "subscription/cancel",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.cancel
                    }
                }
            ]
        };
    }

     /**
     * @method
     * @summary Get the patient's subscriptions
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /patient/{id}/subscription:
     *  get:
     *      tags:
     *      - "subscription"
     *      summary: "Gets summary information about the patient's subscriptions"
     *      description: "This method will return summary information for the patient's subscriptions."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "id"
     *        description: "The identity of the patient to get subscriptions for"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The patient's subscription information"
     *             schema: 
     *                  $ref: "#/definitions/Subscription"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:subscription"
     */
    async get(req, res) {
        try {
            var subscriptions = await uhx.Repositories.subscriptionRepository.get(req.params.id);

            res.status(200).json(subscriptions);
            return true
        } catch (ex) {
            uhx.log.error(`Get subscription: ${ex.message}`);
        }
    }

    /**
     * @method
     * @summary Subscribes the patient to the given offering
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /patient/{id}/subscription:
     *  post:
     *      tags:
     *      - "subscription"
     *      summary: "Adds"
     *      description: "This method will return summary information for the patient's subscriptions."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "patientId"
     *        description: "The identity of the patient to get subscriptions for."
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "offeringId"
     *        description: "The identity of offering the patient is subscribing to."
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "autoRenew"
     *        description: "The flag to determine id the subscription will renew automatically."
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The patient's subscription information"
     *             schema: 
     *                  $ref: "#/definitions/Subscription"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:subscription"
     */
    async post(req, res) {
        try {
            var subscription = await uhx.Repositories.subscriptionRepository.post(req.params.id, req.body.offeringId, req.body.autoRenew);

            res.status(200).json(subscription);
            return true
        } catch(ex) {
            uhx.log.error(`Posting subscription: ${ex.message}`)
        }
    }

    /**
     * @method
     * @summary Update the patient's subscription
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /subscription:
     *  put:
     *      tags:
     *      - "subscription"
     *      summary: "Updates a give patient's subscription"
     *      description: "This method will update the patient's subscription."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "id"
     *        in: "body"
     *        description: "The identity of the patient to add the subscription"
     *        required: true
     *        type: string
     *      - name: "offeringId"
     *        in: "body"
     *        description: "The identity of the offering the patient is subscribing to."
     *        required: true
     *        type: string
     *      - name: "autoRenew"
     *        in: "body"
     *        description: "The flag that identifies if the subscription will be renewing automatically."
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The patient's subscription has been updated."
     *             schema: 
     *                  $ref: "#/definitions/Subscription"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:subscription"
     */
    async update(req, res) {
        try{
            var subscription = await uhx.Repositories.subscriptionRepository.update(req.body.id, req.body.offeringId, req.body.autoRenew);

            // Succesful update, respond ok with subscription object
            res.status(200).json(subscription);
            return true
        }
        catch(ex) {
            // Error updating subscription, return internal server error and log error
            uhx.log.error(`Updating patient subscription: ${ex.message}`)
            res.status(500);
        }
    }

    /**
     * @method
     * @summary Cancel the patient's subscription
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /subscription/cancel:
     *  post:
     *      tags:
     *      - "subscription"
     *      summary: "Cancels a given patient's subscription"
     *      description: "This method will cancel the patient's subscription."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "id"
     *        in: "body"
     *        description: "The identity of the subscription to cancel"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The patient's subscription has been canceled."
     *             schema: 
     *                  $ref: "#/definitions/Subscription"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:subscription"
     */
    async cancel(req, res) {
        try{
            var subscription = await uhx.Repositories.subscriptionRepository.cancel(req.body.subscriptionId);

            // Cancel succesful, respond OK with subscription
            res.status(200).json(subscription);
            return true
        } catch (ex) {
            uhx.log.error(`Cancelling subscription: ${ex.message}`);
            res.status(500);
        }
    }
}