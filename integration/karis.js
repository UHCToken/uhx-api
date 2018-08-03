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
    uhx = require("../uhx");

module.exports = class Karis {

    constructor() {
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


        } catch(ex) {

        }
    }

    /**
     * @method
     * @summary Send a monthly census of current active members to Karis
     */
    async sendMonthlyCensus() {
        try {


        } catch(ex) {

        }
    }
}
