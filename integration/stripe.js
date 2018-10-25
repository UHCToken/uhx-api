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

const model = require('../model/model'),
    uhx = require('../uhx'),
    exception = require('../exception'),
    stripe = require('stripe')(uhx.Config.stripe.key);

/**
 * @class 
 * @summary Represents an exception from the stripe API 
 */
class StripeException extends exception.Exception {

    /**
     * @constructor
     * @summary Constructs a new exception from the stripe API error
     * @param {*} stripeError The error from the stripe API
     */
    constructor(stripeError) {

        var errCode = exception.ErrorCodes.UNKNOWN;
        switch (stripeError.type) {
            case 'StripeCardError':
                errCode = "ERR_STRIPE_CARD_INVALID";
                break;
            case 'RateLimitError':
                errCode = exception.ErrorCodes.API_RATE_EXCEEDED;
                break;
            case 'StripeInvalidRequestError':
                errCode = exception.ErrorCodes.MISSING_PROPERTY;
                break;
            case 'StripeConnectionError':
                errCode = exception.ErrorCodes.COM_FAILURE;
                break;
            case 'StripeAuthenticationError':
                errCode = exception.ErrorCodes.SECURITY_ERROR;
                break;
        }

        super(stripeError.message, errCode, stripeError);
    }
}

/**
 * @class 
 * @summary Represents a client to the Stripe payment gateway
 */
module.exports = class StripeClient {

    /**
     * @constructor
     * @summary Creates a new instance of the stripe client
     */
    constructor() {
        this.singleCharge = this.singleCharge.bind(this);
    }

    /**
     * @method
     * @summary Constructs a request to the Stripe payment API for a one time charge
     * @param {string} source The source to charge (the mastercard, amex, or visa token)
     * @param {User} user The UHX user which is being charged
     * @param {MonetaryAmount} amount The amount to be charged to the card
     * @param {MonetaryAmount} fee The additional amount to add to the charge 
     * @param {string} description The textual description of the transaction to be charged
     * @returns {Promise<Transaction>} The details of the trasnaction
     */
    singleCharge(source, user, amount, fee, description) {
        return new Promise(function (fulfill, reject) {
            try {

                // Fee to be charged
                fee = fee || {};

                stripe.charges.create({
                    amount: amount.value + fee.value,
                    currency: amount.code,
                    source: source,
                    description: description,
                    metadata: {
                        "user_id" : user.id,
                        "user_email": user.email,
                        "uhx_fee": fee.amount
                    }
                }, function (err, charges) {
                    if (charges)
                        fulfill(new model.Transaction(
                            null, 
                            model.TransactionType.Deposit,
                            description,
                            new Date(charges.created),
                            user, 
                            null, // TODO: Set UHX as the payee
                            amount,
                            fee, 
                            charges.id,
                            model.TransactionStatus.Complete
                        ));
                    else if (err)
                        reject(new StripeException(err));
                });
            }
            catch (e) {
                uhx.log.error(`Stripe API charge failed: ${JSON.stringify(e)}`);
                reject(exception.Exception("Transaction on payment processor failed", exception.ErrorCodes.COM_FAILURE, e));
            }
        });
    }

    // TODO: Add subscription charge method here
    // TODO: Add refund method here
    // TODO: Add 
}