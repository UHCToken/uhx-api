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
 
const uhc = require('../uhc'),
    exception = require('../exception'),
    security = require('../security'),
    Invitation = require('../model/Invitation');

/**
 * @class
 * @summary Represents a contract in the system
 * @swagger
 * tags:
 *  - name: "invitation"
 *    description: "The invitation resource represents an invitation to join the UHX network"
 */
class InvitationApiResource {

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
            "permission_group": "invitation",
            "routes" : [
                {
                    "path" : "invitation",
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method" : this.post
                    },
                    "get" : {
                        "demand": security.PermissionType.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path":"invitation/:id",
                    "get" :{
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "delete" : {
                        "demand": security.PermissionType.WRITE,
                        "method": this.delete
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Creates a new invitation
     * @param {Express.Request} req The HTTP request from the user
     * @param {Express.Response} res The HTTP response from the user
     */
    async post(req, res) {
        
        if(!req.body)
            throw new exception.Exception("Missing payload", exception.ErrorCodes.MISSING_PAYLOAD);
        
        var invite = await uhc.SecurityLogic.createInvitation(new Invitation().copy(req.body), req.principal);
        res.status(201)
            .set("Location", `${uhc.Config.api.scheme}://${uhc.Config.api.host}:${uhc.Config.api.port}${uhc.Config.api.base}/invitation/${invite.id}`)
            .json(invite);
        return true;
    }

    /**
     * @method
     * @summary Gets all invitations
     * @param {Express.Request} req The HTTP request from the user
     * @param {Express.Response} res The HTTP response from the user
     */
    async getAll(req, res) {
        throw new exception.NotImplementedException();
    }

    /**
     * @method
     * @summary Gets a specific invitation
     * @param {Express.Request} req The HTTP request from the user
     * @param {Express.Response} res The HTTP response from the user
     */
    async get(req, res) {
        res.status(200).json(await uhc.Repositories.invitationRepository.get(req.params.id));
        return true;
    }

    /**
     * @method
     * @summary Rescinds a particular invitation
     * @param {Express.Request} req The HTTP request from the user
     * @param {Express.Response} res The HTTP response from the user
     */
    async delete(req, res) {
        res.status(201).json(await uhc.Repositories.invitationRepository.delete(req.params.id));
        return true;
    }
    
}

module.exports.InvitationApiResource = InvitationApiResource;