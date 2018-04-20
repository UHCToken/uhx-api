'use strict';

/**
 * Universal Health Coin Service
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
 * This is the main application file which is used to launch the UHC API's Express Instance
 */

 const express = require('express'),
    bodyParser = require('body-parser'),
    rp = require('request-promise'),
    Stellar = require('stellar-sdk'),
    uhc = require("./uhc"),
    stripe = require('stripe')(uhc.Config.stripe.key),
    jwt = require('jsonwebtoken'),
    pg = require('pg'),
    api = require('./api'),
    swagger = require('swagger-jsdoc'),
    oauth = require('./controllers/oauth'),
    payment = require('./controllers/payment'),
    user = require('./controllers/user');
    

// Startup application
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Construct REST API
var restApi = new api.RestApi(uhc.Config.api.base, app);

// Add resources to rest API
if(uhc.Config.security.enableCors) 
    restApi.enableCors();

// Add OAuth token service
restApi.addResource(new oauth.OAuthTokenService());
restApi.addResource(new payment.UserPaymentResource());
restApi.addResource(new user.UserResource());

// Start REST API
restApi.start();

// Start the express instance
var instance = app.listen(uhc.Config.api.port, () => {
    console.log(`UHC API listening on ${uhc.Config.api.port}!`)
})