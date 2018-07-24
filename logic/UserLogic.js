
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
    model = require('../model/model'),
    Provider = require('../model/Provider'),
    User = require('../model/User');

const uuidRegex = /[A-F0-9]{8}-(?:[A-F0-9]{4}\-){3}[A-F0-9]{12}/i;

/**
 * @class
 * @summary Represents logic related to the provider and patient platform
 */
module.exports = class UserLogic {

    /**
     * @constructor
     * @summary Binds methods to "this"
     */
    constructor() {
        this.addProvider = this.addProvider.bind(this);
        this.updateProvider = this.updateProvider.bind(this);
    }

    /**
     * @method
     * @summary Adds a provider to the UhX API
     * @param {Provider} provider The provider to add
     * @param {SecurityPrincipal} principal The user who is making the request
     */
    async addProvider(provider, principal) {

        var providerExists = await uhx.Repositories.providerRepository.get(provider.userId);
        if (providerExists)
            throw new exception.Exception("User has a provider profile", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        try {
            var retVal = await uhx.Repositories.providerRepository.insert(provider, principal);
            await uhx.Repositories.groupRepository.addUser(uhx.Config.security.sysgroups.providers, retVal.userId, principal);
            return retVal;
        }
        catch (e) {
            uhx.log.error(`Error adding provider: ${e.message}`);
            throw new exception.Exception("Error adding provider", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Updates the specified provider
     * @param {Provider} provider The provider to be updated
     * @returns {Provider} The updated provider
     */
    async updateProvider(provider, principal) {
        if (principal.grant["user"] & security.PermissionType.OWNER) {
            try {

                // Delete fields which can't be set by clients 
                delete (provider.userId);
                delete (provider.creationTime);
                delete (provider.updatedTime);
                delete (provider.deactivationTime);
                delete (provider.profileImage);

                // TODO: Verify fields

                return await uhx.Repositories.transaction(async (_txc) => {
                    // Update the provider
                    return await uhx.Repositories.providerRepository.update(provider, null, _txc);

                });
            }
            catch (e) {
                uhx.log.error("Error updating provider: " + e.message);
                throw new exception.Exception("Error updating provider", exception.ErrorCodes.UNKNOWN, e);
            }
        } else if (principal.grant["user"] & security.PermissionType.LIST) {
            try {

                delete (provider.userId);
                delete (provider.creationTime);
                delete (provider.updatedTime);
                delete (provider.deactivationTime);

                return await uhx.Repositories.transaction(async (_txc) => {

                    return await uhx.Repositories.providerRepository.update(provider, null, _txc);
                });
            } catch (ex) {
                uhx.log.error("Error updating provider: " + ex.message);
                throw new exception.Exception("Error updating provider", exception.ErrorCodes.UNKNOWN, ex);
            }
        }
    }
}
