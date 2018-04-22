/// <Reference path="./model/model.js"/>
'use strict';

/**
 * Universal Health Coin API Service
 * Copyright (C) 2018, Universal Health Coin
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Original Authors: Justin Fyfe (justin-fyfe), Rory Yendt (RoryYendt)
 * Original Date: 2018-04-18
 * 
 * This file contains the main business logic for the UHC API
 * 
 */

 const config = require('./config'),
    repositories = require('./repository/repository'),
    exception = require('./exception'),
    security = require('./security'),
    model = require('./model/model');

 const repository = new repositories.UhcRepositories(config.db.server);
 /**
  * @class
  * @summary Represents the core business logic of the UHC application
  */
 class BusinessLogic {

    /**
     * @method 
     * @summary Performs the necessary business process of logging the user in
     * @param {string} clientId The application or client that the user is using
     * @param {string} clientSecret The client secret
     * @param {string} username The username of the user wishing to login
     * @param {string} password The password that the user entered
     * @returns {Principal} The authenticated user principal
     */
    async establishSession(clientId, clientSecret, username, password) {

        // Get the application and verify
        var application = await repository.applicationRepository.getByNameSecret(clientId, clientSecret);
        if(application.deactivationTime)
            throw new exception.Exception("Application has been deactivated", exception.ErrorCodes.SECURITY_ERROR);

        try {
            var user = await repository.userRepository.getByNameSecret(username, password);
            
            // User was successful but their account is still locked
            if(user.lockout > new Date())
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED);
            else if(user.deactivationTime < new Date())
                throw new exception.Exception("Account has been deactivated", exception.ErrorCodes.UNAUTHORIZED);
                
            // Success, reset the user invalid logins
            user.invalidLogins = 0;
            user.lastLogin = new Date();
            
            await repository.userRepository.update(user);

            // Create the session object
            var session = new model.Session(user, application, config.security.sessionLength);
            session = await repository.sessionRepository.insert(session);

            return new security.Principal(session);
        }
        catch(e) {
            // Attempt to increment the invalid login count
            var invalidUser = await repository.userRepository.incrementLoginFailure(username, config.security.maxFailedLogin);
            if(invalidUser.lockout) 
                throw new exception.Exception("Account is locked", exception.ErrorCodes.ACCOUNT_LOCKED, e);
            throw e;
        }
    }

 }

 // Exports section
 module.exports.BusinessLogic = new BusinessLogic();
 module.exports.Config = config;
 module.exports.Repositories = repository;