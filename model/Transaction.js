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
    MonetaryAmount = require('./MonetaryAmount'),
    User = require('./User'),
    ModelBase = require('./ModelBase');

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
 *              description: The identity of the user which made the payment
 *          payeeId:
 *              type: string
 *              description: The identity of the user which was paid
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
 *          status:
 *              type: number
 *              description: The status of the transaction
 *              enum:
 *                  - Pending (1)
 *                  - Complete (2)
 *                  - Failed (3)
 *          ref:
 *              type: string
 *              description: A reference to the transaction. Can be a link or source information contained on the transaction. 
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
     * @param {TransactionStatus} status The status of the transaction
     * @param {*} ref A reference object
     */
    constructor(id, type, memo, postingDate, payor, payee, amount, fee, ref, status) {
        super();
        this.id = id;
        this.postingDate = postingDate;
        this.type = type;
        this.memo = memo;
        this._payor = payor instanceof User ? payor : null;
        this.payorId = payor instanceof User ? payor.id : payor;
        this._payee = payee instanceof User ? payee : null;
        this.payeeId = payee instanceof User ? payee.id : payee;
        this.amount = amount;
        this.fee = fee;
        this.ref = ref;
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
     * @summary Loads the payor from the UHC database
     */
    async loadPayor() {
        if(!this._payor)
            this._payor = await uhc.Repositories.userRepository.get(this.payorId);
        return this._payor;
    }

    /**
     * @method
     * @returns {User} The payee of the transaction
     * @summary Loads the payee from the UHC database
     */
    async loadPayee() {
        if(!this._payee)
            this._payee = await uhc.Repositories.userRepository.get(this.payeeId);
        return this._payee;
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

}