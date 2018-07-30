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
        this.updateProviderServiceTypes = this.updateProviderServiceTypes.bind(this);
        this.addProviderAddress = this.addProviderAddress.bind(this);
        this.updateProviderAddress = this.updateProviderAddress.bind(this);
        this.updateAddressServiceTypes = this.updateAddressServiceTypes.bind(this);
        this.addProviderServices = this.addProviderServices.bind(this);
        this.editProviderServices = this.editProviderServices.bind(this);
        this.addProviderService = this.addProviderService.bind(this);
        this.updateProviderService = this.updateProviderService.bind(this);
        this.deleteProviderService = this.deleteProviderService.bind(this);
    }

    /**
     * @method
     * @summary Adds a provider to the UhX API
     * @param {Provider} provider The provider to add
     * @param {*} serviceTypes The service types of the provider
     * @param {SecurityPrincipal} principal The user who is making the request
     */
    async addProvider(provider, serviceTypes, principal) {

        var providerExists = await uhx.Repositories.providerRepository.get(provider.userId);
        if (providerExists)
            throw new exception.Exception("User has a provider profile", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        try {
            var retVal = await uhx.Repositories.providerRepository.insert(provider, principal);
            await uhx.Repositories.groupRepository.addUser(uhx.Config.security.sysgroups.providers, retVal.userId, principal);
            if (serviceTypes)
                await uhx.UserLogic.updateProviderServiceTypes(provider.id, serviceTypes, principal);
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
     * @param {*} serviceTypes The service types of the provider
     * @returns {Provider} The updated provider
     */
    async updateProvider(provider, serviceTypes, principal) {
        if (principal.grant["user"] & security.PermissionType.OWNER) {
            try {

                if (serviceTypes)
                    await uhx.UserLogic.updateProviderServiceTypes(provider.id, serviceTypes, principal);

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

                if (serviceTypes)
                    await uhx.UserLogic.updateProviderServiceTypes(provider.id, serviceTypes, principal);

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

    /**
     * @method
     * @summary Adds a service type
     * @param {string} providerId The provider to add the service type to
     * @param {Array} serviceTypes The service types to add to the provider
     * @param {SecurityPrincipal} principal The user who is making the request
     */
    async updateProviderServiceTypes(providerId, serviceTypes, principal) {
        var existingServiceTypes = await uhx.Repositories.providerRepository.getProviderServiceTypes(providerId);

        try {
            var exists = [];
            for (var i in serviceTypes) {
                exists[i] = false;
                for (var j in existingServiceTypes) {
                    if (serviceTypes[i].type_id == existingServiceTypes[j].type_id)
                        exists[i] = true;
                }
                if (serviceTypes[i].action == 'insert' && !exists[i])
                    await uhx.Repositories.providerRepository.insertServiceType(providerId, serviceTypes[i].type_id);
                else if (serviceTypes[i].action == 'delete' && exists[i])
                    await uhx.Repositories.providerRepository.deleteServiceType(providerId, serviceTypes[i].type_id);

            }
            return true;
        }
        catch (e) {
            uhx.log.error(`Error adding service type: ${e.message}`);
            throw new exception.Exception("Error adding service type", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Adds a provider address to the UhX API
     * @param {ProviderAddress} address The provider address to add
     * @param {*} serviceTypes The service types of the provider address
     * @param {SecurityPrincipal} principal The user who is making the request
     * @returns {ProviderAddress} The inserted provider address
     */
    async addProviderAddress(address, serviceTypes, principal) {

        var addressExists = await uhx.Repositories.providerAddressRepository.get(address.addressId);
        if (addressExists)
            throw new exception.Exception("This address exists", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        delete (address.creationTime);
        delete (address.updatedTime);
        delete (address.deactivationTime);

        try {
            var newAddress = await uhx.Repositories.providerAddressRepository.insert(address, principal);
            if (serviceTypes)
                await uhx.UserLogic.updateAddressServiceTypes(address.id, serviceTypes, principal);
            return newAddress;
        }
        catch (e) {
            uhx.log.error(`Error adding provider address: ${e.message}`);
            throw new exception.Exception("Error adding provider address", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Updates the specified provider address
     * @param {ProviderAddress} address The provider address to be updated
     * @param {*} serviceTypes The service types of the provider address
     * @returns {ProviderAddress} The updated provider address
     */
    async updateProviderAddress(address, serviceTypes, principal) {

        try {
            if (serviceTypes)
                await uhx.UserLogic.updateAddressServiceTypes(address.id, serviceTypes, principal);

            // Delete fields which can't be set by clients 
            delete (address.providerId);
            delete (address.creationTime);
            delete (address.updatedTime);
            delete (address.deactivationTime);
            delete (address.profileImage);

            return await uhx.Repositories.providerAddressRepository.update(address);
        }
        catch (e) {
            uhx.log.error("Error updating provider address: " + e.message);
            throw new exception.Exception("Error updating provider address", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Adds a service type
     * @param {string} addressId The provider address to add the service type to
     * @param {Array} serviceTypes The service types to add to the provider address
     * @param {SecurityPrincipal} principal The user who is making the request
     */
    async updateAddressServiceTypes(addressId, serviceTypes, principal) {
        var existingServiceTypes = await uhx.Repositories.providerAddressRepository.getAddressServiceTypes(addressId);

        try {
            var exists = [];
            for (var i in serviceTypes) {
                exists[i] = false;
                for (var j in existingServiceTypes) {
                    if (serviceTypes[i].type_id == existingServiceTypes[j].type_id)
                        exists[i] = true;
                }
                if (serviceTypes[i].action == 'insert' && !exists[i])
                    await uhx.Repositories.providerAddressRepository.insertServiceType(addressId, serviceTypes[i].type_id);
                else if (serviceTypes[i].action == 'delete' && exists[i])
                    await uhx.Repositories.providerAddressRepository.deleteServiceType(addressId, serviceTypes[i].type_id);

            }
            return true;
        }
        catch (e) {
            uhx.log.error(`Error adding service type: ${e.message}`);
            throw new exception.Exception("Error adding service type", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Adds provider address services to the UhX API
     * @param {string} addressId The provider address id to add services for
     * @param {*} services The provider address services to add
     * @param {SecurityPrincipal} principal The user who is making the request
     * @returns {*} The inserted provider address services
     */
    async addProviderServices(addressId, services, principal) {
        var retVal = [];
        var address = await uhx.Repositories.providerAddressRepository.get(addressId);
        if (!address)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        return await uhx.Repositories.transaction(async (_txc) => {
            for (var s in services) {
                services[s].addressId = address.id;
                try {
                    retVal.push(await uhx.UserLogic.addProviderService(services[s], principal, _txc));
                }
                catch (e) {
                    uhx.log.error(`Error adding services: ${e.message}`);
                    throw new exception.Exception("Error adding services", e.code || exception.ErrorCodes.UNKNOWN, e);
                }
            }
            return retVal;
        });
    }

    /**
     * @method
     * @summary Adds provider address services to the UhX API
     * @param {string} addressId The provider address id to edit services for
     * @param {*} services The provider address services to edit
     * @param {string} action The action to run for the edit
     * @param {SecurityPrincipal} principal The user who is making the request
     * @returns {*} The inserted provider address services
     */
    async editProviderServices(addressId, services, action, principal) {
        var retVal = [];
        var address = await uhx.Repositories.providerAddressRepository.get(addressId);
        if (!address)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        return await uhx.Repositories.transaction(async (_txc) => {

            for (var s in services) {
                services[s].addressId = address.id;
                try {
                    if (action[s] == 'insert')
                        retVal.push(await uhx.UserLogic.addProviderService(services[s], principal, _txc));
                    else if (action[s] == 'update')
                        retVal.push(await uhx.UserLogic.updateProviderService(services[s], principal, _txc));
                    else if (action[s] == 'delete')
                        retVal.push(await uhx.UserLogic.deleteProviderService(services[s], principal, _txc));
                }
                catch (e) {
                    uhx.log.error(`Error adding services: ${e.message}`);
                    throw new exception.Exception("Error adding services", e.code || exception.ErrorCodes.UNKNOWN, e);
                }
            }
            return retVal;
        });
    }

    /**
     * @method
     * @summary Adds a provider address service to the UhX API
     * @param {ProviderService} service The provider address services to add
     * @returns {ProviderService} The inserted provider address service
     */
    async addProviderService(service, principal, _txc) {

        if (!service.addressId)
            throw new exception.Exception("Must have an addressId", exception.ErrorCodes.MISSING_PROPERTY);

        if (!service.serviceType)
            throw new exception.Exception("Must have a serviceType", exception.ErrorCodes.MISSING_PROPERTY);

        if (!service.providerId) {
            var address = await uhx.Repositories.providerAddressRepository.get(service.addressId);
            service.providerId = address.providerId;
        }

        if (!(await uhx.Repositories.serviceTypeRepository.get(service.serviceType)))
            throw new exception.Exception("Service type not found", exception.ErrorCodes.NOT_FOUND);

        // Delete values set automatically
        delete (service.creationTime);
        delete (service.updatedTime);
        delete (service.deactivationTime);

        try {
            return await uhx.Repositories.providerServiceRepository.insert(service, _txc);
        }
        catch (e) {
            uhx.log.error(`Error adding service: ${e.message}`);
            throw new exception.Exception("Error adding service", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Updates the specified provider address service
     * @param {ProviderService} service The provider address service to be updated
     * @returns {ProviderService} The updated provider address service
     */
    async updateProviderService(service, principal, _txc) {
        if (!(await uhx.Repositories.providerServiceRepository.get(service.id)))
            throw new exception.Exception("Service not found", exception.ErrorCodes.NOT_FOUND);

        try {
            // Delete fields which can't be set by clients 
            delete (service.providerId);
            delete (service.addressId);
            delete (service.creationTime);
            delete (service.updatedTime);
            delete (service.deactivationTime);

            return await uhx.Repositories.providerServiceRepository.update(service, _txc);
        }
        catch (e) {
            uhx.log.error("Error updating service: " + e.message);
            throw new exception.Exception("Error updating service", exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Deletes the specified provider address service
     * @param {ProviderService} service The provider address service to be deleted
     * @returns {Boolean} The status of the deletion
     */
    async deleteProviderService(service, principal, _txc) {
        if (!(await uhx.Repositories.providerServiceRepository.get(service.id)))
            throw new exception.Exception("Service not found", exception.ErrorCodes.NOT_FOUND);

        try {
            return await uhx.Repositories.providerServiceRepository.delete(service.id, _txc);
        }
        catch (e) {
            uhx.log.error("Error deleting service: " + e.message);
            throw new exception.Exception("Error deleting service", exception.ErrorCodes.UNKNOWN, e);
        }
    }

}
