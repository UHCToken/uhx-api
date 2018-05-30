
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
    MonetaryAmount = require('./MonetaryAmount'),
    User = require('./User'),
    ModelBase = require('./ModelBase');

const uuidRegex = /[A-F0-9]{8}-(?:[A-F0-9]{4}\-){3}[A-F0-9]{12}/i;

/**
 * @class
 * @summary Represents a common class for transactions (fiat, onchain, offchain etc.)
 * @swagger
 * definitions:
 *  Transaction:
 *      properties:
 *          id:
 *              type: string
 *              description: The unique identifier for the transaction record
 *          type:
 *              type: number
 *              description: The type of transaction
 *              enum:
 *                  - Payment
 *                  - Trust
 *                  - Refund 
 *                  - Deposit
 *                  - Account Management
 *          test: 
 *              type: boolean
 *              description: When present, does not commit the transaction, rather validates that a transaction is most likely to succeed
 *          memo:
 *              type: string
 *              description: A textual memorandum applied to the transaction at time of processing
 *          postingDate:
 *              type: Date
 *              description: The date that this transaction was posted
 *          payorId:
 *              type: string    
 *              description: The identity of the user or public address which made the payment
 *          payeeId:
 *              type: string
 *              description: The identity of the user or public address which was paid
 *          payor:
 *              $ref: "#/definitions/User"
 *              description: On transaction detail, contains the detailed user information for the payor
 *          payee:
 *              $ref: "#/definitions/User"
 *              description: On transaction detail, contains the detailed user information for the payee
 *          amount:
 *              $ref: "#/definitions/MonetaryAmount"
 *              description: The amount which the transaction was worth
 *          fee:
 *              $ref: "#/definitions/MonetaryAmount"  
 *              description: If present, indicates any fees that were collected for the transaction
 *          state:
 *              type: number
 *              description: The status of the transaction
 *              enum:
 *                  - Pending (1)
 *                  - Complete (2)
 *                  - Failed (3)
 *          ref:
 *              type: string
 *              description: A reference to the transaction. Can be a link or source information contained on the transaction. 
 *          escrowInfo:
 *              type: string
 *              description: A reference to a stellar escrow account which is being used to hold the distributed funds
 *          escrowTerm:
 *              type: string
 *              description: The term that the escrow was established under (90 DAY, 120 DAY, etc.)
 *              enum:
 *                  - '0 DAY'
 *                  - '15 DAY'
 *                  - '30 DAY'
 *                  - '60 DAY'
 *                  - '90 DAY'
 *                  - '120 DAY'
 */
module.exports = class Transaction extends ModelBase {

    /**
     * 
     * @param {string} id The primary identifier of the transaction in whatever the source system is
     * @param {TransactionType} type The type of the transaction
     * @param {string} memo The memo on the transaction
     * @param {Date} postingDate The date that the transaction was posted (completed) on the account
     * @param {User} payor The user or userId of the user which paid the fee
     * @param {User} payee The user or userId of the user which received the fee
     * @param {MonetaryAmount} amount The amount of the transaction
     * @param {MonetaryAmount} fee The fee collected or processed on the transaction
     * @param {Number} status The status of the transaction
     * @param {*} ref A reference object
     */
    constructor(id, type, memo, postingDate, payor, payee, amount, fee, ref, state) {
        super();
        this.id = id;
        this.postingDate = postingDate;
        this.type = type;
        this.memo = memo;

        // Payor details
        if(payor)
            switch(payor.constructor.name) {
                case "Wallet":
                    this._payorWalletId = payor.id;
                    this.payorId = payor.address;
                    break;
                case "User":
                    this._payorWalletId = payor.walletId;
                    this.payorId =  payor.id;
                    this._payor = payor;
                    break;
                case "Asset":
                    this._payorWalletId = payor._distWalletId;
                    this.payorId =  payor.id;
                    this._payor = payor;
                    break;
                case "String":
                    this.payorId = payor;
                    break;
                default:
                    this.payorId = null;
                    break;
            }

        // Payee details
        if(payee)
          switch(payee.constructor.name) {
                case "Wallet":
                    this._payeeWalletId = payee.id;
                    this.payeeId = payee.address;
                    break;
                case "User":
                    this._payeeWalletId = payee.walletId;
                    this.payeeId = payee.id;
                    this._payee = payee;
                    break;
                case "Asset":
                    this._payeeWalletId = payee._distWalletId;
                    this.payeeId = payee.id;
                    this._payee = payee;
                    break;   
                case "String":
                    this.payeeId = payee;
                    break;
                default:
                    this.payeeId = null;
                    break;
            }

        this.amount = amount;
        this.fee = fee;
        this.ref = ref;
        this.state = state || 2;
    }

    /**
     * @property
     * @type {User}
     * @summary Gets the payor. Note you should call await loadPayor()
     */
    get payor() { return this._payor; }

    /**
     * @property 
     * @type {User}
     * @summary Gets the payee. Note you should call await loadPayee() 
     */
    get payee() { return this._payee; }

    /**
     * @method
     * @returns {User} The payor of the transaction
     * @summary Loads the payor from the UHX database
     */
    async loadPayor(_txc) {
        if(!this._payor && this.payorId)
            this._payor = await uhx.Repositories.userRepository.get(this.payorId, _txc);
        else if(!this._payor && this._payorWalletId) {
            this._payor = await uhx.Repositories.userRepository.getByWalletId(this._payorWalletId, _txc) ||
                 await uhx.Repositories.assetRepository.getByWalletId(this._payorWalletId, _txc);
        }
        return this._payor;
    }

    /**
     * @method
     * @returns {User} The payee of the transaction
     * @summary Loads the payee from the UHX database
     */
    async loadPayee(_txc) {
        if(!this._payee && this.payeeId) 
            this._payee = await uhx.Repositories.userRepository.get(this.payeeId, _txc);
        else if(!this._payee && this._payeeWalletId) {
            this._payee = await uhx.Repositories.userRepository.getByWalletId(this._payeeWalletId, _txc) || 
                await uhx.Repositories.assetRepository.getByWalletId(this._payeeWalletId, _txc);
        }
        return this._payee;
    }

    /**
     * @method
     * @summary Load the payor wallet 
     * @param {*} _txc The transaction context
     */
    async loadPayorWallet(_txc) {
        if(!this._payorWallet) 
        {
            if(this._payorWalletId)
                this._payorWallet = await uhx.Repositories.walletRepository.get(this._payorWalletId, _txc);
            else if(this.payorId && !uuidRegex.test(this.payorId))
                this._payorWallet = await uhx.Repositories.walletRepository.getByPublicKey(this.payorId, _txc);
            else if(this.payorId) {
                try { this._payorWallet = await uhx.Repositories.walletRepository.get(this.payorId, _txc); }
                catch(e) { 
                    this._payorWallet = await uhx.Repositories.walletRepository.getByUserId(this.payorId, _txc);
                }
            }
        }
        return this._payorWallet;
    }

        /**
     * @method
     * @summary Load the payee wallet 
     * @param {*} _txc The transaction context
     */
    async loadPayeeWallet(_txc) {
        if(!this._payeeWallet) 
        {
            if(this._payeeWalletId)
                this._payeeWallet = await uhx.Repositories.walletRepository.get(this._payeeWalletId, _txc);
            else if(this.payeeId && !uuidRegex.test(this.payeeId))
                this._payeeWallet = await uhx.Repositories.walletRepository.getByPublicKey(this.payeeId, _txc);
            else if(this.payeeId) {
                try { this._payeeWallet = await uhx.Repositories.walletRepository.get(this.payeeId, _txc); }
                catch(e) { 
                    this._payeeWallet = await uhx.Repositories.walletRepository.getByUserId(this.payeeId, _txc);
                }
            }
        }
        return this._payeeWallet;
    }

    /**
     * @summary Represent the object in JSON
     * @method
     */
    toJSON() {
        var retVal = this.stripHiddenFields();
        retVal.payor = this.payor;
        retVal.payee = this.payee;
        return retVal;
    }

    /**
     * @summary
     * @returns {Transaction} The parsed transaction
     * @param {*} dbTransaction Convert this transaction from database
     */
    fromData(dbTransaction) {
        return this._fromData(dbTransaction);
    }

    /**
     * @method 
     * @summary Translate from data layer to class layer
     * @param {*} dbTransaction The database transaction to convert from
     */
    _fromData(dbTransaction) {

        this.id = dbTransaction.id;
        this._payeeWalletId = dbTransaction.payee_wallet_id;
        this._payorWalletId = dbTransaction.payor_wallet_id;
        this.type = dbTransaction.type_id;
        this.batchId = dbTransaction.batch_id;
        this.memo = dbTransaction.memo;
        this.ref = dbTransaction.ref;
        this.escrowInfo = dbTransaction.escrow;
        this.escrowTerm = dbTransaction.escrow_time;
        this.creationTime = dbTransaction.creation_time;
        this.createdBy = dbTransaction.created_by;
        this.updatedTime = dbTransaction.updated_time;
        this.updatedBy = dbTransaction.updated_by;
        this.postingDate = dbTransaction.transaction_time;
        this.state = dbTransaction.state_id;
        this.payeeId = null;
        this.payorId = null;
        this.amount = new MonetaryAmount(dbTransaction.amount, dbTransaction.asset_code);
        return this;
    }

    /**
     * @method
     * @summary Converts this transaction to database format
     */
    toData() {
        return this._toData();
    }

    /**
     * @method
     * @summary Convert internal representation to data
     */
    _toData() {
        return {
            id: this.id,
            payee_wallet_id: this._payeeWallet ? this._payeeWallet.id : this._payeeWalletId,
            payor_wallet_id: this._payorWallet ? this._payorWallet.id :this._payorWalletId,
            type_id: this.type,
            batch_id : this.batchId,
            memo: this.memo,
            ref : this.ref,
            escrow: this.escrowInfo,
            escrow_time: this.escrowTerm,
            transaction_time: this.postingDate,
            state_id: this.state,
            amount: this.amount ? this.amount.value : null,
            asset_code: this.amount ? this.amount.code : null
        };
    }
}