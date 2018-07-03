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
    GreenMoney = require("../integration/greenmoney"),
    model = require('../model/model');

/**
 * @class
 * @summary Represents a user payment service
 * @swagger
 * tags:
 *  - name: "user"
 *    description: "The user resource represents a single user (client, provider, etc.) which is a member of UhX"
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
            "routes": [
                {
                    "path": "user/reset",
                    "post": {
                        "demand": security.PermissionType.EXECUTE | security.PermissionType.WRITE,
                        "method": this.reset
                    },
                    "put": {
                        "demand": security.PermissionType.EXECUTE | security.PermissionType.WRITE,
                        "method": this.resetComplete
                    }
                },
                {
                    "path": "user/confirm",
                    "post": {
                        "demand": security.PermissionType.EXECUTE | security.PermissionType.WRITE,
                        "method": this.confirm
                    }
                },
                {
                    "path": "user",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.post
                    },
                    "get": {
                        "demand": security.PermissionType.LIST,
                        "method": this.getAll
                    }
                },
                {
                    "path": "user/:uid",
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
                    },
                    "lock": {
                        "demand": security.PermissionType.WRITE | security.PermissionType.READ,
                        "method": this.lock
                    },
                    "unlock": {
                        "demand": security.PermissionType.WRITE | security.PermissionType.READ,
                        "method": this.unlock
                    }
                },
                {
                    "path": "user/:uid/confirm",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.confirm
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
     * @swagger
     * /user:
     *  post:
     *      tags:
     *      - "user"
     *      summary: "Registers a new user in the UhX API"
     *      description: "This method will register a new user in the UhX API and create the necessary accounts and trust transactions"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The user that is to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/User"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/User"
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
     *          - "write:user"
     *      - app_auth:
     *          - "write:user"
     */
    async post(req, res) {

        // Verify the request
        var ruleViolations = [];

        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);
        if (!((!req.body.name || !req.body.password) ^ (!req.body.externalIds)))
            throw new exception.Exception("Must have either username & password OR externalId", exception.ErrorCodes.MISSING_PROPERTY);

        var user = new model.User().copy(req.body);

        // USE CASE 1: User has passed up a username and password
        if (req.body.password && req.body.name)
            res.status(201).json(await uhx.SecurityLogic.registerInternalUser(user, req.body.password, req.principal));
        else // USE CASE 2: User is attempting to sign up with an external identifier
            res.status(201).json(await uhx.SecurityLogic.registerExternalUser(req.body.externalIds, req.principal));

        return true;
    }
    /**
     * @method
     * @summary Updates an existing user
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /user/{userid}:
     *  put:
     *      tags:
     *      - "user"
     *      summary: "Updates an existing user in the UhX API"
     *      description: "This method will update an existing  user in the UhX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The ID of the user being updated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The user that is to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/User"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/User"
     *          404:
     *              description: "The specified user cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
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
     *          - "write:user"
     *          - "read:user"
     */
    async put(req, res) {

        // does the request have a password if so we want to ensure that get's passed
        req.body.id = req.params.uid;
        res.status(201).json(await uhx.SecurityLogic.updateUser(new model.User().copy(req.body), req.body.password));
        return true;
    }
    /**
     * @method
     * @summary Get a single user 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/{userid}:
     *  get:
     *      tags:
     *      - "user"
     *      summary: "Gets an existing user from the UhX member database"
     *      description: "This method will fetch an existing user from the UhX member database"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The ID of the user being updated"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/User"
     *          404:
     *              description: "The specified user cannot be found"
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
        var user = await uhx.Repositories.userRepository.get(req.params.uid);
        await user.loadWallets();

        // Load balances from blockchain
        if (user._wallets)
            user._wallets = await uhx.TokenLogic.getAllBalancesForWallets(user._wallets);

        // Get USD balance
        var usd = await uhx.GreenMoney.getBalance(req.params.uid, 'USD');

        var wallet = {};

        if (usd) {
            var wallet = {};
            wallet.id = usd.id;
            wallet.balances = [];
            var balance = {};
            balance.code = 'USD';
            balance.value = usd.amount;
            wallet.balances[0] = balance;
            wallet.userId = usd.userId;
            user._wallets.push(wallet)
        }

        await user.loadExternalIds();
        await user.loadClaims();
        await user.loadGroups();

        res.status(200).json(user);
        return true;
    }
    /**
     * @method
     * @summary Get all users from the UhX database (optional search parameters)
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/:
     *  get:
     *      tags:
     *      - "user"
     *      summary: "Queries the UhX member database for users matching the specified parameters"
     *      description: "This method performs a query against the UhX user's database. This method will return additional information about the specified user including any external identities and wallet"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "name"
     *        in: "query"
     *        description: "The username to filter on"
     *        required: false
     *        type: "string"
     *      - name: "email"
     *        in: "query"
     *        description: "The email address to filter on"
     *        required: false
     *        type: "string"
     *      - name: "givenName"
     *        in: "query"
     *        description: "The user given names to filter on"
     *        required: false
     *        type: "string"
     *      - name: "familyName"
     *        in: "query"
     *        description: "The user family names to filter on"
     *        required: false
     *        type: "string"
     *      - name: "_all"
     *        in: "query"
     *        description: "When specified and set to true, instructs the query to return all users (even those who are deactivated)"
     *        required: false
     *        type: "boolean"
     *      - name: "_count"
     *        in: "query"
     *        description: "When specified, indicates the number of results the requesting service is asking for"
     *        required: false
     *        type: "number"
     *      - name: "_offset"
     *        in: "query"
     *        description: "When specified, indicates the offset in the result set"
     *        required: false
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was queried successfully"
     *             schema: 
     *                  $ref: "#/definitions/User"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "list:user"
     */
    async getAll(req, res) {

        var filterUser = new model.User().copy({
            name: req.query.name,
            email: req.query.email,
            givenName: req.query.givenName,
            familyName: req.query.familyName,
            deactivationTime: req.query._all ? null : "null"
        });

        var results = await uhx.Repositories.userRepository.query(filterUser, req.query._offset, req.query._count, req.query._sort);
        results.forEach((o) => { o._externalIds = null; });
        res.status(200).json(results);
        return true;
    }
    /**
     * @method
     * @summary Deactivate a user account from the UhX database
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/{userid}:
     *  delete:
     *      tags:
     *      - "user"
     *      summary: "Deactivates a user in the UhX member database"
     *      description: "This method will set the deactivation time of the specified user account so they no longer can login or appear in searches."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userid"
     *        in: "path"
     *        description: "The ID of the user being deactivated"
     *        required: true
     *        type: "string"
     *      responses:
     *          201: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/User"
     *          404:
     *              description: "The specified user cannot be found"
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
        res.status(201).json(await uhx.Repositories.userRepository.delete(req.params.uid));
        return true;
    }

    /**
     * @method
     * @summary Generates a reset password email
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /user/reset:
     *  post:
     *      tags:
     *      - "user"
     *      summary: "Creates a new password reset claim"
     *      description: "This method will create a new password reset claim on the user's account."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "email"
     *        in: "formData"
     *        description: "The e-mail address of the user being reset"
     *        required: false
     *        type: "string"
     *      - name: "tel"
     *        in: "formData"
     *        description: "The SMS address of the user being reset"
     *        required: false
     *        type: "string"
     *      responses:
     *          204: 
     *             description: "The reset request was successful and no content is required to be returned"
     *          404:
     *              description: "The specified user cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - app_auth:
     *          - "write:user"
     *          - "execute:user"
    */
    async reset(req, res) {
        await uhx.SecurityLogic.initiatePasswordReset(req.body.email, req.body.tel);
        res.status(204).send();
        return true;
    }

    /**
     * @method
     * @summary Fulfills a password reset request 
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /user/reset:
     *  put:
     *      tags:
     *      - "user"
     *      summary: "Completes a user password reset claim"
     *      description: "This method will allow the user to change their password"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "code"
     *        in: "formData"
     *        required: true
     *        description: "The reset code sent to the user"
     *        type: "string"
     *      - name: "password"
     *        in: "formData"
     *        required: true
     *        description: "The new password to set on the user"
     *        type: "string"
     *      responses:
     *          204: 
     *             description: "The reset request was successful and no content is required to be returned"
     *          404:
     *              description: "The specified user cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - app_auth:
     *          - "write:user"
     *          - "execute:user"
    */
    async resetComplete(req, res) {

        if (!req.body.code)
            throw new exception.ArgumentException("code");
        else if (!req.body.password)
            throw new exception.ArgumentException("password");

        // Reset password 
        await uhx.SecurityLogic.resetPassword(req.body.code, req.body.password);
        res.status(204).send();
        return true;
    }

    /**
     * @method
     * @summary Fulfills a confirmation of contact information request
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /user/confirm:
     *  post:
     *      tags:
     *      - "user"
     *      summary: "Completes a user contact confirmation"
     *      description: "This method will allow the user to fulfill a contact confirmation request"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "code"
     *        in: "formData"
     *        description: "The confirmation code sent to the contact address"
     *        required: true
     *        type: "string"
     *      responses:
     *          204: 
     *             description: "The reset request was successful and no content is required to be returned"
     *          404:
     *              description: "The specified user cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - app_auth:
     *          - "write:user"
     *          - "execute:user"
     * /user/{userId}/confirm:
     *  post:
     *      tags:
     *      - "user"
     *      summary: "Completes a user contact confirmation"
     *      description: "This method will allow the user to fulfill a contact confirmation request - This is for short codes"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userId"
     *        in: "path"
     *        description: "The user that is confirming their e-mail or SMS address"
     *        required: true
     *        type: "string"
     *      - name: "code"
     *        in: "formData"
     *        description: "The confirmation code sent to the contact address"
     *        required: true
     *        type: "string"
     *      responses:
     *          204: 
     *             description: "The reset request was successful and no content is required to be returned"
     *          404:
     *              description: "The specified user cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:user"
     *          - "execute:user"
    */
    async confirm(req, res) {

        if (!req.body.code)
            throw new exception.ArgumentException("code");

        await uhx.SecurityLogic.confirmContact(req.body.code, req.principal);
        res.status(204).send();
        return true;
    }

    /**
     * @method
     * @summary Locks a user account
     * @param {Express.Request} req The HTTP request
     * @param {Express.Response} res The HTTP response
     * /user/{userId}:
     *  lock:
     *      tags:
     *      - "user"
     *      summary: "Locks a user"
     *      description: "This method will lock the user until the end of time"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userId"
     *        in: "path"
     *        description: "The user to be locked"
     *        required: true
     *        type: "string"
     *      responses:
     *          204: 
     *             description: "The reset request was successful and no content is required to be returned"
     *          404:
     *              description: "The specified user cannot be found"
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
    async lock(req, res) {
        if (req.principal.grant["user"] & security.PermissionType.OWNER)
            throw new security.SecurityException(new security.Permission("user", 1));

        var usr = await uhx.Repositories.userRepository.get(req.params.uid);
        usr.lockout = new Date("9999-12-31T00:00:00Z");
        await uhx.Repositories.userRepository.update(usr, null, req.principal);
        res.status(204).send();
        return true;
    }

    /**
     * @method
     * @summary Unlocks a user account
     * @param {Express.Request} req The HTTP request
     * @param {Express.Response} res The HTTP response
     * /user/{userId}:
     *  unlock:
     *      tags:
     *      - "user"
     *      summary: "Unlocks a user"
     *      description: "This method will unlock the user until the end of time"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "userId"
     *        in: "path"
     *        description: "The user to be unlocked"
     *        required: true
     *        type: "string"
     *      responses:
     *          204: 
     *             description: "The reset request was successful and no content is required to be returned"
     *          404:
     *              description: "The specified user cannot be found"
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
    async unlock(req, res) {
        if (req.principal.grant["user"] & security.PermissionType.OWNER)
            throw new security.SecurityException(new security.Permission("user", 1));

        var usr = await uhx.Repositories.userRepository.get(req.params.uid);
        usr.lockout = null;
        await uhx.Repositories.userRepository.update(usr, null, req.principal);
        res.status(204).send();
        return true;
    }

    /**
     * @method
     * @summary Determines additional access control on the user resource
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @returns {boolean} An indicator of whether the user has access to the resource
     */
    async acl(principal, req, res) {

        if (!(principal instanceof security.Principal)) {
            uhx.log.error("ACL requires a security principal to be passed");
            return false;
        }

        // if the token has OWNER set for USER permission then this user must be SELF
        return (principal.grant.user & security.PermissionType.OWNER && req.params.uid == principal.session.userId) // the permission on the principal is for OWNER only
            ^ !(principal.grant.user & security.PermissionType.OWNER); // XOR the owner grant flag is not set.

    }
}

// Module exports
module.exports.UserApiResource = UserApiResource;
