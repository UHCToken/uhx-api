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

const ModelBase = require('./ModelBase'),
    uhx = require('../uhx'),
    User = require('./User');

/**
* @class
* @summary Represents an invoice for a USD echeck purchase
* @swagger
* definitions:
*     Invoice:
*         description: "Represents an invoice for a USD echeck purchase"
*         properties:
*             id: 
*                 type: string
*                 description: The unique identifier for the invoice
*             invoiceId:
*                 type: string
*                 description: The invoice id representing the external invoice
*             amount:
*                 type: number
*                 description: The amount of the invoice
*             code:
*                 type: string
*                 description: The type of currency
*             creationTime:
*                 type: date
*                 description: The time the invoice was created
*             expiry:
*                 type: date
*                 description: The time the invoice will expire
*             status_code:
*                 type: number
*                 description: The number code for the invoice status
*             status_desc:
*                 type: string
*                 description: The string description for the invoice status
*/
module.exports = class Invoice extends ModelBase {

    /**
     * @constructor
     * @param {User} payor The user or userId of the user of the invoice
     * @param {Number} invoice_id The invoice id
     * @param {Number} amount The amount of the invoice
     * @param {string} code The currency type
     * @param {Number} status_code The status of the invoice
     * @param {string} status_desc The status description
     * @summary Creates a new invoice
     */
    constructor(payor, invoice_id, amount, code, status_code, status_desc) {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);

        if (payor)
            this.payorId = payor;

        this.invoiceId = invoice_id;
        this.amount = amount;
        this.code = code || 'USD';
        this.status_code = status_code || "3";
        this.status_desc = status_desc || "NOT STARTED";
    }


    /**
     * @method
     * @summary Converts this model class into a database class
     * @param {*} dbInvoice The database representation of an invoice
     */
    fromData(dbInvoice) {
        this.id = dbInvoice.id;
        this.invoiceId = dbInvoice.invoice_id;
        this.amount = dbInvoice.amount;
        this.code = dbInvoice.code || 'USD';
        this.creationTime = dbInvoice.creation_time;
        this.expiry = dbInvoice.expiry || null;
        this.reminderDate = dbInvoice.reminder_date || null;
        this.status_code = dbInvoice.status_code;
        this.status_desc = dbInvoice.status_desc;
        this.payorId = dbInvoice.payor_id;
        return this;
    }

    /**
     * @method
     * @summary Convert this invoice model into a data model representation
     */
    toData() {
        return {
            id: this.id,
            invoice_id: this.invoiceId,
            amount: this.amount,
            code: this.code || 'USD',
            creation_time: this.creationTime,
            expiry: this.expiry || null,
            reminder_date: this.reminderDate || null,
            status_code: this.status_code,
            status_desc: this.status_desc,
            payor_id: this.payor_id
        };
    }

    /**
     * @property
     * @type {User}
     * @summary Gets the payor. Note you should call await loadPayor()
     */
    get payor() { return this._payor; }

    /**
     * @method
     * @returns {User} The payor of the invoice
     * @summary Loads the payor from the UhX database
     */
    async loadPayor(_txc) {
        if (!this._payor && this.payorId)
            this._payor = await uhx.Repositories.userRepository.get(this.payorId, _txc);
        else if (!this._payor && this._payorWalletId) {
            this._payor = await uhx.Repositories.userRepository.getByWalletId(this._payorWalletId, _txc) ||
                await uhx.Repositories.assetRepository.getByWalletId(this._payorWalletId, _txc);
        }
        return this._payor;
    }

    /**
     * @method
     * @summary Represent this object in JSON
     */
    toJSON() {
        var retVal = this.stripHiddenFields(this);
        retVal.payor = this.payor;
        return retVal;
    }

}