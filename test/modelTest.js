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
    exception = require('../exception'),
    model = require('../model/model');

describe('Model Tests', function() {

    /**
     * @test
     * @summary Ensures that the model objects are translated to the database update command successfully
     */
    it("Should translate UPDATE User to database objects", function() {

        var user = new model.User();
        user.name = "test";
        user.email = "bob@test.com";
        user.invalidLogins = 2;

        var dataRep = user.toData();
        assert.equal(dataRep.invalid_login, 2);

        var sqlObject = model.Utils.generateUpdate(user, "users", "updated_time");
        assert.equal(sqlObject.args.length, 12);
    });
});