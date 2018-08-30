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
    model = require("../model/model"),
    config = require('../config');

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
   }

   /**
    * @method
    * @summary Bills all subscribers that have auto renew enabled, and are set to be billed today.
    */
   async dailyBilling() {
     try {
       uhx.log.info(`Billing Subscriptions...`);
       const subscriptions = await uhx.Repositories.subscriptionRepository.getSubscriptionsToBill();
       const todaysDate = moment().format('YYYY-MM-DD');
       let subscriptionsToTerminate;

       if (subscriptions.length === 0) {
         // No subscriptions to be billed today
         uhx.log.info(`No Subscriptions Billed on ${todaysDate}`);
       } else {
         // Call function to complete transactions
         uhx.log.info(`Attempting to Bill ${subscriptions.length} Accounts...`);
         const billingResults = await this.billUsers(subscriptions);
         const billedSubscriptions = billingResults.billedSubscriptions;
         subscriptionsToTerminate = billingResults.subscriptionsToTerminate;

         // Prepare update query for next payment dates
         let updateValues = '';
         let insertValues = '';

         for (let i = 0; i < billedSubscriptions.length; i++) {
             insertValues = insertValues + `, ('${billedSubscriptions[i].id}',
                                               '${billedSubscriptions[i].offeringId}',
                                               '${billedSubscriptions[i].patientId}',
                                               '${billedSubscriptions[i].dateNextPayment}',
                                               '${billedSubscriptions[i].price}',
                                               '${billedSubscriptions[i].currency}',
                                               '${billedSubscriptions[i].status}')`;

             // Update next payment date
             billedSubscriptions[i].dateNextPayment = moment(billedSubscriptions[i].dateNextPayment, 'YYYY-MM-DD')
                          .add(billedSubscriptions[i].periodInMonths, 'months').format('YYYY-MM-DD');

            // Update date terminated
            billedSubscriptions[i].dateExpired = moment(billedSubscriptions[i].dateExpired, 'YYYY-MM-DD')
                          .add(billedSubscriptions[i].periodInMonths, 'months').format('YYYY-MM-DD');

             updateValues = updateValues + `, ('${billedSubscriptions[i].id}',
                                               '${billedSubscriptions[i].offeringId}',
                                               '${billedSubscriptions[i].patientId}',
                                               '${billedSubscriptions[i].dateNextPayment}',
                                               '${billedSubscriptions[i].dateExpired}')`;
         }

         // Remove leading commas in query
         updateValues = updateValues.substring(2);
         insertValues = insertValues.substring(2);

         // Update next billing dates for succesfully billed users
         if (billedSubscriptions.length >= 1) {
            uhx.log.info('Updating next payment dates for billed subscriptions...')
            uhx.Repositories.subscriptionRepository.updateBilledSubscriptions(updateValues, insertValues);
         }
       }

       uhx.log.info('Terminating subscriptions that expire today...');
       uhx.Repositories.subscriptionRepository.terminateSubscriptions(todaysDate, subscriptionsToTerminate);

     } catch(ex) {
       uhx.log.error(`Billing service error: ${ex.code} || ${ex.message}`);
       uhx.log.error(e.stack);
     }
   }

   /**
    * @method
    * @summary Transfers currency from users accounts to subscription wallet
    * @param {[Subscription]} subscriptions Array of subscriptions to be billed
    * @returns {[Subscription], [Subscription]} Array of billings, array of subscriptions to terminate because of failed payment
    */
   async billUsers(subscriptions) {
     try {
       // Generate batch ID and transaction array
       let transactions = [];
       let billedSubscriptions = [];
       let toppedUpPayors = [];
       let subscriptionsToTerminate = [];
       const batchId = uuidv4();

       // Loop through subscription data, create transactions for each with sufficient funds
       for (let i = 0; i < subscriptions.length; i++) {
          let t = subscriptions[i];
          let newTransaction = new Transaction(null, model.TransactionType.Payment, `Payment-subscription: ${subscriptions[i].id}`, new Date(), null, null, new MonetaryAmount(t.price, t.currency), null, null, model.TransactionStatus.Pending);

          newTransaction.payorId = t.userId;
          newTransaction.payeeId = config.subscription.paymentAccount;
          newTransaction.batchId = batchId;
          newTransaction.id = uuidv4();

          // Load user information
          await newTransaction.loadPayor();
          await newTransaction.loadPayee();
          
          // Load wallet information
          let payorWallet = await newTransaction.loadPayorWallet();
          let payeeWallet = await newTransaction.loadPayeeWallet();

          // Load user account and balances
          let payorStellarAccount = await uhx.StellarClient.server.loadAccount(payorWallet.address);
          let minStellarBalance = payorStellarAccount.balances.length * 0.5 + 1.1;
          let payorStellarBalance = payorStellarAccount.balances.find(o=>o.asset_type == "native").balance;

          // Amount in purchasing currency
          subscriptions[i].currency = subscriptions[i].currency == 'XLM' ? 'native' : subscriptions[i].currency
          let payorPurchasingBalance = payorStellarAccount.balances.find(o=>o.asset_code == subscriptions[i].currency).balance;

          // If user does not have enough XLM, top up funds for transactions
          // Does not top up the same user more than once per run through
          if (((payorStellarBalance - 0.0001) < minStellarBalance) && (toppedUpPayors.indexOf(newTransaction.payorId) > -1)) {
              uhx.log.info(`Patient ${subscriptions[i].patientId} has insufficient XLM to complete subscription transaction, topping up their XLM.`);
              let topUpValue = minStellarBalance - payorStellarBalance;

              // Create top up transaction
              let topUpTransaction = new Transaction(null, model.TransactionType.Deposit, 'Top-up account', new Date(), null, null, new MonetaryAmount(topUpValue, 'XLM'), new MonetaryAmount(0.0000100, 'XLM'), null, model.TransactionStatus.Pending);
              
              // Set payee and payor for top up
              topUpTransaction.payorId = config.subscription.topUpAccount;
              topUpTransaction.payeeId = newTransaction.payorId;
              topUpTransaction._payeeWallet = payorWallet;
              topUpTransaction._payorWallet = payeeWallet;
              
              // Keep track of which wallets are already being topped up, add the top up transaction
              toppedUpPayors.push(newTransaction.payorId);
              transactions.push(topUpTransaction);
          }
          else if ((payorPurchasingBalance - subscriptions[i].price) < 0) {
              // Check if patient can afford the payment
              uhx.log.info(`Subscription payment cannot be completed. Patient ${subscriptions[i].patientId} has insufficent ${(subscriptions[i].currency == 'native' ? 'XLM' : subscriptions[i].currency)}`);

              // Terminate subscription of user since they cannot pay for subscription
              subscriptionsToTerminate.push(`'${subscriptions[i].id}'`);
          }
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
              const transaction = await uhx.StellarClient.execute(transactions[i]);

              // Save status of payment
              if (transaction.state === model.TransactionStatus.Complete)
                  billedSubscriptions[i].status = 'complete';
              else
                  billedSubscriptions[i].status = 'failed';

              // Update transactions
              await uhx.Repositories.transactionRepository.update(transactions[i], {session: {userId: payeeId}});
       }

       return {
         billedSubscriptions: billedSubscriptions,
         subscriptionsToTerminate: subscriptionsToTerminate
       };
     } catch (ex) {
       uhx.log.error(`Error billing subscriptions: ${ex}`);
     }
   }
}
