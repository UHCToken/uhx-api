'use strict'

/**
 * Universal Health Coin API Service
 * Copyright (C) 2018, Universal Health Coin
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Original Authors: Justin Fyfe (justin-fyfe), Rory Yendt (RoryYendt)
 * Original Date: 2018-04-18
 * 
 * This file contains implementation of user wallet function
 * 
 */

 const assert = require('assert'),
    oauth = require('../controllers/oauth'),
    uhc = require('../uhc'),
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