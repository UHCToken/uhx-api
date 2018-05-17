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
 const Wallet = require("../model/Wallet"),
    Purchase = require("../model/Purchase"),
    MonetaryAmount = require("../model/MonetaryAmount"),
    Transaction = require("../model/Transaction"),
    crypto = require("crypto"),
    exception = require("../exception"),
    model = require("../model/model"),
    uhc = require("../uhc");

 module.exports = 
  /**
  * @method
  * @summary Processes a payment on Stellar
  * @param {Purchase} orderInfo The order information
  * @param {Wallet} distributionAccount The Stellar account where asset should be withdrawn from
  * @param {Array} linkedTxns The additional transactions to be persisted
  * @return {number} The status to set the order at
  */
 async function(orderInfo, distributionAccount, linkedTxns) {

    // Step 1. We want to ensure that the buyer has sufficient XLM
    var asset = await orderInfo.loadAsset();
    var buyer = await orderInfo.loadBuyer();
    var buyerWallet = await uhc.StellarClient.getAccount(await buyer.loadWallet());
    var sourceBalance = buyerWallet.balances.find(o=>o.code == orderInfo.invoicedAmount.code);
    if(!sourceBalance || sourceBalance.value < Number(orderInfo.invoicedAmount.value) + (1 + (buyerWallet.balances.length) * 0.5)) // Must carry min balance
    {
        orderInfo.memo = exception.ErrorCodes.INSUFFICIENT_FUNDS;
        return model.PurchaseState.REJECT;
    }

    // We want to do a multipart transaction now ...
    try {
        // Does the buyer wallet trust our asset?
        if(!buyerWallet.balances.find(o=>o.code == asset.code))
            await uhc.StellarClient.createTrust(buyerWallet, asset);
        // TODO: If this needs to go to escrow this will need to be changed
        var transaction = await uhc.StellarClient.exchangeAsset(buyerWallet, distributionAccount, orderInfo.invoicedAmount, new MonetaryAmount(orderInfo.quantity, asset.code), orderInfo.batchId);

        orderInfo.ref = transaction.ref;
        orderInfo.memo = transaction.id;
        orderInfo.transactionTime = new Date();

        // Now record the payment to DIST for our own copy of records
        transaction.type = model.TransactionType.Payment;
        transaction._payeeWalletId = distributionAccount.id;
        transaction._payorWalletId = buyer.walletId;
        transaction.batchId = orderInfo.batchId;
        transaction.memo = transaction.id; // Ledger identifier
        transaction.transactionTime = new Date();
        transaction.amount = orderInfo.invoicedAmount;
        delete(transaction.id);
        linkedTxns.push(transaction);

        return model.PurchaseState.COMPLETE;
    }
    catch(e) {
        uhc.log.error(`Error transacting with Stellar network: ${e.message}`);
        orderInfo.ref = e.code || exception.ErrorCodes.COM_FAILURE;
        orderInfo.transactionTime = new Date();
        return model.PurchaseState.REJECT;
    }

 }