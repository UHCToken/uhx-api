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
    model = require('../model/model');

/**
 * @class
 * @summary Represents a user payment service
 */
class UserApiResource {

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
            "routes" : [
                {
                    "path" : "user",
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method" : this.post
                    },
                    "get": {
                        "demand" : security.PermissionType.LIST,
                        "method" : this.getAll
                    }
                },
                {
                    "path":"user/:uid",
                    "get" :{
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "put" : {
                        "demand": security.PermissionType.WRITE,
                        "method": this.put
                    },
                    "delete" : {
                        "demand":security.PermissionType.WRITE,
                        "method": this.delete
                    }
                }
            ]
        };
    }
    /**
     * @method
     * @summary Creates a new user
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     */
    async post(req, res)  {
        
        // Verify the request
        var ruleViolations = [];
        if(!req.body)
            ruleViolations.push(new exception.RuleViolation("Missing body", exception.ErrorCodes.MISSING_PAYLOAD, exception.RuleViolationSeverity.ERROR));
        if(!((!req.body.name || !req.body.password) ^ (!req.body.externalIds)))
            ruleViolations.push(new exception.RuleViolation("Must have either username & password OR externalId", exception.ErrorCodes.MISSING_PROPERTY, exception.RuleViolationSeverity.ERROR));
        if(req.body.name && !new RegExp(uhc.Config.security.username_regex).test(req.body.name))
            ruleViolations.push(new exception.RuleViolation("Username format invalid", exception.ErrorCodes.INVALID_USERNAME, exception.RuleViolationSeverity.ERROR));
        if(req.body.password && !new RegExp(uhc.Config.security.password_regex).test(req.body.password))
            ruleViolations.push(new exception.RuleViolation("Password does not meet complexity requirements", exception.ErrorCodes.PASSWORD_COMPLEXITY, exception.RuleViolationSeverity.ERROR));
        
        if(ruleViolations.length > 0)
            throw new exception.BusinessRuleViolationException(ruleViolations);

        var user = new model.User().copy(req.body);
        
        // USE CASE 1: User has passed up a username and password
        if(req.body.password && req.body.name) 
            res.status(201).json(await uhc.SecurityLogic.registerInternalUser(user, req.body.password));
        else // USE CASE 2: User is attempting to sign up with an external identifier
            res.status(201).json(await uhc.SecurityLogic.registerExternalUser(req.body.externalIds));

        return true;
    }
    /**
     * @method
     * @summary Updates an existing user
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     */
    async put(req, res) {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single user 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async get(req, res) {
        res.status(200).json(await uhc.Repositories.userRepository.get(req.params.uid));
        return true;
    }
    /**
     * @method
     * @summary Get all users from the UHC database (optional search parameters)
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async getAll(req, res) {
        
        var filterUser = new model.User().copy({
            name: req.param("name"),
            email: req.param("email"),
            givenName: req.param("givenName"),
            familyName: req.param("familyName"),
            deactivationTime: req.param("_all") ? null : "null"
        });
        
        res.status(200).json(await uhc.Repositories.userRepository.query(filterUser, req.param("_offset"), req.param("_count")));
        return true;
    }
    /**
     * @method
     * @summary Deactivate a user account from the UHC database
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     */
    async delete(req, res) {
        res.status(201).json(await uhc.Repositories.userRepository.delete(req.param("uid")));
        return true;
    }
    /**
     * 
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async acl(principal, req, res) {

        if(!(principal instanceof security.Principal)) {
            console.error("ACL requires a security principal to be passed");
            return false;
        }

        // if the token has OWNER set for USER permission then this user must be SELF
        return (principal.grant.user & security.PermissionType.OWNER && req.params.uid == principal.sub) // the permission on the principal is for OWNER only
                ^ !(principal.grant.user & security.PermissionType.OWNER); // XOR the owner grant flag is not set.
                
    }
}

// Module exports
module.exports.UserApiResource = UserApiResource;