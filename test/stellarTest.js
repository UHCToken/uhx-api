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
    StellarClient = require('../integration/stellar'),
    Wallet = require("../model/Wallet");

describe("Stellar API Wrapper", async function() {

    this.timeout(0);

    // Test repository
    var testRepository = new testRepo.UhcRepositories(uhc.Config.db.test_server);

    var sClient = null;
    // Stellar client
    before(async function() {
        sClient = new StellarClient("https://horizon-testnet.stellar.org", await testRepository.assetRepository.query(), true, uhc.Config.stellar.fee_collector);
    })

    /**
     * @test
     * @summary Ensures that the stellar API generates a random keypair properly
     */
    it("Should create an account properly", async function() {
        var wallet = await sClient.generateAccount();
        assert.ok(wallet.seed);
        assert.ok(wallet.address);
    });

    /**
     * @test
     * @summary Tests that the stellar integration tool instantiates an account on the stellar network
     */
    it("Should activate an account properly", async function() {

        // Assert wallet is not active
        var wallet = await sClient.generateAccount();
        assert.ok(!(await sClient.isActive(wallet)));

        // Activate the account with 2 XLM
        var initWallet = await testRepository.walletRepository.get(uhc.Config.stellar.initiator_wallet_id);
        wallet = await sClient.activateAccount(wallet, "2", initWallet);
        assert.ok(await sClient.isActive(wallet));

        // Now we want to get balances
        var acctWallet = await sClient.getAccount(wallet);

        assert.ok(acctWallet.address);
        assert.ok(acctWallet.balances);
        assert.equal(acctWallet.balances[0].value, 2);
        assert.equal(acctWallet.balances[0].code, "XLM");
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