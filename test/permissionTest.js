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
    security = require('../security'),
    uhc = require('../uhc');

describe("Permission Infrastructure Tests", function() {

    /**
     * @test
     * @summary Ensures that when a principal is explicitly granted access that the permission object's Demand method will permit access
     */
    it("Should grant permission when permission is explicitly granted", function() {
        var principal = {
            sub: 'admin@test.com',
            grant: {
                "user": security.PermissionType.RWX | security.PermissionType.LIST,
                "wallet": security.PermissionType.RWX,
                "fiat": security.PermissionType.READ
            }
        };

        try {
            // Demand list only
            new security.Permission("user", security.PermissionType.LIST).demand(principal);

            // Demand full control
            new security.Permission("user", security.PermissionType.RWX).demand(principal);
        }
        catch(e) {
            assert.fail("Policy demand failed even though user is granted");
        }
    });
    
    /**
     * @test
     * @summary Ensures that when a principal is not granted a permission that the permission object throws the appropriate exception code
     */
    it("Should not grant permission when permission is missing", function() {

        var principal = {
            sub: 'user@test.com',
            grant: {
                "user": security.PermissionType.WRITE | security.PermissionType.READ | security.PermissionType.OWNER,
                "wallet": security.PermissionType.RWX | security.PermissionType.OWNER,
                "fiat": security.PermissionType.READ | security.PermissionType.LIST | security.PermissionType.WRITE | security.PermissionType.OWNER
            }
        };

        try {
            new security.Permission("user", security.PermissionType.READ).demand(principal); // SHOULD SUCCEED
        }
        catch(e) {
            assert.fail("Policy demand failed even though user is granted");
        }

        try {
            new security.Permission("user", security.PermissionType.EXECUTE).demand(principal); // SHOULD FAIL
            assert.fail("Policy demand success even though user is not granted");
            
        }
        catch(e) {
        }

    });

    /**
     * @test
     * @summary Ensures that when a permission exception is thrown, that the description of that exception is accurate.
     */
    it("Should describe the failed permission set accurately", function() {

        var principal = {
            sub: 'user@test.com',
            grant: {
                "user": security.PermissionType.WRITE | security.PermissionType.READ | security.PermissionType.OWNER,
                "wallet": security.PermissionType.RWX | security.PermissionType.OWNER,
                "fiat": security.PermissionType.READ | security.PermissionType.LIST | security.PermissionType.WRITE | security.PermissionType.OWNER
            }
        };

        try {
            new security.Permission("user", security.PermissionType.EXECUTE).demand(principal); // SHOULD FAIL
            assert.fail("Policy demand success even though user is not granted");
        }
        catch(e) {
            assert.equal(e.constructor.name, "SecurityException");
            assert.equal(e.permission, "x");
            assert.equal(e.object, "user");
        }


    });
});