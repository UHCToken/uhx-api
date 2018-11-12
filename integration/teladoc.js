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

const Json2csvParser = require('json2csv').Parser,
    Client = require('ssh2-sftp-client'),
    schedule = require('node-schedule'),
    exception = require('../exception'),
    model = require('../model/model'),
    config = require('../config'),
    moment = require('moment'),
    uhx = require("../uhx"),
    sftp = new Client(),
    fs = require('fs');

module.exports = class TeladocService {

    constructor() {
        // this.sendDailyLog();

        // Starts a schedule to send daily logs to Teladoc every day at 9 pm
        schedule.scheduleJob('* * 21 * *', () => {
            // this.sendDailyLog();
        });

        // Starts a schedule to send a monthly census to Teladoc on the 1st of every month
        schedule.scheduleJob('0 0 1 * *', () => {
            // this.monthlyCensus();
        });
    }

    /**
     * @method
     * @summary Send a daily log of current active members to Teladoc
     */
    async sendDailyLog() {
        try {
            const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsForDailyReportToTeladoc();
            const reports = [];

            if (subscriptions) {
                for (let i = 0; i < subscriptions.length; i++) {
                    const patient = await uhx.Repositories.patientRepository.get(subscriptions[i].patientId);

                    reports.push(new model.Teladoc().fromData(patient, subscriptions[i]));
                }
            }

            const fileDateDisplay = moment().format('YYYYMMDD');
            const filename = "reports\\teladoc\\daily\\" + config.teladoc.groupId + "_TELADOCFAMILYID_" + fileDateDisplay;

            this.sendTeladocReport(reports, filename);
        } catch(ex) {
            uhx.log.error(`Could not send daily report to Teladoc: ${ex}`);
            throw new exception.Exception('Could not send daily report to Teladoc', exception.ErrorCodes.UNKNOWN);
        }
    }

    /**
     * @method
     * @summary Send a monthly census of current active members to Teladoc
     */
    async sendMonthlyCensus() {
        try {
            const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsForMonthlyReportToTeladoc();
            const reports = [];

            if (subscriptions) {
                for (let i = 0; i < subscriptions.length; i++) {
                    const subscription = subscriptions[i];
                    const user = await uhx.Repositories.patientRepository.get(subscription.patientId);

                    reports.push(new model.Teladoc().fromData(user, subscription));
                }
            }

            const fileDateDisplay = moment().format('YYYYMMDD');
            const filename = "reports\\teladoc\\monthly\\" + config.teladoc.groupId + "_TELADOCFAMILYID_" + fileDateDisplay;

            this.sendTeladocReport(reports, filename);
        } catch(ex) {
            uhx.log.error(`Could not send monthly report to Teladoc: ${ex}`);
            throw new exception.Exception('Could not send monthly report to Teladoc', exception.ErrorCodes.UNKNOWN);
        }
    }

    /**
     * @method
     * @summary Sends the list of reports to Teladoc
     * @param {Teladoc} reports A collection of Teladoc reports to be sent 
     * @param {string} filename The name of the file to be sent to Teladoc
     */
    sendTeladocReport(reports, filename) {
        const csvFilename = filename + ".csv";
        const self = this;
        
        const fields = [{
            label: 'Group ID',
            value: 'groupId'
        },{
            label: 'Relationship To Primary',
            value: 'relationshipToPrimary'
        },{
            label: 'Member ID',
            value: 'memberId'
        },{
            label: 'Primary ID',
            value: 'primaryId'
        },{
            label: 'Name Prefix',
            value: 'namePrefix'
        },{
            label: 'First Name',
            value: 'firstName'
        },{
            label: 'Middle Name',
            value: 'middleName'
        },{
            label: 'Last Name',
            value: 'lastName'
        },{
            label: 'Name Suffix',
            value: 'nameSuffix'
        },{
            label: 'Gender',
            value: 'gender'
        },{
            label: 'Language',
            value: 'language'
        },{
            label: 'BirthDate',
            value: 'birthDate'
        },{
            label: 'Address Line 1',
            value: 'addressLine1'
        },{
            label: 'Address Line 2',
            value: 'addressLine2'
        },{
            label: 'City',
            value: 'city'
        },{
            label: 'State',
            value: 'state'
        },{
            label: 'Zip',
            value: 'zipcode'
        },{
            label: 'Home Number',
            value: 'homePhone'
        },{
            label: 'Cell Number',
            value: 'cellPhone'
        },{
            label: 'Work Number',
            value: 'workPhone'
        },{
            label: 'Email',
            value: 'email'
        },{
            label: 'Start Date',
            value: 'startDate'
        },{
            label: 'Term Date',
            value: 'termDate'
        },{
            label: 'Health Plan ID',
            value: 'healthPlanId'
        }];

        const json2csvParser = new Json2csvParser({ fields, delimiter: '', quote: ''  });
        const csv = json2csvParser.parse(reports);
        
        fs.writeFile(csvFilename, csv, 'utf8', function (err) {
            if (err) {
                uhx.log.error(`Error occurred while trying to create the csv file: ${err}`);
                throw new exception.Exception('Error occurred while trying to create the csv file', exception.ErrorCodes.ERR_FILE_CREATION);
            } else{
                self.sendFile(csvFilename);
            }
        });
    }

    /**
     * @method
     * @summary Sends the csv file to the Teladoc server 
     * @param {string} csvFilename The location and filename for the csv file to send
     */
    async sendFile(csvFilename) {
        sftp.connect({
            host: config.teladoc.client.host,
            port: config.teladoc.client.port,
            username: config.teladoc.client.userName,
            password: config.teladoc.client.password            
        }).then(() => {
            const file = csvFilename.split('\\').slice(-1)[0]; 
            
            sftp.put(csvFilename, file);
        }).catch((err) => {
            uhx.log.error(`Error occurred while sending report to Teladoc: ${err}`);
            throw new exception.Exception('Error occurred while sending report to Teladoc', exception.ErrorCodes.COM_FAILURE);
        });
    }

    /**
     * @method
     * @summary Sends an email with the results of the file upload
     * @param {object} content The data for the email to be sent
     * @param {string} status The status of the file delivery to Teladoc
     */
    async sendEmail(content, status) {
        content.reportingCompany = "Teladoc";
        let template;

        if (status === "failed") {
            template = uhx.Config.mail.templates.reportingFailed;
        } else {
            template = uhx.Config.mail.templates.reportingSuccess;
        }

        return await uhx.Mailer.sendEmail({
            to: uhx.Config.mail.teladocReporterEmail,
            from: uhx.Config.mail.medicEmail,
            template: template,
            subject: content.reportingType + " reporting to Teladoc " + status + "."
        }, { content: content });
    }
}