/// <Reference path="../repository/userRepository.js" />
/// <Reference path="../repository/applicationRepository.js" />
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
 const uhc = require('../uhc'),
    crypto = require('crypto'),
    security = require('../security'),
    User = require('./User'),
    ModelUtil = require('./ModelUtil'),
    Application = require('./Application'),
    Session = require('./Session'),
    PermissionSet = require('./PermissionSet'),
    PermissionSetInstance = require('./PermissionSetInstance'),
    MonetaryAmount = require('./MonetaryAmount'),
    Transaction = require('./Transaction'),
    Wallet = require('./Wallet');

/**
 * @enum
 * @summary Identifies type of transaction
 */
const TransactionType = {
    Payment : 1,
    Trust : 2, 
    Refund : 3,
    Deposit: 4
};

/**
 * @enum
 * @summary Identifies the status of the transaction
 */
const TransactionStatus = {
    Pending: 0,
    Complete: 1,
    Failed: 2
}

// Module exports
module.exports.User = User;
module.exports.Application = Application;
module.exports.Session = Session;
module.exports.PermissionSet = PermissionSet;
module.exports.PermissionSetInstance = PermissionSetInstance;
module.exports.Utils = new ModelUtil();
module.exports.Wallet = Wallet;
module.exports.MonetaryAmount = MonetaryAmount;
module.exports.Transaction = Transaction;
module.exports.TransactionType = TransactionType;
module.exports.TransactionStatus = TransactionStatus;