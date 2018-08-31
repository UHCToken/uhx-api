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
    openpgp = require('openpgp'),
    Json2csvParser = require('json2csv').Parser;

module.exports = class KarisService {

    constructor() {
        Number.prototype.pad = function(size) {
            let s = String(this);
            while (s.length < (size || 2)) {s = "0" + s;}
            return s;
        }

        this.sendDailyLog();

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
            if (err) {
                console.log('Some error occured - file either not saved or corrupted file saved.');
            } else{
                self.sendFile(csvFilename);
            }
        });
    }

    async sendFile(csvFilename) {
        this.encryptFile(csvFilename).then((encryptedFile) => {
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
        });
    }

    async encryptFile(fileName) {
        return new Promise(async (resolve, reject) => {
            const pubkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
            Version: BCPG C# v1.6.1.0
            
            mQENBFty1SoBCACswWoY2LU0HnZ1alt9OESMYbfqcrnDSODuojyOQZv6vUzUjxiq
            VdutryjKbMHsD/ETcbjlYNMBH205Uspv4w/hxVeyHz6jndEGdxqZY7CR3Ung0CbA
            C7RejiybXeVdv/xSevOVb1qZsY/wrQbG9mN2SyJD/Kb+0EsOCPR+KQKl+P3T9B/s
            cjAGc4NF0GrjY3a2sjHm5bIkcd9s9dASPzKdEUYX3uM6u30kMuUQBYFLWIPjGGL5
            jF3cLb4gQ0QExRM5EVxTBD4wvxFsJgKtxZYtywJP4tnRdNzfuG3Hq7/EuvEmcnnB
            tsH3LRVuT46mRKttin1++wZY+N1/xmT1eoHFABEBAAG0IGJyaWFuLnZhbm9vc3Rl
            bkBtb2hhd2tjb2xsZWdlLmNhiQEcBBABAgAGBQJbctUqAAoJEDJJtsOYB2uE8hkH
            /jsQr10vywx4LkM03RUmjnhCxrWzjw/skjXLSnYH3XwLRmoU5MU/9G29kNdovate
            if6ghp90HijoPxSiFCU/aPcKkotmwjf0MKs/S4q114DwF47NwORswzzg+4w2jxyx
            ffcgmtuvyGbvJ+knoBowuUlywcZiTivZVH2dfJxUA+NVDt2y5Sc7NTUeZo2eQ+Fy
            lNLZpDpXkVwT1KCv5gAhgDfUkg6Ha6cQ+tFFCq5/XhrO5iaRlcxn2UivrdUzlY/A
            UM8YOFG81iZWpKUz1f5xSgMB4cXIMcBOEJcgwicjNHyNI6LCOfTHb+PN3x6fFqqp
            xILvOMArkGrvwCgoYZqAUzE=
            =nx2W
            -----END PGP PUBLIC KEY BLOCK-----`;

            const privkey = `-----BEGIN PGP PRIVATE KEY BLOCK-----
            Version: BCPG C# v1.6.1.0
            
            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
            gu84wCuQau/AKChhmoBTMQ==
            =DPJy
            -----END PGP PRIVATE KEY BLOCK-----`;

            const passphrase = `mybootsarecalledbunnies`;

            const privKeyObj = (await openpgp.key.readArmored(privkey)).keys[0];
            privKeyObj.decrypt(passphrase);
            const fileText = require('fs').readFileSync(fileName);

            const options = {
                message: openpgp.message.fromText(fileText),    
                publicKeys: (await openpgp.key.readArmored(pubkey)).keys, 
                privateKeys: [privKeyObj]                             
            }
            
            openpgp.encrypt(options).then(ciphertext => {
                const encrypted = ciphertext.data
                
                resolve(encrypted);
            }).catch((error) => {
                console.log(error);
            });  
        });
    }
}
