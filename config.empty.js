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

const winston = require('winston');

/**
 * @class UhX API Configuration
 * @description Configuration parameters for the stellar API
 */
module.exports = {
    /**
     * @summary Groups configuration flags related to UhX database API
     */
    db: {
        /**
         * @summary The location of the PostgreSQL database server
         */
        server: 'postgres://postgres:postgres@localhost:5432/uhx',
        /**
         * @summary The location of the PostgreSQL server to run unit tests against
         */
        test_server: 'postgres://postgres:postgres@localhost:5432/uhx'
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
        scheme: "http",
        /**
         * @summary The SSL certificate information
         */
        tls: {
            key: "./mykey.pfx",
            passphrase: "ABC123"
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
         * @summary The validity period for password resets
         */
        resetValidity: 30000000,
        /**
         * @summary The validity of a TFA code
         */
        tfaValidity: 300000,
        /**
         * @summary Specifies the amount time for invoice expiry
         */
        invoiceValidity: 400000000,
        /**
         * @summary Confirmation validatity
         */
        confirmationValidity: 300000,
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
        password_regex: /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()\-_=+{}[\];:'"|\\/.><,]).{8,}$/,
        /**
         * @summary The validation regex for usernames following RFC2822 regex for e-mails
         */
        username_regex: /(^[^<>%{}]+[a-z0-9!#$&'*+/=?^_`|~-])+(?:\.[a-z0-9!#$&'*+/=?^_`|~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?([^0-9<>(){}%;"]$)/,
        /**
         * @summary The validation regex for usernames following RFC2822 regex for e-mails
         */
        email_regex: /(^[^<>%{}]+[a-z0-9!#$&'*+/=?^_`|~-])+(?:\.[a-z0-9!#$&'*+/=?^_`|~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?([^0-9<>(){}%;"]$)/,
        /**
         * @summary The validation regex for names, stripping exploitable characters
         */
        name_regex: /^[^0-9<>(){}%;"]+$/,
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
            "administrators": "044894bd-084e-47bb-9428-dbd80277614a",
            "users": "330d2fb4-ba61-4b48-a0a1-8162a4708e96",
            "providers": "4339ef73-25e7-43fd-9080-8f7eb55182eb",
            "patients": "285cb044-bf99-4409-b418-7edc5c012ded"
        },
        /**
         * @summary Configuration options for invitations
         */
        invitations: {
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
         * @summary Ethereum client name
         */
        client: {
            name: 'StellarClient',
            balanceFn: 'getAccount',
            activeFn: 'isActive',
            createFn: 'generateAccount'
        },
        /**
         * @summary The wallet from which the initial balance of XLM should be retrieved
         */
        initiator_wallet_id: "00000000-0000-0000-0000-000000000000",
        /**
         * @summary Identifies the target account where fees should be collected
         */
        fee_collector: "GB34934894328",
        /**
         * @summary Identifies the account to sign for the patient
         */
        signer_patient_id: "5ffd56be-d2a2-4abc-93e3-056cc679232d",
        /**
        * @summary Identifies the account to sign for the provider
        */
        signer_provider_id: "891ab26a-3c2c-4c41-bcb5-0612f1cff939",
        /**
         * @summary Currency to be used for escrow
         */
        escrow_asset_code: "TEST",
            /**
         * @summary Identifies the account that will hold escrow funds
         */
        escrow_id: "610be8a6-dcf2-4e0f-8e83-7f340f6792ca",
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
        home_domain: "?.cooldomain.com",
        /**
         * @summary When using market rate quotes the validity of the offer.
         */
        market_offer_validity: 60000,
    },

    /**
     * @summary Configuration settings related to interaction with the ethereum network
     */
    ethereum: {
        /**
         * @summary Ethereum client name
         */
        client: {
            name: 'Web3Client',
            balanceFn: 'getBalance',
            createFn: 'generateAccount',
        },
        /**
         * @summary Flag for using ethereum
         */
        enabled: false,
        /**
         * @summary Geth endpoint
         */
        geth_server: "http://localhost:8545",
        /**
         * @summary Web service endpoint for geth
         */
        geth_net_server: "ws://localhost:8546",
        /**
          * @summary The wallet id to which ethereum is accepted
          */
        distribution_wallet_address: "0x0000000000000000000000000000000000000000",
    },
    bitcoin: {
        /**
         * @summary Bitcoin client name
         */
        client: {
            name: 'BitcoinClient',
            balanceFn: 'getBalance',
            createFn: 'generateAccount',
            network: 'testnet'
        },
        /**
         * @summary Flag for using bitcoin
         */
        enabled: true,
        /**
          * @summary The bitcoin server ip
          */
        server: "http://bitcoin:8333",
        /**
          * @summary The wallet id to which bitcoin is accepted
          */
        distribution_wallet_address: "0x0000000000000000000000000000000",
    },
    /**
     * @summary Configuration settings related to Green Money API
     */
    greenMoney: {
        /**
        * @summary Green money API base Url
        */
        baseUrl: 'https://www.greenbyphone.com/eCheck.asmx/',
        /**
        * @summary API password
        */
        apiPassword: {
            client_id: '123456',
            password: 'abcd1234'
        },
        /**
        * @summary Auto update timer
        */
        updateTimer: 14400000,
        /**
        * @summary How often to resend a reminder email prior to expiry
        */
        reminderTime: 604800000,
        /**
        * @summary The amount of time before an invoice is marked to be removed
        */
        expiryTime: 1209600000,
        /**
        * @summary Setting maximum count per delay period and total count of invoices for that period
        */
        invoiceLimit: {
            /**
            * @summary The time that must pass to allow for another invoice creation
            */
            delayTime: 604800000,
            /**
            * @summary The total count of invoices to limit the creation of a new invoice before a delay timer expires
            */
            creationLimit: 3
        }
    },
    /**
     * @summary File storage configuration
     */
    objectStorage: {
        /**
         * @summary Access key id
         */
        key: "XXXXXXXXXXXXXXXXXXXXXXXXX",
        /**
         * @summary Secret key
         */
        secret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        /**
         * @summary Storage bucket
         */
        bucket: "mybucketname",
        /**
         * @summary Storage endpoint
         */
        endpoint: "s3.tor01.objectstorage.softlayer.net",
        /**
         * @summary Maximum file size in bytes
         */
        maxFileSize: 1048576
    },
    /**
     * @summary Google maps configuration
     */
    googleMaps: {
        /**
         * @summary API key
         */
        key: "XXXXXXXXXXXXXXXXXXXXXXXXX",
        /**
         * @summary Use HTTPS
         */
        secure: true
    },
    /**
     * @summary Configuration settings related to Karis
     */
    karis: {
        /**
         * @summary Code assigned by Karis to represent the organization
         */
        clientCode: "0011W00001u2xUB",
        /**
         * @summary Code assigned by Karis to represent your specific set of offerings
         */
        groupCode: "",
        /**
         * @summary Code used to distinguish different plans you may offer to clients
         */
        planCode: "0011W00001v0Dhy",
        /**
         * @summary The familiar name a customer may reference to equate to the relationship with Universal Health Coin
         */
        memberAffiliation: "Universal Health Coin",
        /**
         * @summary The SFTP endpoint credentials
         */
        sftpClient: {
            host: "uploads.thekarisgroup.com",
            userName: "universalhealthcoin",
            privateKeyLocation: "security\\ssh\\karis\\id_rsa.ppk",
            password: "",
            port: 22,
            publicPgpKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----
            Version: GnuPG/MacGPG2 v2
            Comment: GPGTools - https://gpgtools.org
            
            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
            =8D3G
            -----END PGP PUBLIC KEY BLOCK-----`
        },
    },
    /**
     * @summary Swagger configuration
     */
    swagger: {
        swaggerDefinition: {
            info: {
                title: "Universal Health Coin API",
                version: "1.0-alpha3",
                description: "The Universal Health Coin API"
            },
            basePath: "/api/v1",
            swagger: "2.0"
        },
        apis: ['./controllers/*.js', './model/*.js', './exception.js', './api.js'],
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
        sms: {
            auth: "XXXXx",
            sid: "",
            from: ""
        },
        from: "no-reply@domain.com",
        templates: {
            invitation: "./templates/invitation",
            resendInvitation: "./templates/resendInvitation",
            welcome: "./templates/welcome",
            confirmation: "./templates/confirm",
            contactChange: "./templates/contactChange",
            resetPassword: "./templates/resetPassword",
            tfa: "./templates/tfa",
            tfaChange: "./templates/tfaChanged",
            passwordChange: "./templates/passwordChanged",
            greenMoneyReminder: "./templates/greenMoneyReminder"
        }
    },
    logging: {
        level: 'info',
        console: true,
        file: 'uhx.log'
    }
}


// Are we comparing?
if (process.argv[2] == "whatsnew") {
    var config = require('./config');
    console.log("What's new in config.empty?")

    var fnDump = function (a, b, p) {
        for (var k in a)
            if (!b[k])
                console.log(`${p}.${k}`);
            else if (b[k] != a[k] && Object.keys(a[k]).length > 0)
                fnDump(a[k], b[k], `${p}.${k}`);
    };

    fnDump(module.exports, config, '');
}
else if (process.argv[2] == "merge") {
    var config = require('./config');
    console.log("// Merged Configuration")

    var fnMerge = function (a, b) {
        for (var k in a)
            if (!b[k])
                b[k] = a[k];
            else if (b[k] != a[k] &&
                a[k].constructor.name != "String" &&
                Object.keys(a[k]).length > 0)
                b[k] = fnMerge(a[k], b[k]);
        return b;
    };

    console.log(JSON.stringify(fnMerge(module.exports, config), null, '\t'));

}
