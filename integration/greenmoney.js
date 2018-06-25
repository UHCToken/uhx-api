
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
    uhx = require("../uhx");

module.exports = class GreenMoney {

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

}
