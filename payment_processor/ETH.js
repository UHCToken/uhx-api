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
  * @return {number} The status to set the order at
  */
 async function(orderInfo, distributionAccount) {

    // Step 1. We want to ensure that the buyer has sufficient XLM
    var asset = await orderInfo.loadAsset();
    var buyer = await orderInfo.loadBuyer();
    var ethWallet = await uhc.Repositories.walletRepository.getTypeForUserByUserId(buyer.id, "ETHEREUM")

    var buyerEthWallet = await uhc.Web3Client.getBalance(ethWallet);
    
    var buyerStrWallet = await uhc.StellarClient.getAccount(await buyer.loadWallet());


    var sourceEthBalance = buyerEthWallet.balances.find(o=>o.code == orderInfo.invoicedAmount.code);

    var sourceStrBalance = buyerStrWallet.balances.find(o=>o.code == "XLM");
    if(!sourceEthBalance || parseFloat(sourceEthBalance.value) < parseFloat(orderInfo.invoicedAmount)) // Must carry min balance
    {
        orderInfo.memo = exception.ErrorCodes.INSUFFICIENT_FUNDS;
        return model.PurchaseState.REJECT;
    }

    if(!sourceStrBalance || sourceStrBalance.value < 1) // Must carry min balance
    {
        orderInfo.memo = exception.ErrorCodes.INSUFFICIENT_FUNDS;
        return model.PurchaseState.REJECT;
    }

    // We want to do a multipart transaction now ...
    try {
        // Does the buyer wallet trust our asset?
        if(!buyerStrWallet.balances.find(o=>o.code == asset.code))
            await uhc.StellarClient.createTrust(buyerStrWallet, asset);
        // TODO: If this needs to go to escrow this will need to be changed
        await uhc.Web3Client.createPayment(buyerEthWallet, uhc.Config.ethereum.distribution_wallet_address, orderInfo.invoicedAmount)
        await uhc.StellarClient.createPayment(distributionAccount, buyerStrWallet, {value: orderInfo.amount, code: asset.code})

        //orderInfo.ref = transaction.ref;
        //orderInfo.memo = transaction.id;
        orderInfo.transactionTime = new Date();
        return model.PurchaseState.COMPLETE;
    }
    catch(e) {
        uhc.log.error(`Error transacting with ethereum network: ${e.message}`);
        orderInfo.ref = e.code || exception.ErrorCodes.COM_FAILURE;
        orderInfo.transactionTime = new Date();
        return model.PurchaseState.REJECT;
    }

 }