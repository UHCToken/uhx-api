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

describe("Session Repository Test Suite", function() {

    var testRepository = new testRepo.UhcRepositories(uhx.Config.db.test_server);

    /**
     * @test
     * @summary Ensures that the session persistence inserts an appropriate session
     */
    it("Should create a new session between user and application", async function() {

        var user = await testRepository.userRepository.insert(new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com"
        }), "test" + new Date().getTime());

        // Fiddler is the test application credential
        try {
            var application = await testRepository.applicationRepository.getByNameSecret("fiddler", "fiddler");
        }
        catch(e) {
            assert.fail("Please ensure the test application 'fiddler' is configured on the test database");
        }

        // Create session
        var session = await testRepository.sessionRepository.insert(new model.Session(user, application, "*", 1000));
     
        assert.ok(session.id, "Session was not created");
        assert.notEqual(session.notBefore, session.notAfter);
        assert.equal(session.notAfter.getTime() - session.notBefore.getTime(), 1000);

    });

    /**
     * @test
     * @summary Ensures that the session is retrieved by ID or by username
     */
    it("Should fetch a session by ID or User", async function() {

        var user = await testRepository.userRepository.insert(new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com"
        }), "test" + new Date().getTime());

        // Fiddler is the test application credential
        try {
            var application = await testRepository.applicationRepository.getByNameSecret("fiddler", "fiddler");
        }
        catch(e) {
            assert.fail("Please ensure the test application 'fiddler' is configured on the test database");
        }

        // Create session
        var session = await testRepository.sessionRepository.insert(new model.Session(user, application, "*", 5000));
        assert.ok(session.id, "Session was not created");
        assert.notEqual(session.notBefore, session.notAfter);
        assert.equal(session.notAfter.getTime() - session.notBefore.getTime(), 5000);

        var session2 = await testRepository.sessionRepository.get(session.id);
        assert.equal(session2.id, session.id);

        session2 = await testRepository.sessionRepository.getActiveUserSession(user.id);
        assert.equal(session2.id, session.id);

        await testRepository.sessionRepository.abandon(session.id);

        session2 = await testRepository.sessionRepository.getActiveUserSession(user.id);
        assert.ok(session2 == null, "Is retrieving a non-active session");

    });

    /**
     * @test
     * @summary Ensures that the session is abandoned
     */
    it("Should abandon a session when requested", async function() {

        var user = await testRepository.userRepository.insert(new model.User().fromData({
            name: "test" + new Date().getTime(),
            email: "test@test.com"
        }), "test" + new Date().getTime());

        // Fiddler is the test application credential
        try {
            var application = await testRepository.applicationRepository.getByNameSecret("fiddler", "fiddler");
        }
        catch(e) {
            assert.fail("Please ensure the test application 'fiddler' is configured on the test database");
        }

        // Create session
        var session = await testRepository.sessionRepository.insert(new model.Session(user, application, "*", 1000));
        assert.ok(session.id, "Session was not created");
        assert.notEqual(session.notBefore, session.notAfter);
        assert.equal(session.notAfter.getTime() - session.notBefore.getTime(), 1000);

        session = await testRepository.sessionRepository.abandon(session.id);
        assert.ok(session.notAfter <= new Date(), "Session is still valid after calling abandon()");

    });


});