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
    openpgp = require('openpgp'),
    moment = require('moment'),
    uhx = require("../uhx"),
    sftp = new Client(),
    fs = require('fs');

module.exports = class KarisService {

    constructor() {
        // this.sendDailyLog();

        // Starts a schedule to send daily logs to Karis every day at 9 pm
        schedule.scheduleJob('* * 21 * *', () => {
            // this.sendDailyLog();
        });

        // Starts a schedule to send a monthly census to Karis on the 1st of every month
        schedule.scheduleJob('0 0 1 * *', () => {
            // this.monthlyCensus();
        });
    }

    /**
     * @method
     * @summary Send a daily log of current active members to Karis
     */
    async sendDailyLog() {
        try {
            const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsForDailyReportToKaris();
            const reports = [];

            if (subscriptions) {
                for (let i = 0; i < subscriptions.length; i++) {
                    const patient = await uhx.Repositories.patientRepository.get(subscriptions[i].patientId);

                    reports.push(new model.Karis().fromData(patient, subscriptions[i]));
                }
            }

            const fileDateDisplay = moment().format('MMDDYYYY');
            const filename = "reports\\karis\\daily\\" + config.karis.clientCode + "_" + fileDateDisplay;

            this.sendKarisReport(reports, filename);
        } catch(ex) {
            uhx.log.error(`Could not send daily report to Karis: ${ex}`);
            throw new exception.Exception('Could not send daily report to Karis', exception.ErrorCodes.UNKNOWN);
        }
    }

    /**
     * @method
     * @summary Send a monthly census of current active members to Karis
     */
    async sendMonthlyCensus() {
        try {
            const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsForMonthlyReportToKaris();
            const reports = [];
            
            if (subscriptions) {
                for (let i = 0; i < subscriptions.length; i++) {
                    const subscription = subscriptions[i];
                    const user = await uhx.Repositories.userRepository.get(subscription.userId);

                    reports.push(new model.Karis().fromData(user, subscription));
                }
            }

            const fileDateDisplay = moment().format('MMDDYYYY');
            const filename = "reports\\karis\\monthly\\UNIVERSALHEALTHCOINCENSUS_" + fileDateDisplay;

            this.sendKarisReport(reports, filename);
        } catch(ex) {
            uhx.log.error(`Could not send monthly report to Karis: ${ex}`);
            throw new exception.Exception('Could not send monthly report to Karis', exception.ErrorCodes.UNKNOWN);
        }
    }

    /**
     * @method
     * @summary Sends the list of reports to Karis
     * @param {Karis} reports A collection of Karis reports to be sent
     * @param {string} filename The name of the file to be sent to Karis
     */
    sendKarisReport(reports, filename) {
        const csvFilename = filename + ".csv";
        const self = this;
        
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
            if (error) {
                uhx.log.error(`Error occurred while trying to create the csv file: ${error}`);
                throw new exception.Exception('Error occurred while trying to create the csv file', exception.ErrorCodes.ERR_FILE_CREATION);
            } else{
                self.sendFile(csvFilename);
            }
        });
    }

    /**
     * @method
     * @summary Encrypts the csv file and sends it to Karis sftp server 
     * @param {string} csvFilename The location and filename for the csv file to send
     */
    async sendFile(csvFilename) {
        this.encryptFile(csvFilename).then((encryptedFileData) => {
            const encryptedFileName = csvFilename + '.pgp';
            fs.writeFile(encryptedFileName, encryptedFileData, 'utf8', function (err) {
                if (error) {
                    uhx.log.error(`Error occurred while trying to create the encrypted PGP file: ${error}`);
                    throw new exception.Exception('Error occurred while trying to create the encrypted PGP file', exception.ErrorCodes.ERR_FILE_CREATION);
                } else{
                    sftp.connect({
                        host: config.karis.sftpClient.host,
                        port: config.karis.sftpClient.port,
                        username: config.karis.sftpClient.userName,
                        privateKey: fs.readFileSync(config.karis.sftpClient.privateKeyLocation)                
                    }).then(() => {
                        const file = csvFilename.split('\\').slice(-1)[0] + '.pgp';
                        
                        sftp.put(encryptedFileName, file);
                    }).catch((error) => {
                        uhx.log.error(`Error occurred while sending report to Karis: ${error}`);
                        throw new exception.Exception('Error occurred while sending report to Karis', exception.ErrorCodes.COM_FAILURE);
                    });
                }
            });
        });
    }

    /**
     * @method
     * @summary Encrypts a file with PGP encryption from the public key used by Karis
     * @param {string} fileName The location and filename for the file to encrypt
     */
    async encryptFile(fileName) {
        return new Promise(async (resolve, reject) => {
            const fileData = fs.readFileSync(fileName);

            const options = {
                message: openpgp.message.fromBinary(fileData),    
                publicKeys: (await openpgp.key.readArmored(config.karis.sftpClient.publicPgpKey)).keys
            }

            openpgp.encrypt(options).then(encryptedText => {                
                resolve(encryptedText.data);
            }).catch((error) => {
                uhx.log.error(`Error occurred while trying to encrypt the file: ${error}`);
                throw new exception.Exception('Error occurred while trying to encrypt the file', exception.ErrorCodes.ENCRYPTION_ERROR);
            }); 
        });
    }
}
