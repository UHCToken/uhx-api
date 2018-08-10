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
    User = require('../model/User'),
    clone = require('clone'),
    fs = require('fs');

const STATUS_NEW = "NEW",
    STATUS_ACCEPTED = "ACCEPTED",
    STATUS_DECLINED = "DECLINED",
    STATUS_COMPLETED = "COMPLETED",
    STATUS_FUNDED = "FUNDED",
    STATUS_PROVIDED = "PROVIDED",
    STATUS_RECEIVED = "RECEIVED",
    STATUS_EXPIRED = "EXPIRED";
/**
  * @class
  * @summary Represents the core business logic of the UhX application
  */
module.exports = class CareLogic {

    /**
     * @constructor
     * @summary Binds methods to "this"
     */
    constructor() {
        this.createCareRelationship = this.createCareRelationship.bind(this);
        this.acceptCareRelationship = this.acceptCareRelationship.bind(this);
        this.declineCareRelationship = this.declineCareRelationship.bind(this);
    }

    /**
     * @method
     * @summary Create an invitation on the data store
     * @param {ServiceInvoice} serviceInvoice The service invoice that is to be created
     * @param {SecurityPrincipal} principal The principal which is creating the service invoice
     * @returns {ServiceInvoice} The created service invoice
     */
    async createCareRelationship(careRelationshipBody, principal) {

        try {
            careRelationshipBody.userId = principal.session.userId;
            careRelationshipBody.expiry = new Date(new Date().getTime() + uhx.Config.security.invoiceValidity);
            careRelationshipBody.status = STATUS_NEW;
            var careRelationship = new model.CareRelationship().copy(careRelationshipBody);
            
            careRelationship = await uhx.Repositories.careRelationshipRepository.insert(careRelationship, principal);

            return careRelationship;
        }
        catch (e) {
            uhx.log.error(`Error creating care relationship: ${e.message}`);
            throw new exception.Exception("Error creating care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

        /**
     * @method
     * @summary Create an invitation on the data store
     * @param {ServiceInvoice} serviceInvoice The service invoice that is to be created
     * @param {SecurityPrincipal} principal The principal which is creating the service invoice
     * @returns {ServiceInvoice} The created service invoice
     */
    async acceptCareRelationship(careRelationshipBody, principal) {

        try {

            return await uhx.Repositories.transaction(async (_txc) => {
                
                var careRelationship = await uhx.Repositories.careRelationshipRepository.get(careRelationshipBody.id);
                if(careRelationship.status == STATUS_NEW && (true || principal.session.userId == careRelationship.providerId)){
                    careRelationship.status = STATUS_ACCEPTED;
                    
                    careRelationship = await uhx.Repositories.careRelationshipRepository.update(careRelationship, principal, _txc);

                    return careRelationship;
                }
                else{
                    uhx.log.error(`Must be a new care relationship`);
                }
            });
        }
        catch (e) {
            uhx.log.error(`Error accepting care relationship: ${e.message}`);
            throw new exception.Exception("Error accepting care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

        /**
     * @method
     * @summary Create an invitation on the data store
     * @param {ServiceInvoice} serviceInvoice The service invoice that is to be created
     * @param {SecurityPrincipal} principal The principal which is creating the service invoice
     * @returns {ServiceInvoice} The created service invoice
     */
    async declineCareRelationship(careRelationshipBody, principal) {

        try {

            return await uhx.Repositories.transaction(async (_txc) => {
                
                var careRelationship = await uhx.Repositories.careRelationshipRepository.get(careRelationshipBody.id);
                if(careRelationship.status == STATUS_NEW && principal.session.userId == careRelationship.providerId){
                    careRelationship.status = STATUS_DECLINED;
                    
                    careRelationship = await uhx.Repositories.careRelationshipRepository.update(careRelationship, principal, _txc);

                    return careRelationship;
                }
                else{
                    uhx.log.error(`Must be a new care relationship: ${e.message}`);
                    throw new exception.Exception("Must be a new care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
                }

            });
        }
        catch (e) {
            uhx.log.error(`Error accepting care relationship: ${e.message}`);
            throw new exception.Exception("Error accepting care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

            /**
     * @method
     * @summary Create an invitation on the data store
     * @param {ServiceInvoice} serviceInvoice The service invoice that is to be created
     * @param {SecurityPrincipal} principal The principal which is creating the service invoice
     * @returns {ServiceInvoice} The created service invoice
     */
    async createCarePlan(carePlanBody, principal) {

        try {
            return await uhx.Repositories.transaction(async (_txc) => {
                var careRelationship = await uhx.Repositories.careRelationshipRepository.get(carePlanBody.careRelationshipId);
                if(principal.session.userId == careRelationship.providerId){
                    var carePlan = new model.CarePlan().copy(carePlanBody);
                    carePlan.status = STATUS_NEW;
                    carePlan.total = carePlanBody.careServices.reduce(( ac, service) => ac + parseFloat(service.amount), 0)
                    carePlan = await uhx.Repositories.carePlanRepository.insert(carePlan, principal, _txc)
                    for(var i = 0; i< carePlanBody.careServices.length; i++){
                        var careService = new model.CareService().copy(carePlanBody.careServices[i]);
                        careService.carePlanId = carePlan.id;
                        careService.assetId = (await uhx.Repositories.assetRepository.getByCode("RECOIN")).id
                        careService.code = "00";
                        careService = await uhx.Repositories.careServiceRepository.insert(careService, principal, _txc);
                    }
                }
            });
        }
        catch (e) {
            uhx.log.error(`Error accepting care relationship: ${e.message}`);
            throw new exception.Exception("Error accepting care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }


}