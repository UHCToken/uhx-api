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
    uhx = require('../uhx'),
    exception = require('../exception'),
    express = require('express');

 describe('OAUTH2.0 Test Suite', function() {

    /**
     * @test 
     * @summary Ensures that the call to error() properly creates an OAUTH 2.0 error
     */
    it("Should Serialize Error Responses Properly", function() {
        var _actual = {}, _errorCode = 200;

        new oauth.OAuthTokenService().error(
            new exception.Exception("Test","TEST"),
            { status: function(code) { _errorCode = code; return { json: function(message) { _actual = message} } } }
        );

        assert.equal(_errorCode, 400, "OAuth errors should have 400 as status code");

        assert.equal(_actual.constructor.name, "OAuthErrorResult");

        // Ensure error result object is constructed
        assert.equal(
            _actual.error, 
            "TEST"
        );

        // Assert error result matches spec of token
        assert.deepEqual(
            _actual.toJSON(),
            {
                error: "TEST",
                error_description: "Test"
            }
        );

    });

    /**
     * @test
     * @summary Ensure that the class has one POST route to auth/oauth2_token
     */
    it("Should have one POST route to auth/oauth2_token", function() {

        assert.ok(new oauth.OAuthTokenService().routes.routes[0].post, "Does not have a POST method handler");
        
    });


 });