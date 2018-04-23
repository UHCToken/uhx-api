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
    security = require('../security'),
    exception = require('../exception'),
    uhc = require('../uhc');

describe("Permission Infrastructure Tests", function() {

    /**
     * @test
     * @summary Ensures that when a principal is explicitly granted access that the permission object's Demand method will permit access
     */
    it("Should grant permission when permission is explicitly granted", function() {
        var principal = new security.JwtPrincipal({
            sub: 'admin@test.com',
            grant: {
                "user": security.PermissionType.RWX | security.PermissionType.LIST,
                "wallet": security.PermissionType.RWX,
                "fiat": security.PermissionType.READ
            }
        });

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

        var principal = new security.JwtPrincipal({
            sub: 'user@test.com',
            grant: {
                "user": security.PermissionType.WRITE | security.PermissionType.READ | security.PermissionType.OWNER,
                "wallet": security.PermissionType.RWX | security.PermissionType.OWNER,
                "fiat": security.PermissionType.READ | security.PermissionType.LIST | security.PermissionType.WRITE | security.PermissionType.OWNER
            }
        });

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

        var principal = new security.JwtPrincipal({
            sub: 'user@test.com',
            grant: {
                "user": security.PermissionType.WRITE | security.PermissionType.READ | security.PermissionType.OWNER,
                "wallet": security.PermissionType.RWX | security.PermissionType.OWNER,
                "fiat": security.PermissionType.READ | security.PermissionType.LIST | security.PermissionType.WRITE | security.PermissionType.OWNER
            }
        });

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