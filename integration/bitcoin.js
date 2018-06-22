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

 const Bitcoin = require('bitcoinjs-lib'),
    uhx = require("../uhx"),
    axios = require("axios"),
    model = require("../model/model"),
    Asset = require('../model/Asset'),
    Wallet = require("../model/Wallet"),
    exception = require('../exception'),
    Transaction = require('../model/Transaction'),
    MonetaryAmount = require('../model/MonetaryAmount');
/**
 * @class
 * @summary Represents a bitcoin network exception
 */
class BitcoinException extends exception.Exception {

    /**
     * @constructor
     * @summary Creates a new error from the bitcoin network
     * @param {*} bitcoinErr The RAW error from the ethereum server
     */
    constructor(bitcoinErr) {
        super("Error interacting with Bitcoin network", exception.ErrorCodes.COM_FAILURE, bitcoinErr);
    }

}

/**
 * @class
 * @summary Provides a wrapper around the bitcoin client
 */
module.exports = class BitcoinClient {

    /**
     * @constructor
     * @summary Creates a new bitcoin client with the specified base API
     * @param {string} provider The provider endpoint to use
     */
    constructor(testnetUse, endpoint) {
        // "private" members
        if(testnetUse){
            this._server = Bitcoin.networks.testnet;
        }
        else{
            this._server = Bitcoin.networks.bitcoin;
        }
    }

    /**
     * @property
     * @summary Gets the bitcoin server instance
     * @type {Web3}
     */
    get server() { return this._server; }
    
    /**
     * @method
     * @summary Generates a random keypair for an account
     * @returns {Wallet} The generated wallet object containing the account
     */
    async generateAccount(id) {
            var wallet = new Wallet().copy({
                network: "BITCOIN",
                networkId: 3,
                userId: id 
            });
        try{
            var newWallet = await axios.post(uhx.Config.bitcoin.server + '/address/:' + id);
            wallet.address = newWallet.data;
            wallet.seed = newWallet.data;
            return(wallet);
        }
        catch(e) {
            console.error(`Account generation has failed : ${JSON.stringify(e)}`);
            throw new BitcoinException(e);
        }
    }

        /**
     * @method
     * @summary Gets account information from blockcypher
     * @param {Wallet} userWallet The user wallet from which account information should be retrieved
     * @returns {Wallet} The wallet with account information
     * @description This operation will fetch the account data, returning the updated wallet information
     */
    async getBalance(wallet) {
        
        try {
            var balance = await axios.get(uhx.Config.bitcoin.server + '/:' + wallet.userId +'/balance');
            wallet.balances = [];
            wallet.balances.push(new model.MonetaryAmount(
                balance.data,
                "BTC"
            ));
            
            return(wallet)
        }
        catch(e) {
            console.error(`Failed to get account balance : ${JSON.stringify(e)}`);
            throw new BitcoinException(e);
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