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

const uhx = require('../uhx'),
    exception = require('../exception'),
    security = require('../security'),
    StellarClient = require('../integration/stellar'),
    Web3Client = require('../integration/web3'),
    model = require('../model/model'),
    User = require('../model/User'),
    clone = require('clone'),
    crypto = require('crypto'),
    fs = require('fs');

const PASSWORD_RESET_CLAIM = "$reset.password",
    EMAIL_CONFIRM_CLAIM = "$confirm.email",
    UNDO_CHANGE_CLAIM = "$undo.email",
    SMS_CONFIRM_CLAIM = "$confirm.sms",
    TFA_CLAIM = "$tfa.secret";
/**
  * @class
  * @summary Represents the core business logic of the UhX application
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
        this.initiatePasswordReset = this.initiatePasswordReset.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.confirmContact = this.confirmContact.bind(this);
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
        var application = await uhx.Repositories.applicationRepository.getByNameSecret(clientId, clientSecret);
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
            var user = await uhx.Repositories.userRepository.getByNameSecret(username, password);
            
            // User was successful but their account is still locked
            if(!user)
                throw new exception.Exception("Invalid username or password", exception.ErrorCodes.INVALID_ACCOUNT);
            else if(user.lockout > new Date())
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED);
            else if(user.deactivationTime && user.deactivationTime < new Date())
                throw new exception.Exception("Account has been deactivated", exception.ErrorCodes.UNAUTHORIZED);

            var tfa = await user.loadTfaMethod();
            if(tfa && !tfa_secret)  // SEND TFA code and FAIL login
            {
                // Send code
                await uhx.Repositories.transaction(async (_txc) => {
                    var tfaToken = this.generateSignedClaimToken('tfa');
                    await uhx.Repositories.userRepository.deleteClaim(user.id, TFA_CLAIM);
                    await uhx.Repositories.userRepository.addClaim(user.id, {
                        type: TFA_CLAIM,
                        value: tfaToken,
                        expiry: new Date(new Date().getTime() + uhx.Config.security.tfaValidity)
                    });
                    await require(tfa)(user, tfaToken);
                });
                throw new exception.Exception("Account requires TFA code", exception.ErrorCodes.TFA_REQUIRED);
            }
            else if(tfa) { // Verify the TFA
                if(!await uhx.Repositories.userRepository.assertClaim(user.id, TFA_CLAIM, tfa_secret))
                    throw new exception.Exception("Invalid TFA code", exception.ErrorCodes.TFA_FAILED);
            }
        }
        catch(e) {
            uhx.log.error("Error performing authentication: " + e.message);

            // TFA is required, this is not necessarily a login failure
            if(e.code && e.code == exception.ErrorCodes.TFA_REQUIRED)
                throw e;

            // Attempt to increment the invalid login count
            var invalidUser = await uhx.Repositories.userRepository.incrementLoginFailure(username, uhx.Config.security.maxFailedLogin);
            
            if(invalidUser && invalidUser.lockout) 
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED, e);
            else if(e.code == exception.ErrorCodes.NOT_FOUND)
                throw new exception.Exception("Invalid username or password", exception.ErrorCodes.INVALID_ACCOUNT);

            throw e;
        }

        try {
            // Success, reset the user invalid logins
            var session = await uhx.Repositories.transaction(async (_txc) => {
                user.invalidLogins = 0;
                user.lastLogin = new Date();
                
                await uhx.Repositories.userRepository.update(user);
    
                // Create the session object
                var ses = new model.Session(user, application, scope, uhx.Config.security.sessionLength, remote_ip);
                return await uhx.Repositories.sessionRepository.insert(ses);
            });
            await session.loadGrants();
            return new security.Principal(session);
        }
        catch(e) {
            uhx.log.error("Error finalizing authentication: " + e.message);
            throw new exception.Exception("Error finalizing authentication", exception.ErrorCodes.SECURITY_ERROR, e);
        }
    }

    /**
     * @method
     * @summary Completes the confirmation process
     * @param {string} code The confirmation code to be validated
     * @param {SecurityPrincipal} principal The security principal
     * @returns {void}
     */
    async confirmContact(code, principal) {

        try {
            this.validateSignedClaimToken(code);

            var success = false;
            // Now we want to do one of two things, first: 
            // If the code is a 9 digit short code, principal must be a user 
            if(code.length == 9 && !await principal.session.loadUser())
                throw new exception.Exception("Short codes can only be verified from an existing principal", exception.ErrorCodes.ARGUMENT_EXCEPTION);
            else if(code.length == 9) { // 9 digit assertion - we want to verify
                 success = await uhx.Repositories.transaction(async (_txc) => {
                     // Email confirmation code
                    if(await uhx.Repositories.userRepository.assertClaim(principal.session.userId, EMAIL_CONFIRM_CLAIM, code, _txc)) // code is an email confirm claim
                    {
                        await uhx.Repositories.userRepository.update(new User().copy({id: principal.session.userId, emailVerified: true}), null, principal, _txc);
                        await uhx.Repositories.userRepository.deleteClaim(principal.session.userId, EMAIL_CONFIRM_CLAIM, _txc);
                        return true;
                    }
                    // SMS confirmation code
                    else if(await uhx.Repositories.userRepository.assertClaim(principal.session.userId, SMS_CONFIRM_CLAIM, code, _txc))
                    {
                        await uhx.Repositories.userRepository.update(new User().copy({id: principal.session.userId, telVerified: true}), null, principal, _txc);
                        await uhx.Repositories.userRepository.deleteClaim(principal.session.userId, SMS_CONFIRM_CLAIM, _txc);
                        return true;
                    }
                    else
                        return false;
                 });
            }
            else  // Confirm e-mail anonymously
                success = await uhx.Repositories.transaction(async (_txc) => {
                    var user = await uhx.Repositories.userRepository.getByClaim(EMAIL_CONFIRM_CLAIM, code, _txc);
                    if(user.length > 0) {
                        user[0].emailVerified = true;
                        await uhx.Repositories.userRepository.update(user[0], null, principal, _txc);
                        return true;
                    }
                    return false;
                });
            
            // Outcome?
            if(!success)
                throw new exception.Exception("Could not verify contact information. Token appears to be invalid", exception.ErrorCodes.RULES_VIOLATION);
            
        }
        catch (e) {
            uhx.log.error(`Error confirming contact information: ${e.message}`);
            throw new exception.Exception("Error confirming contact information", e.code || exception.ErrorCodes.UNKNOWN, e);
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
 
            var nilUser = await uhx.Repositories.userRepository.get("00000000-0000-0000-0000-000000000000");
            var session = new model.Session(nilUser, clientPrincipal._session.application, scope, uhx.Config.security.sessionLength, remoteAddr);
            session = await uhx.Repositories.sessionRepository.insert(session);
            await session.loadGrants();
            return new security.Principal(session);
        }
        catch(e) {
            uhx.log.error("Error finalizing client authentication " + e.message);
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
            var session = await uhx.Repositories.transaction(async (_txc) => {

                // Get session
                var session = await uhx.Repositories.sessionRepository.getByRefreshToken(refreshToken, uhx.Config.security.refreshValidity, _txc);
                if(session == null)
                    throw new exception.Exception("Invalid refresh token", exception.ErrorCodes.SECURITY_ERROR);
                else if(session.applicationId != application.id)
                    throw new exception.Exception("Refresh must be performed by originator", exception.ErrorCodes.SECURITY_ERROR);
                // Abandon the existing session
                await uhx.Repositories.sessionRepository.abandon(session.id, _txc);

                // Establish a new session
                return await uhx.Repositories.sessionRepository.insert(
                    new model.Session(session.userId, session.applicationId, session.audience, uhx.Config.security.sessionLength, remoteAddr),
                    null,
                    _txc
                );
                
            }); 
        
            await session.loadGrants();
            await session.loadUser();
            uhx.log.info(`Session ${session.id} was successfully refreshed`);
            return new security.Principal(session);
        }
        catch(e) {
            uhx.log.error("Error refreshing session: " + e.message);
            throw new exception.Exception("Error refreshing session", exception.ErrorCodes.SECURITY_ERROR, e);
        }
    }

    /**
     * @method
     * @summary Resets the user's password
     * @param {string} code The password reset token
     * @param {string} newPassword The new password to be set
     * @returns {void}
     */
    async resetPassword(code, newPassword) {

        try {
            // Verify the code against signature
            this.validateSignedClaimToken(code);
            // Get the user by claim
            await uhx.Repositories.transaction(async (_txc) => {
                var user = await uhx.Repositories.userRepository.getByClaim(PASSWORD_RESET_CLAIM, code, _txc);
                this.validateUser(user, newPassword);
                if(user.length == 0)
                    throw new exception.Exception("Invalid reset token", exception.ErrorCodes.SECURITY_ERROR);
                else  {
                    user[0].lockout = null;
                    user[0].invalidLogins = 0;
                    await uhx.Repositories.userRepository.update(user[0], newPassword, _txc);
                    await uhx.Repositories.userRepository.deleteClaim(user[0].id, PASSWORD_RESET_CLAIM, _txc);
                }
                // Notify the user that their password has been reset
                if(user[0].emailVerified && user[0].email) 
                {
                    await uhx.Mailer.sendEmail({
                        template: uhx.Config.mail.templates.passwordChange,
                        to: user[0].email,
                        from: uhx.Config.mail.from,
                        subject: "Your UhX password has been reset!"
                    }, { user: user[0] });
                }
                else if(user[0].telVerified && user[0].tel)
                {
                    await uhx.Mailer.sendSms({
                        to: user[0].tel,
                        template: uhx.Config.mail.templates.passwordChange
                    }, { user: user });
                }
            });
        }
        catch(e) {
            uhx.log.error(`Error resetting password: ${e.message}`);
            throw new exception.Exception("Error resetting password", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Initiates the password reset workflow
     * @param {string} email The e-mail address of the user
     * @param {string} tel The telephone number of the user
     * @returns {void}
     */
    async initiatePasswordReset(email, tel) {

        try {

            await uhx.Repositories.transaction(async (_txc)=>{

                // Get the user
                var users = await uhx.Repositories.userRepository.query(new User().copy({email: email, tel: tel}), 0, 1, null, _txc);
                if(users.length == 0)
                    return null;
                var user = users[0];
                // Cancel any current claim the user has for reset
                await uhx.Repositories.userRepository.deleteClaim(user.id, PASSWORD_RESET_CLAIM, _txc);

                // Generate the token
                var claimToken = this.generateSignedClaimToken();
                await uhx.Repositories.userRepository.addClaim(user.id, {
                    type: PASSWORD_RESET_CLAIM,
                    value: claimToken,
                    expiry: new Date(new Date().getTime() + uhx.Config.security.resetValidity)
                });

                // Generate e-mail 
                    var options = {
                        to: email,
                        from: uhx.Config.mail.from,
                        subject: "Reset your UhX password",
                        template: uhx.Config.mail.templates.resetPassword
                    };
                    await uhx.Mailer.sendEmail(options, { user: user, token: claimToken, ui_base: uhx.Config.api.ui_base });
                
                /*else if(tel)
                    throw new exception.NotImplementedException("SMS password resets are disabled");*/
                // else if(tel && user.telVerified) {
                //     var options = {
                //         to: user.tel,
                //         template: uhx.Config.mail.templates.resetPassword
                //     };
                //     await uhx.Mailer.sendSms(options, { user: user, token: claimToken, ui_base: uhx.Config.api.ui_base });
                // }
                
            });

        }
        catch (e) {
            uhx.log.error("Error creating reset password workflow: " + e.message);
            throw new exception.Exception("Error creating password refresh token: " + e.message, e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Register a regular user 
     * @param {User} user The user to be registered
     * @param {string} password The password to set on the user
     * @param {SecurityPrincipal} principal The user which is creating this user
     */
    async registerInternalUser(user, password, principal) {

        // First we register the user in our DB
        try {
                
            // Validate the user
            this.validateUser(user, password);
            await uhx.Repositories.transaction(async (_txc) => {

                // TODO: Refactor this for each accepted network

                // Insert the user
                var stellarClient = uhx.StellarClient;
                var strWallet = await stellarClient.generateAccount();
                var retVal = await uhx.Repositories.userRepository.insert(user, password, principal, _txc);
                strWallet.userId = retVal.id;
                strWallet = await uhx.Repositories.walletRepository.insert(strWallet, principal, _txc);

                // Ethereum 
                if(uhx.Config.ethereum.enabled){
                    var web3Client = uhx.Web3Client;
                    var ethWallet = await web3Client.generateAccount()
                    ethWallet.userId = retVal.id;
                    ethWallet = await uhx.Repositories.walletRepository.insert(ethWallet, principal, _txc);
                    await web3Client.getBalance(ethWallet)
                }

                // Add user
                await uhx.Repositories.groupRepository.addUser(uhx.Config.security.sysgroups.users, retVal.id, principal, _txc);
                if(!user.emailVerified ){
                    await this.sendConfirmationEmail(user, _txc);
                }
                if(user.tel && !user.telVerified)
                    await this.sendConfirmationSms(user, _txc);
                return retVal;
            });

            return user;
        }
        catch(e) {
            uhx.log.error("Error finalizing authentication: " + e.message);
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

            return await uhx.Repositories.transaction(async (_txc) => {
                
                // Create stellar client
                var stellarClient = uhx.StellarClient;
                
                // Verify user
                var user = await uhx.Repositories.userRepository.get(userId, _txc);

                // Does user already have wallet?
                var wallet = await user.loadStellarWallet();
                if(!wallet) { // Generate a KP
                    // Create a wallet
                    var wallet = await stellarClient.generateAccount();
                    // Insert 
                    wallet = await uhx.Repositories.walletRepository.insert(wallet, null, _txc);
                    // Update user
                    user.walletId = wallet.id;
                    await uhx.Repositories.userRepository.update(user, null, null, _txc);
                }

                // Activate wallet if not already active
                if(!stellarClient.isActive(wallet))
                    await stellarClient.activateAccount(wallet, "1",  await uhx.Repositories.walletRepository.get(uhx.Config.stellar.initiator_wallet_id));
                return wallet;
            });
        }
        catch(e) {
            uhx.log.error("Error finalizing authentication: " + e.message);
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

            return await uhx.Repositories.transaction(async (_txc) => {

                // Get existing user
                var existingUser = await uhx.Repositories.userRepository.get(user.id);

                // Delete fields which can't be set by clients 
                delete(user.walletId);

                // Was the user's e-mail address verified? 
                if(newPassword) {
                    if(existingUser.telVerified && existingUser.tel)
                        await uhx.Mailer.sendSms({
                            to: existingUser.tel,
                            template: uhx.Config.mail.templates.passwordChange
                        }, { user: existingUser });
                    else if(existingUser.emailVerified && existingUser.email)
                        await uhx.Mailer.sendEmail({
                            to: existingUser.tel,
                            from: uhx.Config.mail.from,
                            template: uhx.Config.mail.templates.passwordChange,
                            subject: "Did you change your UhX password?"
                        }, { user: existingUser });
                }
                else if(user.tel && existingUser.telVerified && existingUser.tel != user.tel) {

                    await uhx.Mailer.sendSms({
                        to: existingUser.tel,
                        template: uhx.Config.mail.templates.contactChange
                    }, { old: existingUser, new: user, token: undoToken, ui_base: uhx.Config.api.ui_base });

                    await this.sendConfirmationSms(user);

                    user.telVerified = false;
                }
                else if(user.tel && !user.telVerified) {
                    user.givenName = user.givenName || existingUser.givenName;
                    user.familyName = user.familyName || existingUser.familyName;
                    await this.sendConfirmationSms(user);
                }
                else if(user.email && existingUser.emailVerified && existingUser.email != user.email) {

                    var undoToken = this.generateSignedClaimToken();
                    await uhx.Repositories.userRepository.addClaim(user.id, {
                        type: PASSWORD_RESET_CLAIM,
                        value: undoToken,
                        expiry: new Date(new Date().getTime() + uhx.Config.security.resetValidity)
                     }, _txc);

                    // We want to send an e-mail to the previous e-mail address notifying the user of the change
                    await uhx.Mailer.sendEmail({
                        to: existingUser.email,
                        from: uhx.Config.mail.from,
                        subject: "Did you change your e-mail address?",
                        template: uhx.Config.mail.templates.contactChange
                    }, { old: existingUser, new: user, token: undoToken, ui_base: uhx.Config.api.ui_base });

                    // TODO: We want to send a confirmation e-mail to the e-mail address
                    await this.sendConfirmationEmail(user);
                    user.emailVerified = false;
                }
                else if(user.tfaMethod && user.tfaMethod != existingUser.tfaMethod) {
                    // Confirm to user that TFA was set
                    if(user.tfaMethod == 1)
                    {
                        if(!existingUser.telVerified)
                            throw new exception.BusinessRuleViolationException(new exception.RuleViolation("SMS Two-Factor requires a verified phone number", exception.ErrorCodes.RULES_VIOLATION, exception.RuleViolationSeverity.ERROR));
                        await uhx.Mailer.sendSms({
                            to: existingUser.tel,
                            template: uhx.Config.mail.templates.tfaChange
                        }, { old: existingUser, new: user, token: undoToken, ui_base: uhx.Config.api.ui_base });
                    }
                    else if(user.tfaMethod == 2) {
                        if(!existingUser.emailVerified)
                            throw new exception.BusinessRuleViolationException(new exception.RuleViolation("E-Mail Two-Factor requires a verified e-mail address", exception.ErrorCodes.RULES_VIOLATION, exception.RuleViolationSeverity.ERROR));
                        await uhx.Mailer.sendEmail({
                            to: existingUser.email,
                            from: uhx.Config.mail.from,
                            subject: "UhX Two-factor authentication setup successful",
                            template: uhx.Config.mail.templates.tfaChange
                        }, { old: existingUser, new: user, token: undoToken, ui_base: uhx.Config.api.ui_base });
                    }
                }
                // Update the user
                return await uhx.Repositories.userRepository.update(user, newPassword, null, _txc);

            });
        }
        catch(e) {
            uhx.log.error("Error updating user: " + e.message);
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
            await uhx.Repositories.userRepository.addClaim(user.id, {
                type: EMAIL_CONFIRM_CLAIM,
                value: confirmToken,
                expiry: new Date(new Date().getTime() + uhx.Config.security.confirmationValidity)
            }, _txc);

            // We want to send an e-mail to the previous e-mail address notifying the user of the change
            await uhx.Mailer.sendEmail({
                to: user.email,
                from: uhx.Config.mail.from,
                subject: "Confirm your e-mail address on UhX",
                template: uhx.Config.mail.templates.confirmation
            }, { user: user, token: confirmToken, ui_base: uhx.Config.api.ui_base });

        }
        catch(e) {
            uhx.log.error(`Error sending confirmation e-mail: ${JSON.stringify(e)}`);
            throw e;
        }
    }

    /**
     * @method
     * @summary Sends an SMS to the user to confirm their SMS address
     * @param {User} user The user for which the confirmation SMS should be sent
     * @param {*} _txc If the operation is being performed as part of a transaction then this is the transaction
     */
    async sendConfirmationSms(user, _txc) {
        try {
            var confirmToken = this.generateSignedClaimToken('tfa');
            await uhx.Repositories.userRepository.addClaim(user.id, {
                type: SMS_CONFIRM_CLAIM,
                value: confirmToken,
                expiry: new Date(new Date().getTime() + uhx.Config.security.confirmationValidity)
            }, _txc);

            // We want to send an sms address to verify
            await uhx.Mailer.sendSms({
                to: user.tel,
                template: uhx.Config.mail.templates.confirmation
            }, { user: user, token: confirmToken, ui_base: uhx.Config.api.ui_base });

        }
        catch(e) {
            uhx.log.error(`Error sending confirmation sms: ${JSON.stringify(e)}`);
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
        if(user.name && !new RegExp(uhx.Config.security.username_regex).test(user.name))
            ruleViolations.push(new exception.RuleViolation("Username format invalid", exception.ErrorCodes.INVALID_NAME, exception.RuleViolationSeverity.ERROR));
        if(password && !new RegExp(uhx.Config.security.password_regex).test(password))
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
            this.validateSignedClaimToken(invitationToken);

            // Fetch the invitation
            var invitation = await uhx.Repositories.invitationRepository.getByClaimToken(invitationToken);

            // Create a user
            var user = clone(new User().copy(invitation));

            user.name = invitation.email;
            user.emailVerified = true;

            // Validate the user
            this.validateUser(user, initialPassword);

            // Now a transaction to interact with the DB
            return await uhx.Repositories.transaction(async (_txc) => {

                // Insert the user and assign to user group
                

                // Now we want to claim the token
                var newUser = await this.registerInternalUser(user, initialPassword, principal)

                await uhx.Repositories.groupRepository.addUser(uhx.Config.security.sysgroups.users, newUser.id, principal, _txc);

                await uhx.Repositories.invitationRepository.claim(invitation.id, newUser, _txc);

                
                // Now we want to notify the user
                var sendOptions = {
                    to: newUser.email,
                    from: uhx.Config.mail.from,
                    subject: "Welcome to the UhX community!",
                    template: uhx.Config.mail.templates.welcome
                };
                
                // Replacements
                const replacements = {
                    user: newUser,
                    ui_base: uhx.Config.api.ui_base
                }
                await uhx.Mailer.sendEmail(sendOptions, replacements);

                // Return the user
                return newUser;
            });

        }
        catch(e) {
            uhx.log.error(`Error claiming invitation: ${JSON.stringify(e)}`);
            throw new exception.Exception("Error claiming invitation", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Validates a claim token
     * @param {string} token The token being validated
     */
    validateSignedClaimToken(token) {

        if(token.length == 9) { // 9 code numeric with mod 10
            var mod = (token.substring(0, 8).split('').reduce((a,b)=>parseInt(a)+parseInt(b)) % 10);
            if(mod != token[token.length - 1])
                throw new exception.Exception("Token has failed validation", exception.ErrorCodes.SECURITY_ERROR);
        }
        else {
            var tokenParts = token.split(".");
            if(tokenParts.length != 2)
                throw new exception.ArgumentException("code");
            else if(tokenParts[1] != crypto.createHmac('sha256', uhx.Config.security.hmac256secret).update(tokenParts[0]).digest('hex'))
                throw new exception.Exception("Token signature does not match", exception.ErrorCodes.SECURITY_ERROR);
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
                token += (token.split('').reduce((a,b)=>parseInt(a)+parseInt(b)) % 10);
                return token;
            }
            case "8byte": // a shorter 8 byte code
            {
                var token = crypto.randomBytes(8).toString('hex');
                
                var sig = crypto.createHmac('sha256', uhx.Config.security.hmac256secret).update(token).digest('hex');
                return token + "." + sig;
            }                
            default: {
                var token = crypto.randomBytes(32).toString('hex');
                var sig = crypto.createHmac('sha256', uhx.Config.security.hmac256secret).update(token).digest('hex');
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
            if(!invitation.email || !new RegExp(uhx.Config.security.email_regex).test(invitation.email))
                throw new exception.ArgumentException("email");
            if(!uhx.Config.security.invitations.enabled)
                throw new exception.Exception("Invitations are disabled on this server", exception.ErrorCodes.UNAUTHORIZED);

            // Insert the invitation
            return await uhx.Repositories.transaction(async (_txc) => {

                // First let's insert the data - That is cool 
                invitation = await uhx.Repositories.invitationRepository.insert(invitation, claimToken, uhx.Config.security.invitations.validityTime, clientPrincipal, _txc);

                // Next - We want to prepare an e-mail
                var sendOptions = {
                    to: invitation.email,
                    from: uhx.Config.mail.from,
                    subject: "Your wallet is waiting for you on UhX!",
                    template: uhx.Config.mail.templates.invitation
                };

                // Replacements
                const replacements = {
                    invitation:invitation,
                    claimToken: claimToken,
                    sender: clientPrincipal.session.userId != "00000000-0000-0000-0000-000000000000" ? (await clientPrincipal.session.loadUser()).name : (await clientPrincipal.session.loadApplication()).name, 
                    ui_base: uhx.Config.api.ui_base
                }

                await uhx.Mailer.sendEmail(sendOptions, replacements);
                return invitation;
            });
        }
        catch(e) {
            uhx.log.error(`Error finalizing invitation: ${e.message}`);
            throw new exception.Exception("Error finalizing invitation", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

 }
