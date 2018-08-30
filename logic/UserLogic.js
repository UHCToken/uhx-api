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
    Patient = require('../model/Patient'),
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
        this.getAllServices = this.getAllServices.bind(this);
        this.editProviderServices = this.editProviderServices.bind(this);
        this.addProviderService = this.addProviderService.bind(this);
        this.updateProviderService = this.updateProviderService.bind(this);
        this.deleteProviderService = this.deleteProviderService.bind(this);
        this.addPatient = this.addPatient.bind(this);
        this.updatePatient = this.updatePatient.bind(this);
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

        if (((principal.grant["provider"] && security.PermissionType.OWNER && provider.userId == principal.session.userId) == 1) || (principal.grant["provider"] & security.PermissionType.LIST)) {

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
        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
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
        var providerExists = await uhx.Repositories.providerRepository.get(provider.id);

        if (!providerExists)
            throw new exception.Exception("Provider not found", exception.ErrorCodes.NOT_FOUND);

        if (((principal.grant["provider"] && security.PermissionType.OWNER && providerExists.userId == principal.session.userId) == 1) || (principal.grant["provider"] & security.PermissionType.LIST)) {
            try {

                if (serviceTypes)
                    await uhx.UserLogic.updateProviderServiceTypes(provider.id, serviceTypes, principal);

                // Delete fields which can't be set by clients 
                delete (provider.userId);
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
        }
        else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
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
            for (var i in serviceTypes) {
                var exists = await uhx.Repositories.providerRepository.serviceTypeExists(providerId, serviceTypes[i].type_id);
                if (serviceTypes[i].action == 'insert' && !exists)
                    await uhx.Repositories.providerRepository.insertServiceType(providerId, serviceTypes[i].type_id);
                else if (serviceTypes[i].action == 'delete' && exists) {
                    await uhx.Repositories.providerRepository.deleteServiceType(providerId, serviceTypes[i].type_id);
                    var addresses = await uhx.Repositories.providerAddressRepository.getAllForProvider(providerId);
                    for (var a in addresses) {
                        await uhx.UserLogic.updateAddressServiceTypes(addresses[a].id, [serviceTypes[i]], principal);
                    }
                }

            }
            return true;
        }
        catch (e) {
            uhx.log.error(`Error updating service type: ${e.message}`);
            throw new exception.Exception("Error updating service type", e.code || exception.ErrorCodes.UNKNOWN, e);
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

        var addressExists = await uhx.Repositories.providerAddressRepository.get(address.id);
        if (addressExists)
            throw new exception.Exception("This address exists", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        var providerExists = await uhx.Repositories.providerRepository.get(address.providerId);

        if (!providerExists)
            throw new exception.Exception("Provider Id does not exist", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        if (((principal.grant["providerAddress"] && security.PermissionType.OWNER && providerExists.userId == principal.session.userId) == 1) || (principal.grant["providerAddress"] & security.PermissionType.LIST)) {

            delete (address.latitude);
            delete (address.longitude);

            // Get the latitude and longitude
            var geometry = await uhx.GoogleMaps.getLatLon(address);
            address.latitude = parseFloat(geometry.lat.toFixed(6));
            address.longitude = parseFloat(geometry.lon.toFixed(6));

            // Randomly reposition the latitude and longitude if the exact same one already exists
            while (await uhx.Repositories.providerAddressRepository.checkIfLatLonExists(address.latitude.toFixed(6), address.longitude.toFixed(6))) {
                address.latitude += Math.random() < 0.5 ? -0.00001 : 0.00001;
                address.longitude += Math.random() < 0.5 ? -0.00001 : 0.00001;
            }

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
        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
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

        var userId = await uhx.Repositories.providerAddressRepository.getUserIdByAddress(address.id);

        if (!userId)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        if (((principal.grant["providerAddress"] && security.PermissionType.OWNER && userId == principal.session.userId) == 1) || (principal.grant["providerAddress"] & security.PermissionType.LIST)) {

            if (serviceTypes)
                await uhx.UserLogic.updateAddressServiceTypes(address.id, serviceTypes, principal);

            // Delete fields which can't be set by clients 
            delete (address.providerId);
            delete (address.latitude);
            delete (address.longitude);

            var oldAddress = await uhx.Repositories.providerAddressRepository.get(address.id);

            if ((address.street && (address.street != oldAddress.street)) || (address.city && (address.city != oldAddress.city)) || (address.stateProv && (address.stateProv != oldAddress.stateProv)) || (address.country && (address.country != oldAddress.country)) || (address.postalZip && (address.postalZip != oldAddress.postalZip))) {
                // Load new/old address data
                var newAddress = {};
                newAddress.street = address.street || oldAddress.street;
                newAddress.city = address.city || oldAddress.city;
                newAddress.stateProv = address.stateProv || oldAddress.stateProv;
                newAddress.country = address.country || oldAddress.country;
                newAddress.postalZip = address.postalZip || oldAddress.postalZip;

                // Get the latitude and longitude
                var geometry = await uhx.GoogleMaps.getLatLon(newAddress);
                address.latitude = parseFloat(geometry.lat.toFixed(6));
                address.longitude = parseFloat(geometry.lon.toFixed(6));

                while (await uhx.Repositories.providerAddressRepository.checkIfLatLonExists(address.latitude.toFixed(6), address.longitude.toFixed(6))) {
                    address.latitude += Math.random() < 0.5 ? -0.00001 : 0.00001;
                    address.longitude += Math.random() < 0.5 ? -0.00001 : 0.00001;
                }
            }

            try {
                return await uhx.Repositories.providerAddressRepository.update(address);
            }
            catch (e) {
                uhx.log.error("Error updating provider address: " + e.message);
                throw new exception.Exception("Error updating provider address", exception.ErrorCodes.UNKNOWN, e);
            }
        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
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
        try {
            for (var i in serviceTypes) {
                var exists = await uhx.Repositories.providerAddressRepository.serviceTypeExists(addressId, serviceTypes[i].type_id);
                if (serviceTypes[i].action == 'insert' && !exists)
                    await uhx.Repositories.providerAddressRepository.insertServiceType(addressId, serviceTypes[i].type_id);
                else if (serviceTypes[i].action == 'delete' && exists)
                    await uhx.Repositories.providerAddressRepository.deleteServiceType(addressId, serviceTypes[i].type_id);

            }
            return true;
        }
        catch (e) {
            uhx.log.error(`Error updating service type: ${e.message}`);
            throw new exception.Exception("Error updating service type", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }



    /**
     * @method
     * @summary Deactivates the specified provider address
     * @param {ProviderAddress} address The provider address to be deactivated
     * @returns {ProviderAddress} The provider address that was deactivated
     */
    async deleteProviderAddress(address, principal, _txc) {

        var userId = await uhx.Repositories.providerAddressRepository.getUserIdByAddress(address.id);

        if (!userId)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        if (((principal.grant["providerAddress"] && security.PermissionType.OWNER && userId == principal.session.userId) == 1) || (principal.grant["providerAddress"] & security.PermissionType.LIST)) {

            try {
                return await uhx.Repositories.providerAddressRepository.delete(address.id, _txc);
            }
            catch (e) {
                uhx.log.error("Error deleting address: " + e.message);
                throw new exception.Exception("Error deleting address", exception.ErrorCodes.UNKNOWN, e);
            }

        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
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
        var userId = await uhx.Repositories.providerAddressRepository.getUserIdByAddress(addressId);

        if (!userId)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        if (((principal.grant["providerService"] && security.PermissionType.OWNER && userId == principal.session.userId) == 1) || (principal.grant["providerService"] & security.PermissionType.LIST)) {

            var address = await uhx.Repositories.providerAddressRepository.get(addressId);

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
        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
        }
    }

    /**
     * @method
     * @summary Gets all the services for an address in the UhX API
     * @param {string} addressId The provider address id to get services for
     * @param {SecurityPrincipal} principal The user who is making the request
     * @returns {*} The services for the provider address
     */
    async getAllServices(addressId, principal) {
        var address = await uhx.Repositories.providerAddressRepository.get(addressId);
        if (!address)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        var services = await uhx.Repositories.providerServiceRepository.getAllForAddress(addressId);
        for (var s = services.length - 1; s > -1; s--) {
            if (await uhx.Repositories.providerServiceRepository.serviceTypeExists(services[s].id, services[s].addressId))
                await services[s].loadServiceTypeDetails();
            else
                services.splice(s, 1);
        }
        return services;
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
        var userId = await uhx.Repositories.providerAddressRepository.getUserIdByAddress(addressId);

        if (!userId)
            throw new exception.Exception("Address not found", exception.ErrorCodes.NOT_FOUND);

        if (((principal.grant["providerService"] && security.PermissionType.OWNER && userId == principal.session.userId) == 1) || (principal.grant["providerService"] & security.PermissionType.LIST)) {

            var address = await uhx.Repositories.providerAddressRepository.get(addressId);

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

        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
        }
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

        if (!service.serviceName || !service.description || !service.cost || !service.serviceType)
            throw new exception.Exception("Missing one or more properties", exception.ErrorCodes.MISSING_PROPERTY);

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

        var userId = await uhx.Repositories.providerServiceRepository.getUserIdByService(service.id);

        if (((principal.grant["providerService"] && security.PermissionType.OWNER && userId == principal.session.userId) == 1) || (principal.grant["providerService"] & security.PermissionType.LIST)) {

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
        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
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

        var userId = await uhx.Repositories.providerServiceRepository.getUserIdByService(service.id);

        if (((principal.grant["providerService"] && security.PermissionType.OWNER && userId == principal.session.userId) == 1) || (principal.grant["providerService"] & security.PermissionType.LIST)) {

            try {
                return await uhx.Repositories.providerServiceRepository.delete(service.id, _txc);
            }
            catch (e) {
                uhx.log.error("Error deleting service: " + e.message);
                throw new exception.Exception("Error deleting service", exception.ErrorCodes.UNKNOWN, e);
            }
        } else {
            return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
        }
    }

    /**
     * @method
     * @summary Adds a patient to the UhX API
     * @param {Patient} patient The patient to add
     * @param {SecurityPrincipal} principal The user who is making the request
     */
    async addPatient(patient, principal) {

        var patientExists = await uhx.Repositories.patientRepository.get(patient.userId);
        if (patientExists)
            throw new exception.Exception("User has a patient profile", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        try {
            var retVal = await uhx.Repositories.patientRepository.insert(patient, principal);
            await uhx.Repositories.groupRepository.addUser(uhx.Config.security.sysgroups.patients, retVal.userId, principal);
            return retVal;
        }
        catch (e) {
            uhx.log.error(`Error adding patient: ${e.message}`);
            throw new exception.Exception("Error adding patient", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Updates the specified patient
     * @param {Patient} patient The patient to be updated
     * @returns {Patient} The updated patient
     */
    async updatePatient(patient, principal) {

        try {

            // Delete fields which can't be set by clients 
            delete (patient.userId);
            delete (patient.profileImage);

            return await uhx.Repositories.transaction(async (_txc) => {
                // Update the patient
                return await uhx.Repositories.patientRepository.update(patient, null, _txc);

            });
        }
        catch (e) {
            uhx.log.error("Error updating patient: " + e.message);
            throw new exception.Exception("Error updating patient", exception.ErrorCodes.UNKNOWN, e);
        }

    }
}
