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
 * @summary Represents a patient service
 * @swagger
 * tags:
 *  - name: "patient"
 *    description: "The patient resource represents a single patient (client, patient, etc.) which is a member of UHX"
 */
class PatientApiResource {

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
            "permission_group": "patient",
            "routes": [
                {
                    "path": "patient",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.post
                    },
                    "path": "patient",
                    "get": {
                        "demand": security.PermissionType.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path": "patient/:patientid",
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
                    "path": "patient/:uid/upload",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.upload
                    }
                },
                {
                    "path": "patient/:uid/img",
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
     * @summary Creates a new patient
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /patient:
     *  post:
     *      tags:
     *      - "patient"
     *      summary: "Registers a new patient in the UHX API"
     *      description: "This method will register a new patient in the UHX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The patient that is to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Patient"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Patient"
     *          422:
     *              description: "The patient object sent by the client was rejected"
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

        var patient = new model.Patient().copy(req.body);
        var newPatient = await uhx.UserLogic.addPatient(patient, req.principal);
        res.status(201).json(newPatient);

        return true;
    }

    /**
     * @method
     * @summary Get all patients
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /patient:
     *  get:
     *      tags:
     *      - "patient"
     *      summary: "Gets all patients"
     *      description: "This method gets all patients"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was queried successfully"
     *             schema: 
     *                  $ref: "#/definitions/Patients"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "list:user"
     */
    async getAll(req, res) {
        res.status(200).json(await uhx.Repositories.patientRepository.getAllPatients());
        return true;
    }

    /**
     * @method
     * @summary Updates an existing patient
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /patient/{patientid}:
     *  put:
     *      tags:
     *      - "patient"
     *      summary: "Updates an existing patient in the UHX API"
     *      description: "This method will update an existing patient in the UHX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "patientid"
     *        in: "path"
     *        description: "The user ID of the patient being updated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The patient that is to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Patient"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/Patient"
     *          404:
     *              description: "The specified patient cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The patient object sent by the client was rejected"
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
        req.body.id = req.params.patientid;

        res.status(201).json(await uhx.UserLogic.updatePatient(new model.Patient().copy(req.body), req.principal));
        return true;
    }

    /**
     * @method
     * @summary Get a single patient 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /patient/{patientid}:
     *  get:
     *      tags:
     *      - "patient"
     *      summary: "Gets an existing patient from the UHX database"
     *      description: "This method will fetch an existing patient from the UHX database"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "patientid"
     *        in: "path"
     *        description: "The patient ID of the patient"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/Patient"
     *          404:
     *              description: "The specified patient cannot be found"
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
        res.status(200).json(await uhx.Repositories.patientRepository.get(req.params.patientid));
        return true;
    }


    /**
     * @method
     * @summary Uploads an image for the patient
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /patient/{userid}/upload:
     *  post:
     *      tags:
     *      - "patient"
     *      summary: "Uploads an image for the patient"
     *      description: "This method will allow the patient to upload an image into object storage"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The user ID of the patient adding an image"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The file to upload"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Patient"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/Patient"
     *          404:
     *              description: "The specified patient cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The patient object sent by the client was rejected"
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
        var result = await uhx.ObjectStorage.uploadProfileImage(req, res, 'patient');
        var status = result instanceof exception.Exception ? 500 : 201;

        res.status(status).json(result);

        return true;
    }

/**
 * @method
 * @summary Get a single patients profile picture
 * @param {Express.Reqeust} req The request from the client 
 * @param {Express.Response} res The response from the client
 * @swagger
 * /patient/{userid}/img:
 *  get:
 *      tags:
 *      - "patient"
 *      summary: "Gets the profile picture for a specified patient"
 *      description: "This method will fetch the profile image for a specific patient"
 *      produces:
 *      - "application/json"
 *      parameters:
 *      - name: "userid"
 *        in: "path"
 *        description: "The ID of the patient for the profile image"
 *        required: true
 *        type: "string"
 *      responses:
 *          200: 
 *             description: "The requested resource was fetched successfully"
 *             schema: 
 *                  $ref: "#/definitions/Patient"
 *          404:
 *              description: "The specified patient cannot be found"
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
        var image = await uhx.ObjectStorage.getProfileImage(req, res, 'patient');
        var status = image instanceof exception.Exception ? 404 : 201;
        if (status == 201)
            image.pipe(res);
        else
            res.status(status).json(image);

        return true;
    }

    /**
     * @method
     * @summary Determines additional access control on the patient resource
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @returns {boolean} An indicator of whether the patient has access to the resource
     */
    async acl(principal, req, res) {

        if (!(principal instanceof security.Principal)) {
            uhx.log.error("ACL requires a security principal to be passed");
            return false;
        }

        if (req.params.uid)
            var id = req.params.uid;
        else if (req.body.userId)
            var id = req.body.userId;
        else if (req.params.patientid){
            var patient = await uhx.Repositories.patientRepository.get(req.params.patientid);
            var id = patient.userId;
        }
        // if the token has OWNER set for PATIENT permission then this user must be SELF
        return (principal.grant.patient & security.PermissionType.OWNER && id == principal.session.userId) // the permission on the principal is for OWNER only
            ^ !(principal.grant.patient & security.PermissionType.OWNER); // XOR the owner grant flag is not set.

    }
}

// Module exports
module.exports.PatientApiResource = PatientApiResource;
