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

const request = require("request"),
    exception = require("../exception"),
    security = require('../security'),
    Invoice = require('../model/Invoice'),
    Balance = require('../model/Balance'),
    uhx = require("../uhx");

module.exports = class GreenMoney {

    /**
    * @method
    * @summary Checks the status of an invoice with the Green Money API
    * @param {Number} userId The userId creating the invoice
    * @param {Number} amount The identifier of the invoice to retrieve
    * @param {SecurityPrincipal} principal The security principal
    */
    async createInvoice(userId, amount, principal) {

        var user = await uhx.Repositories.userRepository.get(userId);

        if(user.address.country != 'US')
            return new exception.Exception("Not available in this country", exception.ErrorCodes.NOT_SUPPORTED, "NOT_SUPPORTED")

        // Request to Green Money
        var url = uhx.Config.greenMoney.baseUrl
            + 'OneTimeInvoice?Client_ID=' + uhx.Config.greenMoney.apiPassword.client_id
            + '&ApiPassword=' + uhx.Config.greenMoney.apiPassword.password
            + '&PayorName=' + encodeURI(user.givenName) + ' ' + encodeURI(user.familyName)
            + '&EmailAddress=' + user.name
            + '&ItemName=' + amount + ' USD Credit'
            + '&ItemDescription=USD credit for UhX wallet (' + user.name + ')'
            + '&Amount=' + amount
            + '&PaymentDate=' + await new GreenMoney().formatDate(new Date())
            + '&x_delim_data=true&x_delim_char=,';

        var retVal = {};
        retVal.payor = user;
        retVal.amount = amount;

        return new Promise((fulfill, reject) => {
            request(url,
                function (err, res, body) {
                    if (err) {
                        uhx.log.error(`HTTP ERR: ${err}`)
                        reject(new exception.Exception("Error contacting GreenMoney API", exception.ErrorCodes.COM_FAILURE, err));
                    }
                    else if (res.statusCode == 200) {
                        // Parsing the response
                        var raw_data = res.body.split(',');
                        var response = {};
                        response.result = raw_data[0];
                        response.resultDesc = raw_data[1];
                        response.paymentResult = raw_data[2];
                        response.paymentDesc = raw_data[3];
                        response.invoiceId = raw_data[4];
                        response.checkId = raw_data[5];
                        retVal.response = response;

                        if(response.result != "0")
                            return new exception.Exception("Error creating invoice.", exception.ErrorCodes.Exception);

                        // Preparing invoice
                        var invoice = new Invoice();
                        invoice.amount = {};
                        invoice.invoiceId = response.invoiceId;
                        invoice.code = 'USD';
                        invoice.amount = amount;
                        invoice.creation_time = new Date();
                        invoice.expiry = null;
                        invoice.status_code = '3';
                        invoice.status_desc = 'NOT STARTED';
                        invoice.payor_id = userId;

                        retVal.invoice = invoice;

                        // Inserting the invoice into the database
                        uhx.Repositories.invoiceRepository.insert(invoice, principal);

                        fulfill(retVal);
                    }
                })
        });

        return retVal;
    }


    /**
    * @method
    * @summary Checks the status of an invoice with the Green Money API
    * @param {Number} invoiceId The identifier of the invoice to retrieve
    */
    async checkInvoice(invoiceId) {
        if (invoiceId)
            var url = uhx.Config.greenMoney.baseUrl
                + 'InvoiceStatus?Client_ID=' + uhx.Config.greenMoney.apiPassword.client_id
                + '&ApiPassword=' + uhx.Config.greenMoney.apiPassword.password
                + '&Invoice_ID=' + invoiceId
                + '&x_delim_data=true&x_delim_char=,';
        else
            new exception.Exception("Invalid invoice Id", exception.ErrorCodes.ERR_NOTFOUND, err);

        // Promise 
        return new Promise((fulfill, reject) => {
            request(url,
                function (err, res, body) {
                    var retVal = [];
                    if (err) {
                        uhx.log.error(`HTTP ERR: ${err}`)
                        reject(new exception.Exception("Error contacting GreenMoney API", exception.ErrorCodes.COM_FAILURE, err));
                    }
                    else if (res.statusCode == 200) {
                        var raw_data = res.body.split(',');
                        var data = {};
                        data.result = raw_data[0];
                        data.resultDesc = raw_data[1];
                        data.paymentResult = raw_data[2];
                        data.paymentDesc = raw_data[3];
                        data.invoiceId = raw_data[4];
                        data.checkId = raw_data[5];
                        retVal.push(data);
                        fulfill(retVal);
                    }
                })
        });
        return retVal;
    }

    /**
    * @method
    * @summary Updates the status of an invoice
    * @param {Invoice} invoice The invoice
    * @param {SecurityPrincipal} principal The security principal
    */
    async updateInvoice(invoice, principal) {
        switch (invoice.payment_status[0].paymentResult) {
            case "0":
                invoice.status_desc = 'COMPLETE';
                new GreenMoney().updateBalance(invoice.payorId, invoice.amount, invoice.code, principal)
                break;
            case "1":
                invoice.status_desc = 'PROCESSING';
                break;
            case "2":
                invoice.status_desc = 'DELETED';
                break;
            case "3":
                invoice.status_desc = 'NOT STARTED';
                break;
            default:
                res.status(500).json(new exception.Exception("Error updating invoice.", exception.ErrorCodes.UNKNOWN));
                break;
        }
        invoice.status_code = invoice.payment_status[0].paymentResult;
        await uhx.Repositories.invoiceRepository.update(invoice, principal);
    }

    /**
    * @method
    * @summary Gets all invoices for the userId
    * @param {Number} userId The userId to lookup
    * @param {SecurityPrincipal} principal The security principal
    */
    async getInvoicesForUser(userId, principal) {
        try {
            if (principal._session.userId == userId && principal.grant["wallet"] && security.PermissionType.OWNER) {
                // Gets all invoices from database
                var invoices = await uhx.Repositories.invoiceRepository.getAllForUser(userId);

                // Check and update invoice statuses
                for (var i = 0; i < invoices.length; i++) {
                    invoices[i].payment_status = await new GreenMoney().checkInvoice(invoices[i].invoiceId);
                    if (invoices[i].payment_status[0].paymentResult != invoices[i].status_code && invoices[i].status_code != "3") {
                        await new GreenMoney().updateInvoice(invoices[i], principal);
                    }
                }
                return invoices;
            } else {
                return new exception.Exception("Error getting invoices.", exception.ErrorCodes.SECURITY_ERROR);
            }
        }
        catch (ex) {
            return new exception.Exception("Error getting invoices: " + ex, exception.ErrorCodes.UNKNOWN);
        }
    }

    /**
    * @method
    * @summary Gets the currency balance for the user
    * @param {Number} userId The userId to lookup
    * @param {string} currency The currency type to look up
    */
    async getBalance(userId, currency) {
        return await uhx.Repositories.balanceRepository.getByUserId(userId, currency);
    }

    /**
    * @method
    * @summary Updates or inserts the balance for a user
    * @param {Number} userId The userId to update
    * @param {Number} amount The amount to add to the balance
    * @param {string} currency The currency type to look up
    */
    async updateBalance(userId, amount, currency) {
        var balance = new Balance();
        balance.id = userId;
        balance.amount = amount;
        balance.currency = currency;
        balance.creation_time = new Date();

        try {
            // Checks for an existing entry
            var userBalance = await new GreenMoney().getBalance(userId, currency);
            if (userBalance){
                var newAmount = parseFloat(balance.amount) + parseFloat(userBalance.amount);
                if (newAmount < 0)
                    return new exception.Exception("Negative balance", exception.ErrorCodes.ArgumentException);
                else
                    balance.amount = newAmount;
                var results = await uhx.Repositories.balanceRepository.update(balance);
            }
            else // Insert a new entry
                var results = await uhx.Repositories.balanceRepository.insert(balance);
        } catch (ex) {
            return new exception.Exception("Error updating balance: " + ex, exception.ErrorCodes.UNKNOWN);
        }
        return results;
    }

    /**
    * @method
    * @summary Modifies the date provided into the required format for the Green Money API
    * @param {Date} date The date to reformat
    */
    async formatDate(date) {
        var dd = date.getDate();
        var mm = date.getMonth() + 1;
        var yyyy = date.getFullYear();

        if (dd < 10)
            dd = '0' + dd;

        if (mm < 10)
            mm = '0' + mm;

        return mm + '/' + dd + '/' + yyyy;
    }
}
