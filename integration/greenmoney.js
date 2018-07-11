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
     * @constructor
     * @summary Runs the update balance timer
     */
    constructor() {
        function autoupdate() { uhx.GreenMoney.updateAllInvoices(); }
        setInterval(autoupdate, uhx.Config.greenMoney.updateTimer);
    }

    /**
    * @method
    * @summary Checks the status of an invoice with the Green Money API
    * @param {Number} userId The userId creating the invoice
    * @param {Number} amount The identifier of the invoice to retrieve
    * @param {SecurityPrincipal} principal The security principal
    */
    async createInvoice(userId, amount, principal) {
        try {
            if (principal._session.userId == userId && principal.grant["invoice"] && security.PermissionType.OWNER) {

                var user = await uhx.Repositories.userRepository.get(userId);

                if (user.address.country != 'US')
                    return new exception.Exception("Not available in your country", exception.ErrorCodes.NOT_SUPPORTED, "NOT_SUPPORTED");

                if (await uhx.GreenMoney.getUserLimit(userId) >= uhx.Config.greenMoney.invoiceLimit.creationLimit)
                    return new exception.Exception("Too many recent invoices created", exception.ErrorCodes.RULES_VIOLATION, "RULES_VIOLATION");

                // Request to Green Money
                var url = uhx.Config.greenMoney.baseUrl
                    + 'OneTimeInvoice?Client_ID=' + uhx.Config.greenMoney.apiPassword.client_id
                    + '&ApiPassword=' + uhx.Config.greenMoney.apiPassword.password
                    + '&PayorName=' + encodeURI(user.givenName) + ' ' + encodeURI(user.familyName)
                    + '&EmailAddress=' + user.name
                    + '&ItemName=$' + amount + ' USD Credit'
                    + '&ItemDescription=USD credit for UhX wallet ' + user.name
                    + '&Amount=' + amount
                    + '&PaymentDate=' + await uhx.GreenMoney.formatDate(new Date())
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

                                if (response.result != "0") {
                                    reject(new exception.Exception("Error creating invoice. Green Money Error", exception.ErrorCodes.COM_FAILURE));
                                    return retVal;
                                }
                                
                                // Preparing invoice
                                var invoice = new Invoice();
                                invoice.amount = {};
                                invoice.invoiceId = response.invoiceId;
                                invoice.code = 'USD';
                                invoice.amount = amount;
                                invoice.creation_time = new Date();
                                invoice.expiry = new Date(new Date().getTime() + uhx.Config.greenMoney.expiryTime);
                                invoice.status_code = '3';
                                invoice.status_desc = 'NOT STARTED';
                                invoice.payor_id = userId;

                                retVal.invoice = invoice;

                                // Inserting the invoice into the database
                                uhx.Repositories.invoiceRepository.insert(invoice);
                                console.log(`Invoice for ${userId} created successfully.`)
                                fulfill(retVal);
                            }
                        })
                });

                return retVal;
            } else {
                return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
            }
        }
        catch (ex) {
            return new exception.Exception("Error creating invoice.", exception.ErrorCodes.UNKNOWN, ex);
        }
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
    */
    async updateInvoice(invoice) {
        switch (invoice.payment_status[0].paymentResult) {
            case "0":
                invoice.status_desc = 'COMPLETE';
                uhx.GreenMoney.updateBalance(invoice.payorId, invoice.amount, invoice.code);
                console.log(`Invoice ${invoice.id} is now complete, adding ${invoice.amount} to ${invoice.payorId} USD balance.`);
                break;
            case "1":
                invoice.status_desc = 'PROCESSING';
                console.log(`Invoice ${invoice.id} is now proccessing.`);
                break;
            case "2":
            case "":
                invoice.status_desc = 'DELETED';
                console.log(`Invoice ${invoice.id} was deleted.`);
                invoice.payment_status[0].paymentResult = "2";
                break;
            case "3":
                invoice.status_desc = 'NOT STARTED';
                console.log(`Invoice ${invoice.id} has not been started.`);
                break;
            case "4":
                invoice.status_desc = 'EXPIRED';
                break;
            default:
                res.status(500).json(new exception.Exception("Error updating invoice.", exception.ErrorCodes.UNKNOWN));
                break;
        }
        invoice.status_code = invoice.payment_status[0].paymentResult;
        await uhx.Repositories.invoiceRepository.update(invoice);
    }

    /**
    * @method
    * @summary Gets all invoices for the userId
    * @param {Number} userId The userId to lookup
    * @param {SecurityPrincipal} principal The security principal
    */
    async getInvoicesForUser(userId, principal) {
        try {
            if ((principal._session.userId == userId && principal.grant["invoice"] && security.PermissionType.OWNER) || (principal.grant["user"] & security.PermissionType.LIST)) {
                // Gets all invoices from database
                var invoices = await uhx.Repositories.invoiceRepository.getAllForUser(userId);

                // Check and update invoice statuses
                return uhx.GreenMoney.checkForUpdates(invoices);
            } else {
                return new exception.Exception("Invalid security permissions.", exception.ErrorCodes.SECURITY_ERROR);
            }
        }
        catch (ex) {
            return new exception.Exception("Error getting invoices.", exception.ErrorCodes.UNKNOWN, ex);
        }
    }

    /**
    * @method
    * @summary Checks and updates an array of invoices
    * @param {Invoices} invoices An array of invoices
    * @returns All invoices with updated statuses
    */
    async checkForUpdates(invoices) {
        var updated = 0;
        for (var i = 0; i < invoices.length; i++) {
            if (invoices[i].status_code != "0" && invoices[i].status_code != "2") {
                invoices[i].payment_status = await uhx.GreenMoney.checkInvoice(invoices[i].invoiceId);
                if (invoices[i].payment_status[0].paymentResult != invoices[i].status_code || invoices[i].expiry < new Date()) {
                    if (invoices[i].expiry < new Date() && (invoices[i].status_code != "4" || invoices[i].payment_status[0].paymentResult == "3"))
                        invoices[i].payment_status[0].paymentResult = "4";
                    await uhx.GreenMoney.updateInvoice(invoices[i]);
                    updated = updated + 1;
                }
            }
        }
        console.log(`${updated} invoice(s) updated.`)
        return (invoices);
    }
    /**
    * @method
    * @summary Gets all invoices
    * @returns All invoices
    */
    async getAllInvoices() {
        try {
            return await uhx.Repositories.invoiceRepository.getAll();
        } catch (ex) {
            return new exception.Exception("Error fetching invoices.", exception.ErrorCodes.UNKNOWN, ex);
        }
    }

    /**
    * @method
    * @summary Check for updates for all invoices
    * @returns Invoices updated boolean
    */
    async updateAllInvoices() {

        console.log("Updating invoices with Green Money API");
        try {
            var invoices = await uhx.GreenMoney.getAllInvoices();
            invoices = uhx.GreenMoney.checkForUpdates(invoices);
            return true;
        }
        catch (ex) {
            return new exception.Exception("Error updating invoices.", exception.ErrorCodes.UNKNOWN, ex);
            console.log("An error occurred while updating all invoices: " + ex);
        }
    }

    /**
    * @method
    * @summary Gets the count of invoices created today
    * @param {Number} userId The userId to lookup
    * @returns {Number} The count of invoices created today
    */
    async getUserLimit(userId) {
        try {
            // Gets all invoices from database
            var invoices = await uhx.Repositories.invoiceRepository.getAllForUser(userId);

            var invoiceCount = 0;
            // Check for invoices created recently
            for (var i = 0; i < invoices.length; i++) {
                var limitDate = new Date(new Date(invoices[i].creationTime).getTime() + uhx.Config.greenMoney.invoiceLimit.delayTime);
                if (limitDate > new Date()) {
                    invoiceCount++;
                }
            }
            return invoiceCount;

        }
        catch (ex) {
            return new exception.Exception("Error getting invoice limit count.", exception.ErrorCodes.UNKNOWN, ex);
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
        balance.userId = userId;
        balance.amount = amount;
        balance.currency = currency;
        balance.creation_time = new Date();

        try {
            // Checks for an existing entry
            var userBalance = await uhx.GreenMoney.getBalance(userId, currency);
            if (userBalance) {
                balance.id = userBalance.id;
                var newAmount = parseFloat(balance.amount) + parseFloat(userBalance.amount);
                if (newAmount < 0)
                    return new exception.Exception("Negative balance", exception.ErrorCodes.ArgumentException);
                else {
                    balance.amount = newAmount.toString();
                    var results = await uhx.Repositories.balanceRepository.update(balance);
                }
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
