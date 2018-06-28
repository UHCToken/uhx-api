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

const pg = require('pg'),
    exception = require('../exception'),
    model = require('../model/model'),
    Invoice = require("../model/Invoice"),
    security = require('../security');

/**
 * @class InvoiceRepository
 * @summary Represents the invoice repository logic
 */
module.exports = class InvoiceRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getAllForUser = this.getAllForUser.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific invoice from the database
     * @param {uuid} id Gets the specified invoice
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Invoices} The fetched invoices
     */
    async getAll(_txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM invoices");
            if (rdr.rows.length == 0)
                throw new exception.NotFoundException('invoice');
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal.push(new Invoice().fromData(rdr.rows[r]));
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieves all invoices
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Invoices} The fetched invoice
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM invoices WHERE invoices.id = $1", [id]);
            if (rdr.rows.length == 0)
                throw new exception.NotFoundException('invoice', id);
            else
                return new model.Invoice().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieves all invoices from the database for the user
     * @param {string} userId Gets the all invoices for the userId
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Invoice} The fetched invoices
     */
    async getAllForUser(userId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM invoices WHERE payor_id = $1", [userId]);
            if (rdr.rows.length == 0)
                throw new exception.NotFoundException('invoices', userId);
            else
                var retVal = [];
            for (var r in rdr.rows)
                retVal.push(new Invoice().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Update the specified invoice
     * @param {Invoice} invoice The instance of the invoice that is to be updated
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Invoice} The updated invoice data from the database
     */
    async update(invoice, _txc) {

        if (!invoice.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var updateCmd = model.Utils.generateUpdate(invoice, 'invoices');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update invoice in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return invoice.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }


    /**
     * @method
     * @summary Insert  the specified invoice
     * @param {Invoice} invoice The instance of the invoice that is to be inserted
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Invoice} The inserted invoice
     */
    async insert(invoice, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            var dbInvoice = invoice.toData();
            delete (dbInvoice.id);
            var updateCmd = model.Utils.generateInsert(dbInvoice, 'invoices');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register invoice in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return invoice.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete / de-activate a invoice in the system
     * @param {string} invoiceId The identity of the invoice to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Invoice} The deactivated invoice
     */
    async delete(invoiceId, runAs, _txc) {

        if (!invoiceId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE invoices SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [invoiceId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not deactivate invoice in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new model.Invoice().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }
}
