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
    oauth = require('../controllers/oauth'),
    uhc = require('../uhc'),
    testRepo = require('../repository/repository'),
    exception = require('../exception'),
    model = require('../model/model'),
    express = require('express');

describe("User Repository Test Suite", function() {

    var testRepository = new testRepo.UhcRepositories("postgres://postgres:postgres@localhost:5432/uhc");

    /**
     * @test
     * @summary Tests that the sample admin account is loaded
     */
    it("Should load the test user admin@test.com", async function() {

        var user = await testRepository.userRepository.get('3c673456-23b1-4263-9deb-df46770852c9');
        assert.equal(user.email, "admin@test.com");
        
    });

    /**
     * @test
     * @summary Test that a user is created
     */
    it("Should create a user testXXXXXXX@test.com", async function() {

        var userUnderTest = new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com",
            given_name: "Test",
            family_name: "User"
        });
        var user = await testRepository.userRepository.insert(userUnderTest, 'test' + new Date().getTime());
        assert.ok(user.id);
        assert.equal(user.invalidLogins, 0);
    });
});