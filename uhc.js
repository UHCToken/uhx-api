// <Reference path="./model/model.js"/>
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

 const config = require('./config'),
    repositories = require('./repository/repository'),
    exception = require('./exception'),
    security = require('./security'),
    StellarClient = require('./integration/stellar'),
    model = require('./model/model'),
    User = require('./model/User'),
    crypto = require('crypto'),
    fs = require('fs'),
    nodemailer = require("nodemailer"),
    handlebars = require("handlebars");

 const repository = new repositories.UhcRepositories(config.db.server);
 /**
  * @class
  * @summary Represents the core business logic of the UHC application
  */
 class SecurityLogic {

    /**
     * @constructor
     * @summary Binds methods to "this"
     */
    constructor() {
        this.authenticateClientApplication = this.authenticateClientApplication.bind(this);
        this.establishSession = this.establishSession.bind(this);
        this.refreshSession = this.refreshSession.bind(this);
        this.registerInternalUser = this.registerInternalUser.bind(this);
        this.createStellarWallet = this.createStellarWalletForUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.validateUser = this.validateUser.bind(this);
        this.createInvitation = this.createInvitation.bind(this);
    }
    /**
     * @method
     * @summary Authenticates the application
     * @param {string} clientId The identity of the client
     * @param {string} clientSecret The secret of the client
     * @returns {Principal} The authenticated application
     */
    async authenticateClientApplication(clientId, clientSecret) {
        // Get the application and verify
        var application = await repository.applicationRepository.getByNameSecret(clientId, clientSecret);
        if(application.deactivationTime)
            throw new exception.Exception("Application has been deactivated", exception.ErrorCodes.SECURITY_ERROR);
        await application.loadGrants();
        return new security.Principal(application);
    }

    /**
     * @method 
     * @summary Performs the necessary business process of logging the user in
     * @param {SecurityPrincipal} clientPrincipal The application or client that the user is using
     * @param {string} username The username of the user wishing to login
     * @param {string} password The password that the user entered
     * @param {string} scope The scope which the session should be established for.
     * @returns {Principal} The authenticated user principal
     */
    async establishSession(clientPrincipal, username, password, scope, remote_ip) {

        // Ensure that the application information is loaded
        await clientPrincipal.session.loadApplication();
        var application = clientPrincipal.session.application;

        try {
            var user = await repository.userRepository.getByNameSecret(username, password);
            
            // User was successful but their account is still locked
            if(user.lockout > new Date())
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED);
            else if(user.deactivationTime && user.deactivationTime < new Date())
                throw new exception.Exception("Account has been deactivated", exception.ErrorCodes.UNAUTHORIZED);
        }
        catch(e) {
            console.error("Error performing authentication: " + e.message);
            // Attempt to increment the invalid login count
            var invalidUser = await repository.userRepository.incrementLoginFailure(username, config.security.maxFailedLogin);
            if(invalidUser.lockout) 
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED, e);
            throw e;
        }

        try {
            // Success, reset the user invalid logins
            user.invalidLogins = 0;
            user.lastLogin = new Date();
            
            await repository.userRepository.update(user);

            // Create the session object
            var session = new model.Session(user, application, scope, config.security.sessionLength, remote_ip);
            session = await repository.sessionRepository.insert(session);
            await session.loadGrants();
            return new security.Principal(session);
        }
        catch(e) {
            console.error("Error finalizing authentication: " + e.message);
            throw new exception.Exception("Error finalizing authentication", exception.ErrorCodes.SECURITY_ERROR, e);
        }
    }

    /**
     * @method
     * @summary Establishes a client session
     * @param {SecurityPrincipal} clientPrincipal The client principal to be established as a session
     * @param {string} remoteAddr The remote address to be used
     */
    async establishClientSession(clientPrincipal, scope, remoteAddr) {

        try {
 
            var nilUser = await repository.userRepository.get("00000000-0000-0000-0000-000000000000");
            var session = new model.Session(nilUser, clientPrincipal._session.application, scope, config.security.sessionLength, remoteAddr);
            session = await repository.sessionRepository.insert(session);
            await session.loadGrants();
            return new security.Principal(session);
        }
        catch(e) {
            console.error("Error finalizing client authentication " + e.message);
            throw new exception.Exception("Error finalizing authentication", exception.ErrorCodes.SECURITY_ERROR, e);
        }
    }

    /**
     * @method
     * @summary Refreshes the specified session to which the refreshToken belongs
     * @param {SecurityPrincipal} clientPrincipal The principal of the application (must match the original application which the session was given to)
     * @param {string} refreshToken The refresh token
     * @param {string} remoteAddr The remote address of the client making this session
     */
    async refreshSession(clientPrincipal, refreshToken, remoteAddr) {

        // Ensure that the application information is loaded
        await clientPrincipal.session.loadApplication();
        var application = clientPrincipal.session.application;
    
        try {
            var session = await repository.transaction(async (_tx) => {

                // Get session
                var session = await repository.sessionRepository.getByRefreshToken(refreshToken, config.security.refreshValidity, _tx);
                if(session == null)
                    throw new exception.Exception("Invalid refresh token", exception.ErrorCodes.SECURITY_ERROR);
                else if(session.applicationId != application.id)
                    throw new exception.Exception("Refresh must be performed by originator", exception.ErrorCodes.SECURITY_ERROR);
                // Abandon the existing session
                await repository.sessionRepository.abandon(session.id, _tx);

                // Establish a new session
                return await repository.sessionRepository.insert(
                    new model.Session(session.userId, session.applicationId, session.audience, config.security.sessionLength, remoteAddr),
                    null,
                    _tx
                );
                
            }); 

            await session.loadGrants();
            await session.loadUser();
            return new security.Principal(session);
        }
        catch(e) {
            console.error("Error refreshing session: " + e.message);
            throw new exception.Exception("Error refreshing session", exception.ErrorCodes.SECURITY_ERROR, e);
        }
    }

    /**
     * @method
     * @summary Register a regular user 
     * @param {User} user The user to be registered
     * @param {string} password The password to set on the user
     */
    async registerInternalUser(user, password) {

        // First we register the user in our DB
        try {

            // Validate the user
            this.validateUser(user, password);

            await repository.transaction(async (_txc) => {

                // Insert the user
                var retVal = await repository.userRepository.insert(user, password, null, _txc);
                await repository.groupRepository.addUser(config.security.sysgroups.users, retVal.id, null, _txc);
                return retVal;

            });

            return user;
        }
        catch(e) {
            console.error("Error finalizing authentication: " + e.message);
            throw new exception.Exception("Error registering user", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Register a wallet on the stellar network
     * @param {string} userId The user for which the wallet should be created
     */
    async createStellarWalletForUser(userId) {

        try {

            return await repository.transact(async (_txc) => {
                
                // Create stellar client
                var stellarClient = await new StellarClient(config.stellar.horizon_server, await repository.assetRepository.query(), config.stellar.testnet_use);

                // Verify user
                var user = await repository.userRepository.get(userId, _txc);

                // Does user already have wallet?
                if(!(await user.loadWallet()))
                    throw new exception.BusinessRuleViolationException(new exception.RuleViolation("User already has a wallet", exception.ErrorCodes.DATA_ERROR, exception.RuleViolationSeverity.ERROR));

                // Create a wallet
                var wallet = await stellarClient.generateAccount();

                // Insert 
                wallet = await repository.walletRepository.insert(wallet, null, _txc);
                
                // Update user
                user.walletId = wallet.id;
                await repository.userRepository.update(user, null, null, _txc);

                return wallet;
            });
        }
        catch(e) {
            console.error("Error finalizing authentication: " + e.message);
            throw new exception.Exception("Error creating waller user", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Registers a users from an external provider
     * @param {*} identity Represents information about an external identity
     * @param {string} identity.provider The provider key for the external identity
     * @param {string} identity.username The user's identity name on the external provider
     * @param {string} identity.password The user's identity name on the external provider
     * @param {string} identity.key The key or token that was used to access the external provider
     */
    async registerExternalUser(identity) {
        throw new exception.NotImplementedException();
    }

    /**
     * @method
     * @summary Updates the specified user setting their new password if necessary
     * @param {User} user The user to be updated
     * @param {string} newPassword The new password to set the user account to
     * @returns {User} The updated user
     */
    async updateUser(user, newPassword) {
        try {

            // Validate the user
            this.validateUser(user, newPassword);

            // Update the user
            return await repository.userRepository.update(user, newPassword);
        }
        catch(e) {
            console.error("Error updating user: " + e.message);
            throw new exception.Exception("Error updating user", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Ensures that the user object is valid
     * @param {User} user The user to be validated
     * @param {string} password The password the user is attempting to set
     * @returns {boolean} True if the user passed validation
     * @throws {BusinessRuleViolationException} When there are problems with the user
     */
    validateUser(user, password) {

        var ruleViolations = [];
        if(user.name && !new RegExp(config.security.username_regex).test(user.name))
            ruleViolations.push(new exception.RuleViolation("Username format invalid", exception.ErrorCodes.INVALID_USERNAME, exception.RuleViolationSeverity.ERROR));
        if(password && !new RegExp(config.security.password_regex).test(password))
            ruleViolations.push(new exception.RuleViolation("Password does not meet complexity requirements", exception.ErrorCodes.PASSWORD_COMPLEXITY, exception.RuleViolationSeverity.ERROR));

        if(ruleViolations.length > 0)
            throw new exception.BusinessRuleViolationException(ruleViolations);
        
        return true;
    }

    /**
     * @method
     * @summary Create an invitation on the data store
     * @param {Invitation} invitation The invitation information that is to be created
     * @param {SecurityPrincipal} clientPrincipal The principal which is creating the invitation
     * @returns {Invitation} The created invitation
     */
    async createInvitation(invitation, clientPrincipal) {

        try {
            var claimToken = crypto.randomBytes(32).toString('hex');

            // Verify e-mail address is properly formatted
            if(!invitation.email || !new RegExp(config.security.email_regex).test(invitation.email))
                throw new exception.ArgumentException("email");
            if(!config.security.invitations.enabled)
                throw new exception.Exception("Invitations are disabled on this server", exception.ErrorCodes.UNAUTHORIZED);

            // Insert the invitation
            return await repository.transaction(async (_txc) => {

                // First let's insert the data - That is cool 
                invitation = await repository.invitationRepository.insert(invitation, claimToken, config.security.invitations.validityTime, clientPrincipal, _txc);

                // Next - We want to prepare an e-mail
                var sendOptions = {
                    to: invitation.email,
                    from: config.mail.from,
                    subject: "Your wallet is waiting for you on UHX!"
                };

                // Replacements
                const replacements = {
                    invitation:invitation,
                    claimToken: claimToken,
                    claimSig: crypto.createHmac('sha256', config.security.hmac256secret).update(claimToken).digest('hex'),
                    claimUrl: config.security.invitations.claimUrl,
                    sender: clientPrincipal.session.userId != "00000000-0000-0000-0000-000000000000" ? (await clientPrincipal.session.loadUser()).name : (await clientPrincipal.session.loadApplication()).name
                }

                // Create e-mails from templates
                if(fs.existsSync(config.mail.templates.invitation + ".html"))
                    sendOptions.html = handlebars.compile(fs.readFileSync(config.mail.templates.invitation + ".html").toString("utf-8"))(replacements);
                if(fs.existsSync(config.mail.templates.invitation + ".txt"))
                    sendOptions.text = handlebars.compile(fs.readFileSync(config.mail.templates.invitation + ".txt").toString("utf-8"))(replacements);

                var transport = nodemailer.createTransport(config.mail.smtp);
                await transport.sendMail(sendOptions);
                console.info(`Invitation has successfully been sent to ${invitation.email}`);

                return invitation;
            });
        }
        catch(e) {
            console.error(`Error finalizing invitation: ${e.message}`);
            throw new exception.Exception("Error finalizing invitation", exception.ErrorCodes.UNKNOWN, e);
        }
    }

 }


 // Exports section
 module.exports.SecurityLogic = new SecurityLogic();
 module.exports.Config = config;
 module.exports.Repositories = repository;