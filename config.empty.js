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

 /**
  * @class UHC API Configuration
  * @description Configuration parameters for the stellar API
  */
 module.exports = {
     /**
      * @summary Groups configuration flags related to UHC database API
      */
     db : {
         /**
          * @summary The location of the PostgreSQL database server
          */
        server: 'postgres://postgres:postgres@localhost:5432/uhc',
        /**
         * @summary The location of the PostgreSQL server to run unit tests against
         */
        test_server: 'postgres://postgres:postgres@localhost:5432/uhc'
     },
     /**
      * @summary Groups configuration related to the STRIPE payment network
      */
     stripe: {
         /**
          * @summary The STRIPE API access key
          */
         key: "FKFKDJFSDKAFSDJA"
     },
     /**
      * @summary Configuration parameters for the API
      */
     api: {
         /**
          * @summary The port on which the API will listen
          */
         port: 4001,
         /**
          * @summary The base URL on which the API will listen
          */
         base: "/api/v1",
         /**
          * @summary The preferred host to expose to clients
          */
         host: "localhost",
         /**
          * @summary The preferred scheme
          */
         scheme: "https",
         /**
          * @summary The SSL certificate information
          */
         ssl :{
             key: "./privatekey.pem",
             cert: "./certificate.pem",
        },
         /**
          * @summary The link to the front-facing web site which users can interact with in order to do things like reset passwords, claim invites, etc.
          */
         ui_base: "http://localhost:4004/"
     },
     /**
      * @summary Configuration for security parameters
      */
     security: {
         /**
          * @summary Default session length for users
          */
         sessionLength: 30000000,
         /**
          * @summary Refresh vailidity in ms
          */
         refreshValidity: 30000000,
         /**
          * @summary Maximum failed login attempts
          */
         maxFailedLogin: 4,
         /**
          * @summary The HMAC256 secret to use for signing JWT tokens (note this should be randomly generated)
          */
        hmac256secret: "ThisIsASecretKey",
        /**
         * @summary The validation regex for user passwords
         */
        password_regex:  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/,
        /**
         * @summary The validation regex for usernames following RFC2822 regex for e-mails
         */
        username_regex: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
        /**
         * @summary The validation regex for usernames following RFC2822 regex for e-mails
         */
        email_regex: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
        /**
         * @summary When true, enables cross-origin scripting
         */
        enable_cors: true,
        /**
         * @summary The URI of the token service when sending WWW-Authenticate headers
         */
        tokenServiceUri: "http://localhost:4001/api/v1/auth/oauth2_token",
        /**
         * @summary Specifies the constants for system groups
         */
        sysgroups: {
            "administrators" : "044894bd-084e-47bb-9428-dbd80277614a",
            "users": "330d2fb4-ba61-4b48-a0a1-8162a4708e96"
        },
        /**
         * @summary Configuration options for invitations
         */
        invitations : {
            /**
             * @summary Whether invitations are allowed on this service
             */
            enabled: true,
            /**
             * @summary Validity time of invitations
             */
            validityTime: 604800000
        }
     },
     /**
      * @summary Configuration settings related to interaction with the stellar network
      */
     stellar: {
         /**
          * @summary The wallet from which the initial balance of XLM should be retrieved
          */
        initiator_wallet_id: "00000000-0000-0000-0000-000000000000",
        /**
         * @summary Identifies the target account where fees should be collected
         */
        fee_collector: "GB34934894328",
        /**
          * @summary The determine if this is part of a testnet
          */
        testnet_use: true,
        /**
          * @summary The horizon endpoint
          */
         horizon_server: "https://horizon-testnet.stellar.org",
        /**
         * @summary The home domain where the stellar TOML file is hosted
         */
        home_domain: "?.cooldomain.com"
     },
     /**
      * @summary Swagger configuration
      */
     swagger: {
         swaggerDefinition: {
             info: {
             title: "Universal Health Coin API",
             version: "1.0-alpha",
             description: "The Universal Health Coin API"
         },
         basePath: "/api/v1",
         swagger: "2.0"
        },
         apis: [ './controllers/*.js', './model/*.js', './exception.js', './api.js' ],
         enabled: true
     },
     /**
      * @summary Settings for mail which originates from this service
      */
     mail: {
        smtp: {
            service: 'SendGrid',
            auth: {
                user: 'myuser',
                pass: 'mypass'
            }
        },
        from: "no-reply@domain.com",
        templates: {
            invitation: "./templates/invitation",
            welcome: "./templates/welcome",
            confirmation: "./templates/confirm",
            emailChange: "./templates/emailChange"
        } 
    }
 }

 
 // Are we comparing?
 if(process.argv[2] == "whatsnew") {
    var config = require('./config');
    console.log("What's new in config.empty?")
    
    var fnDump = function(a, b, p) {
        for(var k in a)
           if(!b[k]) 
               console.log(`${p}.${k}`);
           else if(b[k] != a[k] && Object.keys(a[k]).length > 0) 
               fnDump(a[k], b[k], `${p}.${k}`);
    };

    fnDump(module.exports, config, '');
}