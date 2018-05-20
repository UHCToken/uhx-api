'use strict'

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

const assert = require('assert'),
    bittrex = require("../integration/bittrex");

describe("BitTrex API Test Suite", function() {

    /**
     * @summary Ensure that the client will get a quote between two currencies
     */
    it("Should get a quote directly between two currencies", async function() {
        var exchange = await new bittrex().getExchange({ from: "USDT",  to: "BTC" });
        assert.ok(exchange);
    });

    /**
     * @summary Ensure that the client will get a quote between three currencies
     */
    it("Should get a quote between an intermediary currency", async function() {
        // XLM<>BTC ; BTC<>USD
        var exchange = await new bittrex().getExchange([
            { from: "USDT", to: "XLM", via: ["BTC"] },
            { from: "USDT", to: "XLM", via: ["ETH"] }
        ]);
        assert.ok(exchange);
    });
});