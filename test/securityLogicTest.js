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
    model = require('../model/model');

describe("Security Logic Test Suite", function() {

    /**
     * @test
     * @summary Ensures that a valid username passes validation
     */
    it("Should not throw exception on valid user name", function() {

        var user = new model.User().copy({name: 'bob@test.com'});
        try {
            uhc.SecurityLogic.validateUser(user, null);
        }
        catch(e) {
            assert.fail("bob@test.com is a valid user name");
        }
    });

    /**
     * @test
     * @summary Ensures that an invalid username fails validation
     */
    it("Should throw exception on invalid user name", function() {

        var user = new model.User().copy({name: 'bob%%$*(%$#test.com'});
        try {
            uhc.SecurityLogic.validateUser(user, null);
            assert.fail("bob%%$*(%$#test.com is an invalid username");
        }
        catch(e) {
            assert.equal(e.constructor.name, "BusinessRuleViolationException", "Should throw BusinessRuleViolationException");
        }
    });

    /**
     * @test
     * @summary Ensures that a valid password passes validation
     */
    it("Should not throw exception on valid password", function() {

        var user = new model.User().copy({name: 'bob@test.com'});
        try {
            uhc.SecurityLogic.validateUser(user, "@Test123");
        }
        catch(e) {
            assert.fail("@Test123 is a valid password");
        }
    });

    /**
     * @test
     * @summary Ensures that an invalid password fails validation
     */
    it("Should throw exception on invalid password", function() {

        var user = new model.User().copy({name: 'bob@test.com'}); 
        try {
            uhc.SecurityLogic.validateUser(user, "test");
            assert.fail("test is an invalid password");
        }
        catch(e) {
            assert.equal(e.constructor.name, "BusinessRuleViolationException", "Should throw BusinessRuleViolationException");
        }
    });
});