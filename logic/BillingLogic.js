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
    schedule = require('node-schedule'),
    moment = require('moment'),
    Transaction = require('../model/Transaction'),
    MonetaryAmount = require('../model/MonetaryAmount'),
    uuidv4 = require('uuid/v4'),
    model = require("../model/model");

/**
  * @class
  * @summary Represents the subscription billing logic of the UhX application
  */
module.exports = class BillingLogic {

    /**
     * @constructor
     * @summary Binds methods to "this", schedules subscription payments and reports
     */
   constructor() {
     // Bind methods
     this.dailyBilling = this.dailyBilling.bind(this);
     this.billUsers = this.billUsers.bind(this);

     // Schedule billing to be done daily at 9pm
     schedule.scheduleJob('0 21 * * *', () => {
       this.dailyBilling();
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
       uhx.log.info(`Billing Subscriptions...`);
       const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsToBill();

       if (subscriptions.length === 0) {
         // No subscriptions to be billed today
         uhx.log.info(`No Subscriptions Billed on ${moment().format('YYYY-MM-DD')}`);
       } else {
         // Call function to complete transactions
         uhx.log.info(`Attempting to Bill ${subscriptions.length} Accounts...`);
         const billedSubscriptions = await this.billUsers(subscriptions);

         // Prepare update query for next payment dates
         let updateValues = '';
         let insertValues = '';

         for (let i = 0; i < billedSubscriptions.length; i++) {
             insertValues = insertValues + `, ('${billedSubscriptions[i].id}',
                                               '${billedSubscriptions[i].offeringId}',
                                               '${billedSubscriptions[i].patientId}',
                                               '${billedSubscriptions[i].dateNextPayment}',
                                               '${billedSubscriptions[i].price}',
                                               '${billedSubscriptions[i].currency}')`;

             // Update next payment date
             billedSubscriptions[i].dateNextPayment = moment(billedSubscriptions[i].dateNextPayment, 'YYYY-MM-DD')
                          .add(billedSubscriptions[i].periodInMonths, 'months').format('YYYY-MM-DD');

            // Update date terminated
            billedSubscriptions[i].dateTerminated = moment(billedSubscriptions[i].dateTerminated, 'YYYY-MM-DD')
                          .add(billedSubscriptions[i].periodInMonths, 'months').format('YYYY-MM-DD');

             updateValues = updateValues + `, ('${billedSubscriptions[i].id}',
                                               '${billedSubscriptions[i].offeringId}',
                                               '${billedSubscriptions[i].patientId}',
                                               '${billedSubscriptions[i].dateNextPayment}',
                                               '${billedSubscriptions[i].dateTerminated}')`;
         }

         // Remove leading commas in query
         updateValues = updateValues.substring(2);
         insertValues = insertValues.substring(2);

         // Update next billing dates for succesfully billed users
         if (billedSubscriptions.length >= 1) {
            uhx.log.info('Updating next payment dates for billed subscriptions...')
            await uhx.Repositories.subscriptionRepository.updateBilledSubscriptions(updateValues, insertValues);
         }
       }
     } catch(ex) {
       // TODO: Add error message
       console.log(ex)
     }
   }

   /**
    * @method
    * @summary Transfers currency from users accounts to subscription wallet using a queue
    * @param {[Subscription]} subscriptions Array of subscriptions to be billed
    * @returns {[Subscription], [Subscription]} Array of succesful billings, array of failed billngs
    */
   async billUsers(subscriptions) {
     try {
       // Generate batch ID and transaction array
       let transactions = [];
       let billedSubscriptions = [];
       const batchId = uuidv4();

       // Loop through subscription data, create transactions for each with sufficient funds
       for (let i = 0; i < subscriptions.length; i++) {
          let t = subscriptions[i];
          let newTransaction = new Transaction(uuidv4(), model.TransactionType.Payment, `Payment-subscription: ${subscriptions[i].id}`, new Date(), null, null, new MonetaryAmount(t.price, t.currency), null, null, model.TransactionStatus.Pending);

          // TODO: Move subscription payee ID to configuration
          newTransaction.payorId = t.userId;
          newTransaction.payeeId = '56d4327a-4b58-4d3d-b518-7fda456cc1b0';
          newTransaction.batchId = batchId;
          newTransaction.id = uuidv4();

          // Load user information
          newTransaction.loadPayor();
          await newTransaction.loadPayee();
          
          // Load wallet information
          let payorWallet = await newTransaction.loadPayorWallet();
          await newTransaction.loadPayeeWallet();

          // Check if users have enough funds before executing transactions
          let payorStellarAccount = await uhx.StellarClient.server.loadAccount(payorWallet.address);
          let minStellarBalance = payorStellarAccount.balances.length * 0.5 + 1.0001;

          let payorStellarBalance = payorStellarAccount.balances.find(o=>o.asset_type == "native").balance;
          if (subscriptions[i].currency == 'XLM')
              subscriptions[i].currency = 'native';
          let payorPurchasingBalance = payorStellarAccount.balances.find(o=>o.asset_type == subscriptions[i].currency).balance;

          if ((payorStellarBalance - 0.0001) < minStellarBalance)
              uhx.log.info(`Subscription payment cannot be completed. Patient ${subscriptions[i].patientId} has insufficient XLM.`);

              // TODO: Add to database of failed transactions
          else if ((payorPurchasingBalance - subscriptions[i].price) < 0)
              uhx.log.info(`Subscription payment cannot be completed. Patient ${subscriptions[i].patientId} has insufficent ${(subscriptions[i].currency == 'native' ? 'XLM' : subscriptions[i].currency)}`);

              // TODO: Add to database of failed transactions
          else {
              // User has enough XLM and payment currency, push the transaction object 
              transactions.push(newTransaction);
              billedSubscriptions.push(subscriptions[i]);
          }
       }

       for(let i in transactions) {
              // Insert transactions
              const payeeId = transactions[i].payeeId;
              await uhx.Repositories.transactionRepository.insert(transactions[i], {session: {userId: payeeId}});
              // Execute transactions
              await uhx.StellarClient.execute(transactions[i]);
              // Update transactions
              await uhx.Repositories.transactionRepository.update(transactions[i], {session: {userId: payeeId}});
       }

       return billedSubscriptions;
     } catch (ex) {
       uhx.log.error(`Problem billing subscriptions: ${ex}`);
       uhx.log.error(`Subscriptions to be billed: ${subscriptions}`);
       uhx.log.error(`Subscriptions that were billed: ${billedSubscriptions}`);
     }
   }
}
