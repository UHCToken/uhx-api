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

 const Web3 = require('web3'),
    Web3Net = require('web3-net'),
    uhx = require("../uhx"),
    model = require("../model/model"),
    Asset = require('../model/Asset'),
    Wallet = require("../model/Wallet"),
    exception = require('../exception'),
    Transaction = require('../model/Transaction'),
    EthereumTx = require('ethereumjs-tx'),
    MonetaryAmount = require('../model/MonetaryAmount');
/**
 * @class
 * @summary Represents a ethereum network exception
 */
class EthereumException extends exception.Exception {

    /**
     * @constructor
     * @summary Creates a new error from the ethereum network
     * @param {*} ethereumErr The RAW error from the ethereum server
     */
    constructor(ethereumErr) {
        super("Error interacting with Ethereum network", exception.ErrorCodes.COM_FAILURE, ethereumErr);
    }

}

/**
 * @class
 * @summary Provides a wrapper around the stellar client
 */
module.exports = class WebClient {

    /**
     * @constructor
     * @summary Creates a new ethereum client with the specified base API
     * @param {string} provider The provider endpoint to use
     */
    constructor(provider, net_provider) {
        // "private" members
        this._server = new Web3(new Web3.providers.HttpProvider(provider));
        this._net = new Web3Net(net_provider);
    }

    /**
     * @property
     * @summary Gets the ethereum server instance
     * @type {Web3}
     */
    get server() { return this._server; }
    
    /**
     * @property
     * @summary Gets the ethereum net instance
     * @type {Web3Net}
     */
    get net() { return this._net; }

    /**
     * @method
     * @summary Generates a random keypair for an account
     * @returns {Wallet} The generated wallet object containing the account
     */
    async generateAccount() {
        try {
            var ethWallet = await this.server.eth.accounts.create();
            return new Wallet().copy({
                address: ethWallet.address,
                seed: ethWallet.privateKey,
                network: "ETHEREUM",
                networkId: 2
            });
        }
        catch(e) {
            console.error(`Account generation has failed : ${JSON.stringify(e)}`);
            throw new EthereumException(e);
        }
    }

    /**
     * @method
     * @summary Gets account information from stellar
     * @param {Wallet} userWallet The user wallet from which account information should be retrieved
     * @returns {Wallet} The wallet with account information
     * @description This operation will fetch the account data, returning the updated wallet information
     */
    async getAccounts() {
        var version = this.server.eth.Eth.getAccounts(console.log);
        console.log(this.net)
        this.server.eth.net.isListening().then(console.log);
        this.server.eth.getAccounts(function(err, res){ console.log(res); });
    }

        /**
     * @method
     * @summary Gets account information from stellar
     * @param {Wallet} userWallet The user wallet from which account information should be retrieved
     * @returns {Wallet} The wallet with account information
     * @description This operation will fetch the account data, returning the updated wallet information
     */
    async getBalance(wallet) {
        
        try {
            var balance = await this.server.eth.getBalance(wallet.address)
            wallet.balances = [];

            wallet.balances.push(new model.MonetaryAmount(
                this.server.utils.fromWei(balance, "ether"),
                "ETH"
            ));
            
            return(wallet)
        }
        catch(e) {
            console.error(`Failed to get account balance : ${JSON.stringify(e)}`);
            throw new EthereumException(e);
        }
    }

    async createPayment(buyerEthWallet, ethDistributionAccount, amount) {
        
        try {
            var gasPrice = await this.server.eth.getGasPrice();
            var gasLimit = await this.server.eth.getBlock("latest").gasLimit;
            var nonce = await this.server.eth.getTransactionCount(buyerEthWallet.address)
            var rawTx = {
                nonce: this.server.utils.toHex(nonce),
                gasPrice: this.server.utils.toHex(gasPrice), 
                gasLimit:  this.server.utils.toHex('21000'),
                from: buyerEthWallet.address, 
                to: ethDistributionAccount, 
                value: this.server.utils.toHex(this.server.utils.toWei(amount.value, "ether"))
            }

            var tx = new EthereumTx(rawTx)
            var pk = Buffer.from(buyerEthWallet.seed.substring(2), 'hex')
            tx.sign(pk)

            var serializedTx = tx.serialize();

            var hash = await this.server.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))

            return(hash)
        }
        catch(e) {
            console.error(`Failed to send ether payment : ${JSON.stringify(e)}`);
            throw new EthereumException(e);
        }
    }

}