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
    oauth = require('../controllers/oauth'),
    uhx = require('../uhx'),
    testRepo = require('../repository/repository'),
    exception = require('../exception'),
    model = require('../model/model'),
    express = require('express');

describe("User Repository Test Suite", function() {

    var testRepository = new testRepo.UhcRepositories(uhx.Config.db.test_server);

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
     * @summary Ensures that hidden fields are stripped from the instance
     */
    it("Should strip hidden fields from JSON", function() {

        var userUnderTest = new model.User().copy({
            name: "test",
            email: "test@test.com",
            _wallet: { "test":"test" }
        });

        var jsonObject = userUnderTest.toJSON();
        assert.equal(jsonObject.$type, 'User');
        assert.ok(!jsonObject._wallet);
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

        // Deactivate test user
        user = await testRepository.userRepository.delete(user.id);
        assert.ok(user.deactivationTime, "Did not de-activate test user");

    });

    /**
     * @test
     * @summary Creates and then authenticates a user
     */
    it("Should retrieve user by username and password", async function() {
        var userUnderTest = new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com",
            given_name: "Test",
            family_name: "User"
        });

        var password = 'test' + new Date().getTime();
        var user = await testRepository.userRepository.insert(userUnderTest, password);
        assert.ok(user.id);
        assert.equal(user.invalidLogins, 0);
        assert.equal(user.password, undefined); // should not disclose password

        // Now attempt to auth
        var authUser = await testRepository.userRepository.getByNameSecret(userUnderTest.name, password);

        assert.equal(user.id, authUser.id);

        // Deactivate test user
        user = await testRepository.userRepository.delete(user.id);
        assert.ok(user.deactivationTime, "Did not de-activate test user");

    });

    /**
     * @test
     * @summary Creates and then authenticates a user
     */
    it("Should increment user's invalid login count and then lock user", async function() {
        var userUnderTest = new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com",
            given_name: "Test",
            family_name: "User"
        });

        var password = 'test' + new Date().getTime();
        var user = await testRepository.userRepository.insert(userUnderTest, password);
        assert.ok(user.id);
        assert.equal(user.invalidLogins, 0);
        assert.equal(user.password, undefined); // should not disclose password

        // We want to ensure that invalid logins is incremented
        var afterUser = await testRepository.userRepository.incrementLoginFailure(userUnderTest.name, 2);
        assert.equal(afterUser.invalidLogins, 1, "Did not increment login failures");

        // Now we want to ensure that lockout occurs
        afterUser = await testRepository.userRepository.incrementLoginFailure(userUnderTest.name, 2);
        assert.equal(afterUser.invalidLogins, 2, "Did not increment login failures");

        afterUser = await testRepository.userRepository.incrementLoginFailure(userUnderTest.name, 2);
        assert.ok(afterUser.lockout, "Did not lock user account");

        // Deactivate test user
        user = await testRepository.userRepository.delete(user.id);
        assert.ok(user.deactivationTime, "Did not de-activate test user");

    });

    /**
     * @test
     */
    it("Should update user", async function() {

        var userUnderTest = new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com",
            given_name: "Test",
            family_name: "User"
        });

        var password = 'test' + new Date().getTime();
        var user = await testRepository.userRepository.insert(userUnderTest, password);
        assert.ok(user.id);
        assert.equal(user.invalidLogins, 0);
        assert.equal(user.password, undefined); // should not disclose password

        // Now update user
        user.givenName = "Bob";
        user.familyName = "Smith";
        user = await testRepository.userRepository.update(user);
        assert.ok(user.updatedTime, "Updated time was not set");
        assert.equal(user.givenName, "Bob", "User data was not updated properly");
        assert.equal(user.familyName, "Smith", "User data was not updated properly");

        // Password should remain
        assert.ok(await testRepository.userRepository.getByNameSecret(userUnderTest.name, password), "Password was changed inappropriately");

        // Change the password
        user = await testRepository.userRepository.update(user, "password" + new Date().getTime());

        try {
            await testRepository.userRepository.getByNameSecret(userUnderTest.name, password);
            assert.fail("Can still authenticate under old password");
        }
        catch(e) {
            // pass
        }

        // Deactivate test user
        user = await testRepository.userRepository.delete(user.id);
        assert.ok(user.deactivationTime, "Did not de-activate test user");

    });


});