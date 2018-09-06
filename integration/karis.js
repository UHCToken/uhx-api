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
                console.log('An error occurred while trying to create the csv file.');
            } else{
                self.sendFile(csvFilename);
            }
        });
    }

    async sendFile(csvFilename) {
        this.encryptFile(csvFilename).then((encryptedFileData) => {
            const encryptedFileName = csvFilename + '.pgp';
            fs.writeFile(encryptedFileName, encryptedFileData, 'utf8', function (err) {
                if (err) {
                    console.log('Some error occured - file either not saved or corrupted file saved.');
                } else{
                    sftp.connect({
                        host: config.karis.sftpClient.host,
                        port: config.karis.sftpClient.port,
                        username: config.karis.sftpClient.userName,
                        privateKey: require('fs').readFileSync(config.karis.sftpClient.privateKeyLocation)                
                    }).then(() => {
                        const file = csvFilename.split('\\').slice(-1)[0] + '.pgp';
                        
                        sftp.put(encryptedFileName, file);
                    }).catch((err) => {
                        console.log(err, 'catch error');
                    });
                }
            });
        });
    }

    async encryptFile(fileName) {
        return new Promise(async (resolve, reject) => {
            const pubkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
            Version: GnuPG/MacGPG2 v2
            Comment: GPGTools - https://gpgtools.org
            
            mQENBFJ6t5MBCACl4jJwHdBSZPvJX8M+qsGreY1a8tpM0v6cB54WWIL/+ePnBxra
            F/AAkNub700I/Z27OHYgtcDKavCVEKNcmBnd/6r9nUoapdx7LBmRJqiS+quFa2c8
            aaEW/p88NET0S0jqoPEIYNM63nU0KUdkIGugrsEg92mlq7MHZLE/uhnFjqF9aBI7
            CVrmjnIXvmZ502XjqHMTR/PN/BlGY80jMPCKchFoNZTRNphn/d6qfUhhzamM78H3
            eQ0EEtUv9LsKDscfvm76iNGtOEndv8RiL09scHO6axxxdJUNE2DV7ZG6O8eccNNC
            J1/qoZXyJqIsr/MMZ0zoKMxGe195/fo9OoR5ABEBAAG0JkRhdGEgYXQgS2FyaXMg
            PGRhdGFAdGhla2FyaXNncm91cC5jb20+iQE3BBMBCgAhBQJSereTAhsvBQsJCAcD
            BRUKCQgLBRYCAwEAAh4BAheAAAoJEJYAfuEQGjutn1EH/jJQr+3Qs3WtB3YCDx1T
            zRvZ1niTJqJXEGjczXYWAb2zS2cF0GXkJna1204PMZeNq4XE4g1rqhqqrQOKzW/S
            pEXhP2v37Jehs3wBJiSr9RpiQLsz3U9TLScLMCTWvamc44XJVBO1JbBDBmKtY7NN
            ofzsiWHHCC/TARmSvfLlJWAoHl8LKMewzEG1xXCZ8JnOCaHFrUmGVNzTxlEvYfba
            sAeoDpnMty1o/Y1mb2YMK5XDRh7mDHi3zc2ZNkOqRR3HHplsyMuHmxTXTZHEMcfO
            7te+Yn9c/IxxwuDHmpaJH2hESJoppmiracuSEWT2ORCRCQpdIlhvqTvaNgBFnzue
            kmmJASAEEAEKAAoFAlJ9LiEDBQR4AAoJENQBpPqlYVLkBD0H/2IFcqKUjKKYtEwN
            hKvWb1STOwSVtZ66F6WTxYjvresX5sKFGMB82olzuR+ON9Ws1uuwP8FMuDND6cK3
            U3Pcjqw7PzShcuYUmReiGaCdLjtdOcYDQ1dM10TRyBI5C28DiKKBkOyL7tXJBqGt
            m3w0Vf4fAPhnBQuoG+XBuD3zGuAlAjXiBM64vXhYE9HDfn6psaiehU5tMvp+Wvvq
            J5SX9n4OPU5LvQRthXs9OLZykeeDaMRAolW6etEuFax9jI2YoXEIlczbcYf3qqf8
            L9OMs5e4abmrXJJSUqeFCLKrR6Q2xaKo9fzaKCVRocJ3ObFlhWxOwiXgLRelG5jK
            +PB+1D65AQ0EUnq3kwEIALPQIuYG8OQ/wGW0yYYW4Lt5/VjGYcjCwYffgHrNouhQ
            VQtCz4G+dpGk/CmDZqKDvmt3NsGZYMPoo1Yi28BRe4L5D2Lv08iH3zas5LSzhjJv
            fDmD/iGTtpqqZunxzRlJRnot7Ha9/1jgd78rc2WY15ClcmZuqz+lwwe466G1lYC2
            1TC6WGpmJ0Q5wQZNOdpqUaX7GJgTVePbPZduVM03TC/g98MZiuhxTo4MmJ1E2Ed8
            G0DOgIsS6KcSIYoUNnHtVfKTL3YVvohLIy9ufPlQ+LMes67Y0Ur9kdA6/kEU/Y4u
            g5zctI3vH8MrhSALk+RRG+c+iwcOPQ7qj3UtXbScZw0AEQEAAYkCPgQYAQoACQUC
            Unq3kwIbLgEpCRCWAH7hEBo7rcBdIAQZAQoABgUCUnq3kwAKCRDnY9wBqNoJYbKe
            B/9igw8FPrpBz7Oo/aKjQ9djCCRQOOvgb1lyG0sKyz672tmLiVZMFayxhGji/F59
            P9oOA+UVTeLmeCpzPNNnGpW4JNnqDLAbJ46iigg3AfTB3L/sN+2zonAJJISlRyDC
            uII5tT95bGql0XYJjbwgIjKQkRGaVlLIl85obVIc+C30ygVk0x+O0/khkQLnlyki
            RjDrfBkoqpwmGBLpbIpwtS+iywmCk8E2ZwWfTBz1wQpaFj/hSPSD6SvX+iOY3vjd
            ebhsr8uy03bRIHDF6jbondP7rKHeL9Q4FrXP23ltCI650lZ0wwnfgOU30O473qvd
            zx/0wvrOad7TpAameeHkMiiwZ30H/jf1RlTrcFY2uq4jlnEsX8lPpNC9Y8hGIh0u
            5DPi34DYuHaiTjjjgrHVn/Gm3VGnfxHS/huDNIYqFfnZBpjvzSSQ2D3He1b+hcQm
            +dQ4vv3rStsFHaky2Ao0hMQ8MPdYIJaAiq2YTXx9MXVw2weYdpZv9QPTNYPUyV65
            9qpbFOALJPc+EX2hNZlJn+kYHQeomTiQlgVDWfkVB2QeRzmr34upAt4jj3YguoMh
            aY2SW85vs1III7pNGZL/ayTD6EyAewJW3JDNODCUjz5cgbeR0zVwOxZq5QprNA3b
            XiEZbusCBLKKLGCSqjZVh+wcBilRBTYO5pEnFVAC9wPyuhqalXI=
            =8D3G
            -----END PGP PUBLIC KEY BLOCK-----`;

            const fileData = fs.readFileSync(fileName);

            const options = {
                message: openpgp.message.fromBinary(fileData),    
                publicKeys: (await openpgp.key.readArmored(pubkey)).keys
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
