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

 const Stellar = require('stellar-sdk'),
    uhc = require("../uhc"),
    model = require("../model/model"),
    handlebars = require('handlebars'),
    nodemailer = require('nodemailer'),
    fs = require('fs'),
    exception = require('../exception');

/**
 * @class
 * @summary Represents a wrapper that sends nice, templated e-mails
 */
module.exports = class EmailWrapper {

    /**
     * @constructor
     * @param {*} options The mail options from the configuration specifying server information
     */
    constructor(options) {
        this._options = options;
        this.templateEmail = this.templateEmail.bind(this);
        this.sendTemplated = this.sendTemplated.bind(this);
    }

    /**
     * @method
     * @summary Uses handlebars to template an e-mail
     * @param {string} template The e-mail template to fetch
     * @param {string} replacements The replacements to be made
     * @returns {*} The templated e-mail in HTML and TEXT
     */
    templateEmail(template, replacements) {
        var retVal = {};
        // Create e-mails from templates
        if(fs.existsSync(template + ".html"))
            retVal.html = handlebars.compile(fs.readFileSync(template + ".html").toString("utf-8"))(replacements);
        if(fs.existsSync(template + ".txt"))
            retVal.text = handlebars.compile(fs.readFileSync(template + ".txt").toString("utf-8"))(replacements);
        return retVal;
    }

    /**
     * @method
     * @summary Sends a templated e-mail
     * @param {*} options The mail options to set
     * @param {string} options.to The e-mail address which will receive the e-mail
     * @param {string} options.from The sending e-mail address
     * @param {string} options.subject The subject of the e-mail
     * @param {string} options.template The template to use
     * @param {*} replacements The replacements to be made
     */
    async sendTemplated(options, replacements) {

        var templateData = this.templateEmail(options.template, replacements);
        options.text = templateData.text;
        options.html = templateData.html;
        options.cc = "justin.fyfe1@mohawkcollege.ca";
        var transport = nodemailer.createTransport(this._options);
        await transport.sendMail(options);
        console.info(`E-Mail has successfully been sent to ${options.to}`);


    }
}