// <Reference path="./model/model.js"/>
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

const uhx = require('../uhx'),
    exception = require('../exception'),
    subscriptionRepository = require('../repository/subscriptionRepository'),
    schedule = require('node-schedule')

/**
  * @class
  * @summary Represents the subscription billing logic of the UhX application
  */
module.exports = class BillingLogic {

    /**
     * @constructor
     * @summary Binds methods to "this"
     */
   constructor() {
     // Bind methods
     this.dailyBilling = this.dailyBilling.bind(this);

     // Schedule billing to be done daily at 9pm
     schedule.scheduleJob('0 19 * * *', () => {
       //this.dailyBilling();
     });

     // Schedule reporting to be done monthly on the first at 2am
     schedule.scheduleJob('0 2 1 * *', () => {
       //this.monthlyReport();
     });

     // TODO: Remove this test code
    this.dailyBilling();
   }

   /**
    * @method
    * @summary Bills all subscribers that renew their subscription today.
    */
   async dailyBilling() {
     try {
       console.log('Before SQL')
       const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsToBill();
       console.log('After SQL')
       if (!subscriptions) {
         // No subscriptions were found to be billed today
         // TODO: Throw exception
         console.log('No subscriptions found.');
       } else {
         console.log(subscriptions);
       }
     } catch(ex) {
       // TODO: Add error message
       console.log(ex)
     }
   }

   // Bill users that are paying today

   // Add billed users to table holding users that have paid this month
   // according to result of money transfer

   // Pull subscriptions that are being terminated

   // Terminate subscriptions that end today

   // Update subscriptions for people who have paid

   // Update terminated subscriptions
}
