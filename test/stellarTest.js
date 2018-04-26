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

 const assert = require('assert'),
    uhc = require('../uhc'),
    testRepo = require('../repository/repository'),
    exception = require('../exception'),
    model = require('../model/model'),
    StellarClient = require('../integration/stellar');

describe("Stellar API Wrapper", async function() {

    // Test repository
    var testRepository = new testRepo.UhcRepositories(uhc.Config.db.test_server);

    // Stellar client
    //var sClient = new StellarClient(uhc.Config.stellar.test_server, uhc.Config.stellar.assets, await testRepository.walletRepository.get(uhc.Config.stellar.distribution_wallet));

    /**
     * @test
     * @summary Tests that the stellar integration tool instantiates an account on the stellar network
     */
    it("Should instantiate an account properly", async function() {

    });

    /**
     * @test
     * @summary Tests that the trust statement is successful
     */
    it("Should trust the stellar assets", async function() {

    });

    /**
     * @test
     * @summary Tests that the stellar API retrieves an account successfully
     */
    it("Should retrieve account information properly", async function() {

    });

    /**
     * @test
     * @summary Tests the payment transacts between two wallets successfully
     */
    it("Should make a payment to another wallet successfully", async function() {

    });

    /**
     * @test
     * @summary Tests that the stellar integration can retrieve history succesfully
     */
    it("Should retrieve the history of the user wallet successfully", async function() {

    });
});