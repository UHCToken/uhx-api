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
    offeringRepository = require('../repository/offeringRepository'),
    model = require('../model/model');

/**
 * @class
 * @summary Represents a set of offerings
 * @swagger
 * tags:
 *  - name: offering
 *    description: The offering resource represents a set of services available to the user
 */
module.exports.OfferingApiResource = class OfferingApiResource {
    /**
     * @method
     * @summary Get routing information for this class
     */
    get routes() {
        return {
            "permission_group": "user",
            "routes": [
                {
                    "path": "offering",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    }
                },
                {
                    "path": "offering/{id}",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getOffering
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Get a list of available offerings for a given patient
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /offering:
     *  get:
     *      tags:
     *      - "offering"
     *      summary: "Gets a list of available service offerings for a given patient"
     *      description: "This method will return a list of offerings that the patient can subscribe to. These are subsets of Services that are available as a group."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "patientId"
     *        description: "The patient that is requesting the list of available offerings."
     *        required: true
     *      responses:
     *          200: 
     *             description: "The list of available offerings."
     *             schema: 
     *                  $ref: "#/definitions/Offering"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:offering"
     */
    async get(req, res) {
        const offeringGroups = await uhx.Repositories.offeringRepository.get();

        const countryCode = req.query.countryCode;

        for (let i = 0; i < offeringGroups.length; i++) {
            const offering = offeringGroups[i];

            offering.offerings = offering.offerings.filter((off) => {
                return off.country_code === countryCode;
            });
        }

        res.status(200).json(offeringGroups);
        return true;
    }

    /**
     * @method
     * @summary Gets more details about a given offering
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /offering/{id}:
     *  get:
     *      tags:
     *      - "offering"
     *      summary: "Gets more details about a given offering"
     *      description: "This method will return the details of a given offering including services associated with this offering with descriptions and prices."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "offering"
     *        description: "The offering that the patient is requesting to view."
     *        required: true
     *      responses:
     *          200: 
     *             description: "The details of the requested offering."
     *             schema: 
     *                  $ref: "#/definitions/Offering"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:offering"
     */
    async getOffering(req, res) {
        var offering = await uhx.Repositories.offeringRepository.getOffering(req.body.offeringId);

        var retVal = offering;
      
        res.status(200).json(retVal);
        return true;
    }
}