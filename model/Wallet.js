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

const ModelBase = require('./ModelBase'),
    User = require('./User'),
    MonetaryAmount = require('./MonetaryAmount'),
    uhc = require('../uhc');

/**
 * @class
 * @summary Represents a wallet in the UHC data store
 * @swagger
 * definitions:
 *  Wallet:
 *      properties:
 *          address:
 *              type: string
 *              description: The public address of the stellar account this UHC wallet represents
 *          id:
 *              type: string
 *              description: The unique identifier for the wallet in the UHC user database
 *          balances:
 *              $ref: "#/definitions/MonetaryAmount"
 *              description: The balance of assets held within the account
 *          transactions:
 *              $ref: "#/definitions/Transaction"
 *              description: The transactions that have been executed on the specified wallet
 */
module.exports = class Wallet extends ModelBase {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
        this.copy = this.copy.bind(this);
        this.balances = [];
        this.transactions = [];
    }

    /**
     * @method
     * @summary Get the balance of the particular code
     * @param {string} code The monetary amount code to use
     * @returns {MonetaryAmount} The balance of the specified asset or null if not trusted
     */
    getBalanceOf(code) {
        return this.balances.find( (m) => m.code == code );
    }
    /**
     * @method
     * @summary Loads the user associated with this wallet
     * @type {User}
     */
    async loadUser() {
        if(!this._user)
            this._user = await uhc.Repositories.userRepository.getByWalletId(this.id);
        return this._user;
    }

    /**
     * @method
     * @summary Parses the specified dbWallet into a Wallet instance
     * @param {*} dbWallet The wallet instance as represented in the database
     * @return {Wallet} The updated wallet instance
     */
    fromData(dbWallet) {
        this.address = dbWallet.address;
        this.seed = dbWallet.seed;
        this.id = dbWallet.id;
        return this;
    }

    /**
     * @method
     * @summary Converts this wallet into a data model wallet
     */
    toData() {
        return {
            address : this.address,
            seed : this.seed,
            id : this.id
        };
    }

    /**
     * @method
     * @summary Copies data from otherWallet into this wallet
     * @param {Wallet} otherWallet The wallet to copy data from
     * @return {Wallet} The updated wallet instance
     */
    copy(otherWallet) {
        this.address = otherWallet.address;
        this.seed = otherWallet.seed;
        this.id = otherWallet.id;
        this.balances = otherWallet.balances;
        this.transactions = otherWallet.transactions;
        return this;
    }

    /**
     * @method
     * @summary Represents this object as JSON
     */
    toJSON() {
        return {
            address: this.address,
            id: this.id,
            balances: this.balances,
            transactions: this.transactions
        }
    }
}
