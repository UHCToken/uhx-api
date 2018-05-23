// <Reference path="./model/model.js"/>
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

 const config = require('./config'),
    repositories = require('./repository/repository'),
    SecurityLogic = require('./logic/SecurityLogic'),
    TokenLogic = require('./logic/TokenLogic'),
    winston = require('winston'),
    Mailer = require('./integration/mail'),
    StellarClient = require("./integration/stellar"),
    poolio = require('poolio'),
    Web3Client = require("./integration/web3");

winston.level = config.logging.level;

if(config.logging.file) 
    winston.add(winston.transports.File, { filename: config.logging.file, rotationFormat: true, json: false, tailable: true } );

 var repository = new repositories.UhcRepositories(config.db.server);

 // Exports section
 module.exports.SecurityLogic = new SecurityLogic();
 module.exports.TokenLogic = new TokenLogic();
 module.exports.Config = config;
 module.exports.Repositories = repository;
 module.exports.log = winston;
 module.exports.Mailer = new Mailer(config.mail);
 repository.assetRepository.query().then(function(result) {
     winston.info("Stellar Client Initialized...")
     module.exports.StellarClient = new StellarClient(config.stellar.horizon_server, result, config.stellar.testnet_use);
     winston.info("Web3 Client Initialized...")
     module.exports.Web3Client = new Web3Client(config.ethereum.geth_server, config.ethereum.geth_net_server);
 });

 /**
  * @method
  * @summary Initializes the worker pool 
  */
 module.exports.init = () => {
    module.exports.WorkerPool = new poolio.Pool({
        filePath: 'worker.js',
        size: 1
    });
    module.exports.WorkerPool.on("error", (e)=>winston.error(`Worker process failed: ${JSON.stringify(e)}`));
 }
 