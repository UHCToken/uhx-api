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
    STATUS_DISPUTED = "DISPUTED",
    STATUS_EXPIRED = "EXPIRED";
/**
  * @class
  * @summary Represents the core care plan logic of the UhX application
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
        this.confirmCarePlan = this.confirmCarePlan.bind(this);
        this.createCarePlan = this.createCarePlan.bind(this);
        this.fundCarePlan = this.fundCarePlan.bind(this);
        this.releaseFunds = this.releaseFunds.bind(this);
        this.declineCarePlan = this.declineCarePlan.bind(this)
    }

    /**
     * @method
     * @summary Create a care relationship
     * @param {CareRelationship} careRelationshipBody The care relationship that is being created
     * @param {SecurityPrincipal} principal The principal which is creating care relationship
     * @returns {CareRelationship} The created care relationship
     */
    async createCareRelationship(careRelationshipBody, principal) {

        try {
            var patient = await uhx.Repositories.patientRepository.get(principal.session.userId);
            var provider = await uhx.Repositories.providerRepository.get(careRelationshipBody.providerId);
            careRelationshipBody.patientId = patient.id
            if(patient && provider && provider.userId == patient.userId){
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Provider and patient can't be for the same user account", exception.ErrorCodes.NOT_SUPPORTED, exception.RuleViolationSeverity.ERROR));
            }
            else if(patient){
                careRelationshipBody.expiry = new Date(new Date().getTime() + uhx.Config.security.invoiceValidity);
                careRelationshipBody.status = STATUS_NEW;
                var careRelationship = new model.CareRelationship().copy(careRelationshipBody);
                
                careRelationship = await uhx.Repositories.careRelationshipRepository.insert(careRelationship, principal);

                return careRelationship;
            }
        }
        catch (e) {
            uhx.log.error(`Error creating care relationship: ${e.message}`);
            throw new exception.Exception("Error creating care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

        /**
     * @method
     * @summary Accept care relationship
     * @param {CareRelationship} careRelationshipBody The care relationship that is being accepted
     * @param {SecurityPrincipal} principal The principal which is declining the care relationship
     * @returns {ServiceInvoice} The accepted care relationship
     */
    async acceptCareRelationship(careRelationshipBody, principal) {

        try {
            var careRelationship = await uhx.Repositories.careRelationshipRepository.get(careRelationshipBody.id);
            var provider = await uhx.Repositories.providerRepository.get(principal.session.userId);
            if(careRelationship.status == STATUS_NEW && provider && provider.id == careRelationship.providerId){
                careRelationship.status = STATUS_ACCEPTED;
                careRelationship.providerNote = careRelationshipBody.feedback;
                careRelationship = await uhx.Repositories.careRelationshipRepository.update(careRelationship, principal);

                //Check to see if a chat room exists between the patient and provider. If not, then create one
                let roomExists = false;
                let patientChatRooms = await uhx.Repositories.chatRepository.getChatRoomsPatients(careRelationship.patientId)
                if(patientChatRooms) {
                    console.log(patientChatRooms)
                    patientChatRooms.forEach(room => {
                        if (room.providerid === careRelationship.providerId) {
                            roomExists = true;
                            console.log(`Chat room does exist`)
                        }
                    })
                }

                if(!roomExists) {
                    console.log(`chat room doesn't exist, CREATING.....`)
                    await uhx.Repositories.chatRepository.createChatRoom(careRelationship);
                }

                // await uhx.Repositories.chatRepository.createChatRoom(careRelationship);
                return careRelationship;
            }
            else{
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Principal must be a party involved in the care plan", exception.ErrorCodes.NOT_SUPPORTED, exception.RuleViolationSeverity.ERROR));
            }
        }
        catch (e) {
            uhx.log.error(`Error accepting care relationship: ${e.message}`);
            throw new exception.Exception("Error accepting care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

        /**
     * @method
     * @summary Decline care relationship
     * @param {CareRelationship} careRelationshipBody The care relationship that is being declined
     * @param {SecurityPrincipal} principal The principal which is declining the care relationship
     * @returns {ServiceInvoice} The declined care relationship
     */
    async declineCareRelationship(careRelationshipBody, principal) {

        try {
            var careRelationship = await uhx.Repositories.careRelationshipRepository.get(careRelationshipBody.id);
            var provider = await uhx.Repositories.providerRepository.get(principal.session.userId);
            if(careRelationship.status == STATUS_NEW && provider && provider.id == careRelationship.providerId){
                careRelationship.status = STATUS_DECLINED;
                careRelationship.providerNote = careRelationshipBody.feedback;
                careRelationship = await uhx.Repositories.careRelationshipRepository.update(careRelationship, principal);
                return careRelationship;
            }
            else{
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Principal must be a party involved in the care plan", exception.ErrorCodes.NOT_SUPPORTED, exception.RuleViolationSeverity.ERROR));
            }
        }
        catch (e) {
            uhx.log.error(`Error declining care relationship: ${e.message}`);
            throw new exception.Exception("Error declining care relationship", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

            /**
     * @method
     * @summary Create a care plan
     * @param {carePlan} carePlanBody The care plan that will be created
     * @param {SecurityPrincipal} principal The principal which is creating the care plan
     * @returns {CarePlan} The created care plan
     */
    async createCarePlan(carePlanBody, principal) {

        try {
            return await uhx.Repositories.transaction(async (_txc) => {
                var careRelationship = await uhx.Repositories.careRelationshipRepository.get(carePlanBody.careRelationshipId);
                var provider = await uhx.Repositories.providerRepository.get(principal.session.userId);
                if(provider && provider.id == careRelationship.providerId){
                    var carePlan = new model.CarePlan().copy(carePlanBody);
                    carePlan.status = STATUS_NEW;
                    carePlan.total = carePlanBody.careServices.reduce(( ac, service) => ac + parseFloat(service.amount), 0)
                    carePlan.assetId = (await uhx.Repositories.assetRepository.getByCode(uhx.Config.stellar.escrow_asset_code)).id;
                    carePlan = await uhx.Repositories.carePlanRepository.insert(carePlan, principal, _txc)
                    for(var i = 0; i< carePlanBody.careServices.length; i++){
                        var careService = new model.CareService().copy(carePlanBody.careServices[i]);
                        careService.carePlanId = carePlan.id;
                        careService.assetId = (await uhx.Repositories.assetRepository.getByCode(uhx.Config.stellar.escrow_asset_code)).id
                        careService.code = "00";
                        careService = await uhx.Repositories.careServiceRepository.insert(careService, principal, _txc);
                    }
                }
            });
        }
        catch (e) {
            uhx.log.error(`Error creating care plan: ${e.message}`);
            throw new exception.Exception("Error creating care plan", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }

    /**
     * @method
     * @summary Fund a care plan
     * @param {CarePlan} carePlanBody The care plan that is to be funded
     * @param {SecurityPrincipal} principal The principal which is funded the care plan
     * @returns {CarePlan} The updated care plan
     */
    async fundCarePlan(carePlanBody, principal) {

        try {
            var carePlan = await uhx.Repositories.carePlanRepository.get(carePlanBody.id)
            var careRelationship = await uhx.Repositories.careRelationshipRepository.get(carePlan.careRelationshipId);
            var patient = await uhx.Repositories.patientRepository.get(principal.session.userId);
            if(patient && patient.id == careRelationship.patientId && carePlan.status == STATUS_NEW){
                var transaction = { 
                    "type": "1",
                    "payeeId": uhx.Config.stellar.escrow_id,
                    "amount": {
                        "value": carePlan.total,
                        "code": "XLM",
                    },
                    "state": "1",
                    "memo": "Fund Escrow"
                };
                var transaction = new model.Transaction().copy(transaction);
                var patientWallet = await uhx.Repositories.walletRepository.getByUserAndNetworkId(patient.userId, "1");
                var patientBalance = await uhx.StellarClient.getAccount(patientWallet);
                var assetBalance = patientBalance.balances.find((o)=>o.code == "XLM");
                
                if(!assetBalance || (assetBalance.value-2) < carePlan.total){ 
                    throw new exception.Exception("Not enough assets to fulfill this funding", exception.ErrorCodes.INSUFFICIENT_FUNDS);
                }
                var transactions = await uhx.TokenLogic.createTransaction([transaction], principal);
                if(transactions.state != model.TransactionStatus.Failed){
                    var carePlan = await uhx.Repositories.carePlanRepository.get(carePlan.id)
                
                    carePlan.status = STATUS_FUNDED;
                    carePlan = await uhx.Repositories.carePlanRepository.update(carePlan, principal)
                    return(carePlan);
                }
                else{
                    throw new exception.Exception("Stellar network failure", exception.ErrorCodes.ERROR);
                }
            }
        }
        catch (e) {
            uhx.log.error(`Error funding care plan: ${e.message}`);
            throw new exception.Exception("Error funding care plan", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }



    /**
     * @method
     * @summary Decline a care plan
     * @param {CarePlan} carePlan The care plan that is to be declined
     * @param {SecurityPrincipal} principal The principal which is declining the care plan
     * @returns {CarePlan} The updated care plan
     */
    async declineCarePlan(carePlanId, principal) {

        try {
            var carePlan = await uhx.Repositories.carePlanRepository.get(carePlanId);
            var careRelationship = await uhx.Repositories.careRelationshipRepository.get(carePlan.careRelationshipId);
            var patient = await uhx.Repositories.patientRepository.get(principal.session.userId);
            if(patient && patient.id == careRelationship.patientId){
                carePlan.status = STATUS_DECLINED;
                carePlan = await uhx.Repositories.carePlanRepository.update(carePlan, principal)
                return(carePlan)
            }
        }
        catch (e) {
            uhx.log.error(`Error declining care plan: ${e.message}`);
            throw new exception.Exception("Error declining care plan", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }


        /**
     * @method
     * @summary Dispute a care plan
     * @param {CarePlan} carePlan The care plan that is to be disputed
     * @param {SecurityPrincipal} principal The principal which is disputing the care plan
     * @returns {CarePlan} The updated care plan
     */
    async disputeCarePlan(carePlanBody, principal) {

        try {
            var carePlan = await uhx.Repositories.carePlanRepository.get(carePlanBody.id);
            var careRelationship = await uhx.Repositories.careRelationshipRepository.get(carePlan.careRelationshipId);
            var patient = await uhx.Repositories.patientRepository.get(principal.session.userId);
            var provider = await uhx.Repositories.providerRepository.get(principal.session.userId);
            
            if(patient && patient.id == careRelationship.patientId && (carePlan.status == STATUS_FUNDED || carePlan.status == STATUS_PROVIDED)){
                carePlan.status = STATUS_DISPUTED;
                carePlan.disputeReason = carePlanBody.disputeReason;
                carePlan = await uhx.Repositories.carePlanRepository.update(carePlan, principal)
                return(carePlan)
            }
            else if(provider && provider.id == careRelationship.providerId && (carePlan.status == STATUS_FUNDED || carePlan.status == STATUS_RECEIVED)){
                carePlan.status = STATUS_DISPUTED;
                carePlan.disputeReason = carePlanBody.disputeReason;
                carePlan = await uhx.Repositories.carePlanRepository.update(carePlan, principal)
                return(carePlan)
            }
        }
        catch (e) {
            uhx.log.error(`Error disputing care plan: ${e.message}`);
            throw new exception.Exception("Error disputing care plan", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }
    /**
     * @method
     * @summary Confirm a care plan
     * @param {CarePlan} carePlan The care plan that is to be confirmed
     * @param {SecurityPrincipal} principal The principal which is confirming the care plan
     * @returns {CarePlan} The updated care plan
     */
    async confirmCarePlan(carePlan, principal) {
        try {
            var updatedCarePlan = await uhx.Repositories.carePlanRepository.get(carePlan.id);
            var careRelationship = await uhx.Repositories.careRelationshipRepository.get(updatedCarePlan.careRelationshipId);
            var provider = await uhx.Repositories.providerRepository.get(principal.session.userId);
            var patient = await uhx.Repositories.patientRepository.get(principal.session.userId);
            
            if(updatedCarePlan.status == STATUS_FUNDED && updatedCarePlan.status != STATUS_RECEIVED && updatedCarePlan.status != STATUS_PROVIDED){
                if(patient && patient.id == careRelationship.patientId){
                    updatedCarePlan.status = STATUS_RECEIVED;
                    updatedCarePlan = await uhx.Repositories.carePlanRepository.update(updatedCarePlan, principal)
                    return updatedCarePlan;
                }
                else if(provider && provider.id == careRelationship.providerId){
                    updatedCarePlan.status = STATUS_PROVIDED;
                    updatedCarePlan = await uhx.Repositories.carePlanRepository.update(updatedCarePlan, principal)
                    return updatedCarePlan;
                }
                else{
                    throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Principal must be a party involved in the care plan", exception.ErrorCodes.NOT_SUPPORTED, exception.RuleViolationSeverity.ERROR));
                }
            }
            else if((patient && patient.id == careRelationship.patientId && updatedCarePlan.status == STATUS_PROVIDED) || (provider && provider.id == careRelationship.providerId && updatedCarePlan.status == STATUS_RECEIVED)){
                var transaction = await this.releaseFunds(careRelationship.providerId, updatedCarePlan.total, principal);
                updatedCarePlan.status = STATUS_COMPLETED;
                updatedCarePlan = await uhx.Repositories.carePlanRepository.update(updatedCarePlan, principal)
                return updatedCarePlan;
            }
            else{
                throw new exception.BusinessRuleViolationException(new exception.RuleViolation("Care plan can only be confirmed if funded.", exception.ErrorCodes.NOT_SUPPORTED, exception.RuleViolationSeverity.ERROR));
            }
            
            
        }
        catch (e) {
            uhx.log.error(`Error confirming care plan: ${e.message}`);
            throw new exception.Exception("Error confirming care plan", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }
    /**
     * @method
     * @summary Releasing of funds for a care plan
     * @param {Numeric} amount The amount of funds to be released
     * @param {SecurityPrincipal} principal The principal which is releasing the funds
     * @returns {Transaction} The fund release transaction
     */
    async releaseFunds(providerId, amount, principal) {

        try {
            var provider = await uhx.Repositories.providerRepository.get(providerId)
            var providerWallet = await uhx.Repositories.walletRepository.getByUserAndNetworkId(provider.userId, '1');
            var escrowWallet = await uhx.Repositories.walletRepository.getByUserAndNetworkId(uhx.Config.stellar.escrow_id, '1')
            var providerSignerWallet = await uhx.Repositories.walletRepository.getByUserAndNetworkId(uhx.Config.stellar.signer_provider_id, '1')
            var patientSignerWallet = await uhx.Repositories.walletRepository.getByUserAndNetworkId(uhx.Config.stellar.signer_patient_id, '1')
            var signers = [patientSignerWallet, providerSignerWallet];
            return (await uhx.StellarClient.sendEscrowTransaction(escrowWallet, providerWallet, signers, {code: "XLM", value : "" + amount}))
        }
        catch (e) {
            uhx.log.error(`Error releasing funds for care plan: ${e.message}`);
            throw new exception.Exception("Error releasing funds for care plan", e.code || exception.ErrorCodes.UNKNOWN, e);
        }
    }


}