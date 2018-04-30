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

 const express = require('express'),
    bodyParser = require('body-parser'),

    Stellar = require('stellar-sdk'),
    uhc = require("./uhc"),
    stripe = require('stripe')(uhc.Config.stripe.key),
    jwt = require('jsonwebtoken'),
    pg = require('pg'),
    api = require('./api'),
    oauth = require('./controllers/oauth'),
    purchase = require('./controllers/purchase'),
    user = require('./controllers/user'),
    contract = require('./controllers/contract'),
    wallet = require('./controllers/wallet'),
    group = require('./controllers/group'),
    permission = require('./controllers/permission'),
    asset = require('./controllers/asset'),
    swagger = require('./controllers/js-doc');
    

// Startup application
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Construct REST API
var restApi = new api.RestApi(uhc.Config.api.base, app);

// Add resources to rest API
if(uhc.Config.security.enableCors) 
    restApi.enableCors();

if(uhc.Config.swagger.enabled) {
    restApi.addResource(new swagger.SwaggerMetadataResource());
    app.use('/api-docs', express.static('api-docs'));
}

// Add OAuth token service
restApi.addResource(new oauth.OAuthTokenService());
restApi.addResource(new purchase.PurchaseApiResource());
restApi.addResource(new user.UserApiResource());
restApi.addResource(new contract.ContractApiResource());
restApi.addResource(new wallet.WalletApiResource());
restApi.addResource(new group.GroupApiResource());
restApi.addResource(new permission.PermissionApiResource());
restApi.addResource(new asset.AssetApiResource());
// Start REST API
restApi.start();

// Start the express instance
var instance = app.listen(uhc.Config.api.port, () => {
    console.log(`UHC API listening on ${uhc.Config.api.port}!`)
})