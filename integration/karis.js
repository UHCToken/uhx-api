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

const schedule = require('node-schedule'),
    uhx = require("../uhx"),
    model = require('../model/model'),
    config = require('../config'),
    fs = require('fs'),
    Client = require('ssh2-sftp-client'),
    sftp = new Client(),
    Json2csvParser = require('json2csv').Parser;

module.exports = class KarisService {

    constructor() {
        Number.prototype.pad = function(size) {
            let s = String(this);
            while (s.length < (size || 2)) {s = "0" + s;}
            return s;
        }

        // this.sendDailyLog();

        // Starts a schedule to send daily logs to Karis every day at 9 pm
        schedule.scheduleJob('* * 19 * *', () => {
            this.sendDailyLog();
        });

        // Starts a schedule to send a monthly census to Karis on the 1st of every month
        schedule.scheduleJob('0 0 1 * *', () => {
            this.monthlyCensus();
        });
    }

    /**
     * @method
     * @summary Send a daily log of current active members to Karis
     */
    async sendDailyLog() {
        try {
            const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsForDailyReport();

            if (!subscriptions) {
                // No subscriptions found
            } else {
                const reports = [];

                for (let i = 0; i < subscriptions.length; i++) {
                    const patient = await uhx.Repositories.patientRepository.get(subscriptions[i].patientId);

                    reports.push(new model.Karis().fromData(patient, subscriptions[i]));
                }

                const now = new Date();
                const fileDateDisplay = (now.getMonth() + 1).pad() + now.getDate().pad() + now.getFullYear();
                const filename = "reports\\karis\\daily\\" + config.karis.clientCode + "_" + fileDateDisplay;

                this.sendKarisReport(reports, filename);
            }
        } catch(ex) {
            console.log(ex);
        }
    }

    /**
     * @method
     * @summary Send a monthly census of current active members to Karis
     */
    async sendMonthlyCensus() {
        try {
            const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsForMonthlyReport();

            if (!subscriptions) {
                // No subscriptions found
            } else {
                const reports = [];

                for (let i = 0; i < subscriptions.length; i++) {
                    const subscription = subscriptions[i];
                    const user = await uhx.Repositories.userRepository.get(subscription.userId);

                    reports.push(new model.Karis().fromData(user, subscription));
                }

                const fileDateDisplay = (now.getMonth() + 1).pad() + now.getDate().pad() + now.getFullYear();
                const filename = "reports\\karis\\monthly\\UNIVERSALHEALTHCOINCENSUS_" + fileDateDisplay;

                this.sendKarisReport(reports, filename);
            }
        } catch(ex) {

        }
    }

    /**
     * @method
     * @summary Sends the list of reports to Karis
     * @param {Karis} reports A collection of Karis reports to be sent to daily or monthly reports
     * @param {string} filename The name of the file to be saved within Karis
     */
    sendKarisReport(reports, filename) {
        const csvFilename = filename + ".csv";
        
        const fields = [{
            label: 'Member Number',
            value: 'memberNumber'
        },{
            label: 'Member Full Name',
            value: 'memberFullName'
        },{
            label: 'Member First Name',
            value: 'memberFirstName'
        },{
            label: 'Member Last Name',
            value: 'memberLastName'
        },{
            label: 'Address Line 1',
            value: 'addressLine1'
        },{
            label: 'Address Line 2',
            value: ''
        },{
            label: 'City',
            value: 'city'
        },{
            label: 'State',
            value: 'state'
        },{
            label: 'Zip Code',
            value: 'zipcode'
        },{
            label: 'Phone Number',
            value: 'phoneNumber'
        },{
            label: 'Fax Number',
            value: 'faxNumber'
        },{
            label: 'Email Address',
            value: 'email'
        },{
            label: 'Gender',
            value: 'gender'
        },{
            label: 'Effective Date',
            value: 'effectiveDate'
        },{
            label: 'Termination Date',
            value: 'terminationDate'
        },{
            label: 'Birthdate',
            value: 'dob'
        },{
            label: 'Client Code',
            value: 'clientCode'
        },{
            label: 'Group Code',
            value: 'groupCode'
        },{
            label: 'Plan Code',
            value: 'planCode'
        },{
            label: 'Member Affiliation or ID Card',
            value: 'memberAffiliation'
        }];

        const json2csvParser = new Json2csvParser({ fields });
        const csv = json2csvParser.parse(reports);

        fs.writeFile(csvFilename, csv, 'utf8', function (err) {
            if (err) {
                console.log('Some error occured - file either not saved or corrupted file saved.');
            } else{
                sftp.connect({
                    host: config.karis.sftpClient.host,
                    port: config.karis.sftpClient.port,
                    username: config.karis.sftpClient.userName,
                    privateKey: require('fs').readFileSync(config.karis.sftpClient.privateKeyLocation)                
                }).then(() => {
                    const file = csvFilename.split('\\').slice(-1)[0];
                    
                    sftp.put(csvFilename, file);
                }).catch((err) => {
                    console.log(err, 'catch error');
                });
            }
        });
    }
}
