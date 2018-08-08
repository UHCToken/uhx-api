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
    schedule = require('node-schedule'),
    subscriptionRepository = require('../repository/subscriptionRepository'),
    userRepository = require('../repository/userRepository'),
    uhx = require("../uhx");
    model = require('../model/model');
    config = require('../config');

module.exports = class Karis {

    constructor() {
        Number.prototype.pad = function(size) {
            const s = String(this);
            while (s.length < (size || 2)) {s = "0" + s;}
            return s;
        }

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
            const subscriptions = await subscriptionRepository.getSubscriptionsForDailyReport();

            if (!subscriptions) {
                // No subscriptions found
            } else {
                reports = [];

                for (let i = 0; i < subscriptions.length; i++) {
                    const subscription = subscriptions[i];
                    const user = await userRepository.get(subscription.userId);

                    reports.push(new model.Karis().fromData(user, subscription));
                }

                const now = new Date();
                const clientCode = config.karis.clientCode;
                const fileDateDisplay = (now.getMonth() + 1).pad() + now.getDate().pad() + now.getFullYear;
                const filename = clientCode + "_" + fileDateDisplay;

                this.sendKarisReport(reports, filename);
            }
        } catch(ex) {

        }
    }

    /**
     * @method
     * @summary Send a monthly census of current active members to Karis
     */
    async sendMonthlyCensus() {
        try {

            const subscriptions = await subscriptionRepository.getSubscriptionsForMonthlyReport();

            if (!subscriptions) {
                // No subscriptions found
            } else {
                reports = [];

                for (let i = 0; i < subscriptions.length; i++) {
                    const subscription = subscriptions[i];
                    const user = await userRepository.get(subscription.userId);

                    reports.push(new model.Karis().fromData(user, subscription));
                }

                const fileDateDisplay = (now.getMonth() + 1).pad() + now.getDate().pad() + now.getFullYear;
                const filename = "UNIVERSALHEALTHCOINCENSUS_" + fileDateDisplay;

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
        csvFilename = filename + ".csv";

    }
}
