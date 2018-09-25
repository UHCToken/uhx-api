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

const schedule = require('node-schedule'),
  model = require("../model/model"),
  config = require('../config'),
  moment = require('moment'),
  uhx = require('../uhx');

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

    this.dailyBilling();

    // Schedule billing to be done daily at 8pm
    schedule.scheduleJob('0 20 * * *', () => {
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

      if (subscriptions.length === 0) {
        // No subscriptions to be billed today
        uhx.log.info(`No Subscriptions Billed on ${moment().format('YYYY-MM-DD')}`);
      } else {
        // Call function to complete transactions
        uhx.log.info(`Attempting to Bill ${subscriptions.length} Accounts...`);
        await this.billUsers(subscriptions);
      }
    } catch (ex) {
      uhx.log.error(`Billing service error: ${ex.code} || ${ex.message}`);
      uhx.log.error(ex.stack);
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
      // Loop through subscription data, create transactions for each with sufficient funds
      for (let sub of subscriptions) {
        // Terminate a subscription that expires today and has auto renew turned off 
        if (!sub.autoRenew) {
          await this.terminateSubscription(sub);
        }

        const subscriberWallet = await uhx.Repositories.walletRepository.getByPatientAndNetworkId(sub.patientId, "1");

        if (!await uhx.StellarClient.isActive(subscriberWallet)) {
          // The user does not have an active wallet and will therefore have no funds to subscribe
          await this.terminateSubscription(sub);
          continue;
        }

        const subscriberStellarAccount = await uhx.StellarClient.getAccount(subscriberWallet);
        const assetBalance = subscriberStellarAccount.balances.find((o) => o.code == sub.currency);

        if (!assetBalance || assetBalance.value < sub.price) {
          await this.terminateSubscription(sub);
          continue;
        }

        if (!this.doesUserHaveEnoughXLMForTransaction(subscriberStellarAccount)) {
          throw new exception.Exception("Not enough assets to fulfill this funding", exception.ErrorCodes.INSUFFICIENT_FUNDS);
        }

        const principal = {
          grant: "internal",
          session: {
            userId: config.subscription.paymentAccount
          }
        };

        let transaction = {
          "type": "1",
          "payeeId": config.subscription.paymentAccount,
          "payorId": sub.userId,
          "amount": {
            "value": sub.price,
            "code": sub.currency,
          },
          "state": "1",
          "memo": "Subscription Payment"
        };

        transaction = new model.Transaction().copy(transaction);

        const stellarTransaction = (await uhx.TokenLogic.createTransaction([transaction], principal))[0];

        // Save status of payment
        if (parseInt(stellarTransaction.state) === model.TransactionStatus.Complete) {
          sub.status = 'complete';
        }
        else {
          sub.status = 'failed';
        }

        await this.subscriptionBilled(sub);

        // Update transactions
        await uhx.Repositories.transactionRepository.update(stellarTransaction, { session: { userId: config.subscription.paymentAccount } });
      }

      return;
    } catch (ex) {
      uhx.log.error(`Error billing subscriptions: ${ex}`);
    }
  }

  async doesUserHaveEnoughXLMForTransaction(stellarAccount) {
    const minStellarBalance = (stellarAccount.balances.length * 0.5) + 0.0001;
    const payorStellarBalance = stellarAccount.balances.find(o => o.code == "XLM").value;

    if ((payorStellarBalance - 0.0001) < minStellarBalance) {
      return false;
    }

    return true;
  }

  async terminateSubscription(subscription) {
    await uhx.Repositories.subscriptionRepository.terminateSubscription(subscription);
  }

  async subscriptionBilled(subscription) {
    await uhx.Repositories.subscriptionRepository.updateBilledSubscription(subscription);

    uhx.log.info('Updating next payment dates for billed subscriptions...')
  }
}
