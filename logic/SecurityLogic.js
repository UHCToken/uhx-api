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

const uhc = require('../uhc'),
    exception = require('../exception'),
    security = require('../security'),
    StellarClient = require('../integration/stellar'),
    model = require('../model/model'),
    User = require('../model/User'),
    crypto = require('crypto'),
    fs = require('fs');

/**
  * @class
  * @summary Represents the core business logic of the UHC application
  */
 module.exports = class SecurityLogic {

    /**
     * @constructor
     * @summary Binds methods to "this"
     */
    constructor() {
        this.authenticateClientApplication = this.authenticateClientApplication.bind(this);
        this.establishSession = this.establishSession.bind(this);
        this.refreshSession = this.refreshSession.bind(this);
        this.registerInternalUser = this.registerInternalUser.bind(this);
        this.createStellarWallet = this.activateStellarWalletForUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.validateUser = this.validateUser.bind(this);
        this.createInvitation = this.createInvitation.bind(this);
        this.getStellarClient = this.getStellarClient.bind(this);
        this.initiatePasswordReset = this.initiatePasswordReset.bind(this);
    }

    /**
     * @method
     * @summary Gets or creates the stellar client
     * @returns {StellarClient} The stellar client
     */
    async getStellarClient() {
        if(!this._stellarClient)
            this._stellarClient = new StellarClient(uhc.Config.stellar.horizon_server, await uhc.Repositories.assetRepository.query(), uhc.Config.stellar.testnet_use);
        return this._stellarClient;
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
        var application = await uhc.Repositories.applicationRepository.getByNameSecret(clientId, clientSecret);
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
     * @param {string} tfa_secret The one time TFA secret to be used
     * @returns {Principal} The authenticated user principal
     */
    async establishSession(clientPrincipal, username, password, scope, tfa_secret, remote_ip) {

        // Ensure that the application information is loaded
        await clientPrincipal.session.loadApplication();
        var application = clientPrincipal.session.application;

        try {
            var user = await uhc.Repositories.userRepository.getByNameSecret(username, password);
            
            // User was successful but their account is still locked
            if(user.lockout > new Date())
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED);
            else if(user.deactivationTime && user.deactivationTime < new Date())
                throw new exception.Exception("Account has been deactivated", exception.ErrorCodes.UNAUTHORIZED);

            var tfa = await user.loadTfaMethod();
            if(tfa && !tfa_secret)  // SEND TFA code and FAIL login
            {
                // Send code
                await uhc.Repositories.transaction(async (_txc) => {
                    var tfaToken = this.generateSignedClaimToken('tfa');
                    await uhc.Repositories.userRepository.deleteClaim(user.id, "$tfa.secret");
                    await uhc.Repositories.userRepository.addClaim(user.id, {
                        type: "$tfa.secret",
                        value: tfaToken,
                        expiry: new Date(new Date().getTime() + uhc.Config.security.tfaValidity)
                    });
                    await require(tfa)(user, tfaToken);
                });
                throw new exception.Exception("Account requires TFA code", exception.ErrorCodes.TFA_REQUIRED);
            }
            else if(tfa) { // Verify the TFA
                if(!await uhc.Repositories.userRepository.assertClaim(user.id, "$tfa.secret", tfa_secret))
                    throw new exception.Exception("Invalid TFA code", exception.ErrorCodes.TFA_FAILED);
            }
        }
        catch(e) {
            uhc.log.error("Error performing authentication: " + e.message);

            // TFA is required, this is not necessarily a login failure
            if(e.code && e.code == exception.ErrorCodes.TFA_REQUIRED) 
                throw e;

            // Attempt to increment the invalid login count
            var invalidUser = await uhc.Repositories.userRepository.incrementLoginFailure(username, uhc.Config.security.maxFailedLogin);
            if(invalidUser.lockout) 
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED, e);
            throw e;
        }

        try {
            // Success, reset the user invalid logins
            var session = await uhc.Repositories.transaction(async (_txc) => {
                user.invalidLogins = 0;
                user.lastLogin = new Date();
                
                await uhc.Repositories.userRepository.update(user);
    
                // Create the session object
                var ses = new model.Session(user, application, scope, uhc.Config.security.sessionLength, remote_ip);
                return await uhc.Repositories.sessionRepository.insert(ses);
            });
            await session.loadGrants();
            return new security.Principal(session);
        }
        catch(e) {
            uhc.log.error("Error finalizing authentication: " + e.message);
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
 
            var nilUser = await uhc.Repositories.userRepository.get("00000000-0000-0000-0000-000000000000");
            var session = new model.Session(nilUser, clientPrincipal._session.application, scope, uhc.Config.security.sessionLength, remoteAddr);
            session = await uhc.Repositories.sessionRepository.insert(session);
            await session.loadGrants();
            return new security.Principal(session);
        }
        catch(e) {
            uhc.log.error("Error finalizing client authentication " + e.message);
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
            var session = await uhc.Repositories.transaction(async (_txc) => {

                // Get session
                var session = await uhc.Repositories.sessionRepository.getByRefreshToken(refreshToken, uhc.Config.security.refreshValidity, _tx);
                if(session == null)
                    throw new exception.Exception("Invalid refresh token", exception.ErrorCodes.SECURITY_ERROR);
                else if(session.applicationId != application.id)
                    throw new exception.Exception("Refresh must be performed by originator", exception.ErrorCodes.SECURITY_ERROR);
                // Abandon the existing session
                await uhc.Repositories.sessionRepository.abandon(session.id, _tx);

                // Establish a new session
                return await uhc.Repositories.sessionRepository.insert(
                    new model.Session(session.userId, session.applicationId, session.audience, uhc.Config.security.sessionLength, remoteAddr),
                    null,
                    _tx
                );
                
            }); 
        
            await session.loadGrants();
            await session.loadUser();
            return new security.Principal(session);
        }
        catch(e) {
            uhc.log.error("Error refreshing session: " + e.message);
            throw new exception.Exception("Error refreshing session", exception.ErrorCodes.SECURITY_ERROR, e);
        }
    }

    /**
     * @method
     * @summary Initiates the password reset workflow
     * @param {string} email The e-mail address of the user
     * @param {string} tel The telephone number of the user
     */
    async initiatePasswordReset(email, tel) {

        try {

            await uhc.Repositories.transaction(async (_txc)=>{

                // Get the user
                var users = await uhc.Repositories.userRepository.query(new User().copy({email: email, tel: tel}), 0, 1, _txc);
                if(users.length == 0)
                    return null;
                var user = users[0];
                // Cancel any current claim the user has for reset
                await uhc.Repositories.userRepository.deleteClaim(user.id, "$reset.password", _txc);

                // Generate the token
                var claimToken = this.generateSignedClaimToken('tfa');
                await uhc.Repositories.userRepository.addClaim(user.id, {
                    type: "$reset.password",
                    value: claimToken,
                    expiry: new Date(new Date().getTime() + uhc.Config.security.resetValidity)
                });

                // Generate e-mail 
                if(email && user.emailVerified) {
                    var options = {
                        to: email,
                        from: uhc.Config.mail.from,
                        subject: "Reset your UHX password",
                        template: uhc.Config.mail.templates.resetPassword
                    };
                    await uhc.Mailer.sendEmail(options, { user: user, token: claimToken });
                }
                else if(tel && user.telVerified) {
                    var options = {
                        to: user.tel,
                        template: uhc.Config.mail.templates.resetPassword
                    };
                    await uhc.Mailer.sendSms(options, { user: user, token: claimToken });
                }
                
            });

        }
        catch (e) {
            uhc.log.error("Error creating reset password workflow: " + e.message);
            throw new exception.Exception("Error creating password refresh token: " + e.message, e.code || exception.ErrorCodes.UNKNOWN, e);
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

            await uhc.Repositories.transaction(async (_txc) => {

                // Insert the user
                var stellarClient = await this.getStellarClient();
                var wallet = await stellarClient.generateAccount();
                wallet = await uhc.Repositories.walletRepository.insert(wallet, null, _txc);
                user.walletId = wallet.id;
                var retVal = await uhc.Repositories.userRepository.insert(user, password, null, _txc);
                await uhc.Repositories.groupRepository.addUser(uhc.Config.security.sysgroups.users, retVal.id, null, _txc);
                await this.sendConfirmationEmail(user, _txc);
                return retVal;
            });

            return user;
        }
        catch(e) {
            uhc.log.error("Error finalizing authentication: " + e.message);
            throw new exception.Exception("Error registering user", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Register a wallet on the stellar network
     * @param {string} userId The user for which the wallet should be created
     */
    async activateStellarWalletForUser(userId) {

        try {

            return await uhc.Repositories.transact(async (_txc) => {
                
                // Create stellar client
                var stellarClient = await this.getStellarClient();
                
                // Verify user
                var user = await uhc.Repositories.userRepository.get(userId, _txc);

                // Does user already have wallet?
                var wallet = await user.loadWallet();
                if(!wallet) { // Generate a KP
                    // Create a wallet
                    var wallet = await stellarClient.generateAccount();
                    // Insert 
                    wallet = await uhc.Repositories.walletRepository.insert(wallet, null, _txc);
                    // Update user
                    user.walletId = wallet.id;
                    await uhc.Repositories.userRepository.update(user, null, null, _txc);
                }

                // Activate wallet if not already active
                if(!stellarClient.isActive(wallet))
                    await stellarClient.activateAccount(wallet, "1",  await testRepository.walletRepository.get(uhc.Config.stellar.initiator_wallet_id));
                return wallet;
            });
        }
        catch(e) {
            uhc.log.error("Error finalizing authentication: " + e.message);
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

            return await uhc.Repositories.transaction(async (_txc) => {

                // Get existing user
                var existingUser = await uhc.Repositories.userRepository.get(user.id);

                // Was the user's e-mail address verified? 
                if(existingUser.emailVerified && existingUser.email != user.email) {

                    // Undo token
                    var undoToken = this.generateSignedClaimToken();
                    await uhc.Repositories.userRepository.addClaim(user.id, {
                        type: "$undo.email",
                        value: undoToken,
                        expiry: new Date(new Date().getTime() + uhc.Config.security.confirmationValidaty)
                     }, _txc);

                    // We want to send an e-mail to the previous e-mail address notifying the user of the change
                    await uhc.Mailer.sendEmail({
                        to: existingUser.email,
                        from: uhc.Config.mail.from,
                        subject: "Did you change your e-mail address?",
                        template: uhc.Config.mail.templates.emailChange
                    }, { old: existingUser, new: user, token: undoToken, ui_base: uhc.Config.api.ui_base });

                    // TODO: We want to send a confirmation e-mail to the e-mail address
                    await this.sendConfirmationEmail(user);
                    user.emailVerified = false;
                }
                // Update the user
                return await uhc.Repositories.userRepository.update(user, newPassword, null, _txc);

            });
        }
        catch(e) {
            uhc.log.error("Error updating user: " + e.message);
            throw new exception.Exception("Error updating user", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Sends an e-mail to the user to confirm their e-mail address
     * @param {User} user The user for which the confirmation e-mail should be sent
     * @param {*} _txc If the operation is being performed as part of a transaction then this is the transaction
     */
    async sendConfirmationEmail(user, _txc) {
        try {
            var confirmToken = this.generateSignedClaimToken();
            await uhc.Repositories.userRepository.addClaim(user.id, {
                type: "$confirm.email",
                value: confirmToken,
                expiry: new Date(new Date().getTime() + uhc.Config.security.confirmationValidaty)
            }, _txc);

            // We want to send an e-mail to the previous e-mail address notifying the user of the change
            await uhc.Mailer.sendEmail({
                to: user.email,
                from: uhc.Config.mail.from,
                subject: "Confirm your e-mail address on UHX",
                template: uhc.Config.mail.templates.confirmation
            }, { user: user, token: confirmToken, ui_base: uhc.Config.api.ui_base });

        }
        catch(e) {
            uhc.log.error(`Error sending confirmation e-mail: ${JSON.stringify(e)}`);
            throw e;
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
        if(user.name && !new RegExp(uhc.Config.security.username_regex).test(user.name))
            ruleViolations.push(new exception.RuleViolation("Username format invalid", exception.ErrorCodes.INVALID_NAME, exception.RuleViolationSeverity.ERROR));
        if(password && !new RegExp(uhc.Config.security.password_regex).test(password))
            ruleViolations.push(new exception.RuleViolation("Password does not meet complexity requirements", exception.ErrorCodes.PASSWORD_COMPLEXITY, exception.RuleViolationSeverity.ERROR));

        if(ruleViolations.length > 0)
            throw new exception.BusinessRuleViolationException(ruleViolations);
        
        return true;
    }

    /**
     * @method
     * @summary Claims an invitation
     * @param {string} invitationToken The invitation token taken from the user
     * @param {string} initialPassword The initial password of the user
     * @returns {User} The created user
     */
    async claimInvitation(invitationToken, initialPassword, principal) {

        try {

            // First validate the token
            var tokenParts = invitationToken.split(".");
            if(tokenParts.length != 2)
                throw new exception.ArgumentException("invitationToken");
            else if(tokenParts[1] != crypto.createHmac('sha256', uhc.Config.security.hmac256secret).update(tokenParts[0]).digest('hex'))
                throw new exception.Exception("Token signature does not match", exception.ErrorCodes.SECURITY_ERROR);

            // Fetch the invitation
            var invitation = await uhc.Repositories.invitationRepository.getByClaimToken(tokenParts[0]);

            // Create a user
            var user = new User().copy(invitation);
            user.name = invitation.email;
            user.emailVerified = true;

            // Validate the user
            this.validateUser(user, initialPassword);

            // Now a transaction to interact with the DB
            return await uhc.Repositories.transaction(async (_txc) => {

                // Insert the user and assign to user group
                user = await uhc.Repositories.userRepository.insert(user, initialPassword, principal, _txc);
                await uhc.Repositories.groupRepository.addUser(uhc.Config.security.sysgroups.users, user.id, principal, _txc);

                // Now we want to claim the token
                await uhc.Repositories.invitationRepository.claim(invitation.id, user, _txc);

                // Now we want to notify the user
                var sendOptions = {
                    to: user.email,
                    from: uhc.Config.mail.from,
                    subject: "Welcome to the UHX community!",
                    template: uhc.Config.mail.templates.welcome
                };
                // Replacements
                const replacements = {
                    user: user,
                    ui_base: uhc.Config.api.ui_base
                }
                await uhc.Mailer.sendEmail(sendOptions, replacements);

                // Return the user
                return user;
            });

        }
        catch(e) {
            uhc.log.error(`Error claiming invitation: ${JSON.stringify(e)}`);
            throw new exception.Exception("Error claiming invitation", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Generates and signs a random token
     * @param {string} type Identifies the applicable method for gneerating a sign token (email can have longer tokens than sms for example)
     * @returns {string} The generated and signed claim token
     */
    generateSignedClaimToken(type) {
        switch(type) {
            case "tfa": // Generate a random 6 byte string which may or may not be unique
            {
                var token = "";
                var bytes = crypto.randomBytes(8);
                bytes.forEach((o)=>{ token += o % 10 });
                token += (bytes.reduce((a,b)=>a+b) % 10);
                return token;
            }
            case "8byte": // a shorter 8 byte code
            {
                var token = crypto.randomBytes(8).toString('hex');
                
                var sig = crypto.createHmac('sha256', uhc.Config.security.hmac256secret).update(token).digest('hex');
                return token + "." + sig;
            }                
            default: {
                var token = crypto.randomBytes(32).toString('hex');
                var sig = crypto.createHmac('sha256', uhc.Config.security.hmac256secret).update(token).digest('hex');
                return token + "." + sig;
            }
        }
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
            var claimToken = this.generateSignedClaimToken();

            // Verify e-mail address is properly formatted
            if(!invitation.email || !new RegExp(uhc.Config.security.email_regex).test(invitation.email))
                throw new exception.ArgumentException("email");
            if(!uhc.Config.security.invitations.enabled)
                throw new exception.Exception("Invitations are disabled on this server", exception.ErrorCodes.UNAUTHORIZED);

            // Insert the invitation
            return await uhc.Repositories.transaction(async (_txc) => {

                // First let's insert the data - That is cool 
                invitation = await uhc.Repositories.invitationRepository.insert(invitation, claimToken, uhc.Config.security.invitations.validityTime, clientPrincipal, _txc);

                // Next - We want to prepare an e-mail
                var sendOptions = {
                    to: invitation.email,
                    from: uhc.Config.mail.from,
                    subject: "Your wallet is waiting for you on UHX!",
                    template: uhc.Config.mail.templates.invitation
                };

                // Replacements
                const replacements = {
                    invitation:invitation,
                    claimToken: claimToken,
                    sender: clientPrincipal.session.userId != "00000000-0000-0000-0000-000000000000" ? (await clientPrincipal.session.loadUser()).name : (await clientPrincipal.session.loadApplication()).name, 
                    ui_base: uhc.Config.api.ui_base
                }

                await uhc.Mailer.sendEmail(sendOptions, replacements);
                return invitation;
            });
        }
        catch(e) {
            uhc.log.error(`Error finalizing invitation: ${e.message}`);
            throw new exception.Exception("Error finalizing invitation", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

 }
