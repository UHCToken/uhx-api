'use strict';

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
 * This file contains the base services for the UHC API
 * 
 */

// HTTP operations that are premitted
const ALLOWED_OPS = [ 'use', 'options', 'get', 'post', 'put', 'delete' ];

const express = require('express'),
    uhc = require("./uhc"),
    oauth = require("./api/oauth"),
    user = require("./api/user"),
    wallet = require("./api/wallet"),
    payment = require("./api/payment");

/**
 * @class
 * @summary UHC Api class
 */
module.exports.RestApi = class RestApi {

    /**
     * Constructs a new API instance and attaches it to the specified application
     * @param {string} basePath Identifies the base path which this API should operate on
     * @param {Express.Application} app The Express router to attach this router to
     */
    constructor(basePath, app) {
        this._application = app;
        this._basePath = basePath;
        this._resources = [];
    }
    /**
     * @summary When called, will attach the CORS handler to the api application
     */
    enableCors() {
        // Verify configuration
        if(!this._application) throw new uhc.ErrorResult("Application is not specified", uhc.ErrorCodes.INVALID_CONFIGURATION);

        // CORS
        this._application.use((req, res, next) => {
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', '*')

            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type')
            // Pass to next layer of middleware
            next();
        });
    }
    /**
     * @summary Starts the API with the bound resources
     */
    start() {

        // Verify configuration
        if(!this._application) throw new uhc.ErrorResult("Application is not specified", uhc.ErrorCodes.INVALID_CONFIGURATION);
        if(!this._basePath) throw new uhc.ErrorResult("Base Path is not specified", uhc.ErrorCodes.INVALID_CONFIGURATION);

        // Bind my own operations
        this._application.options(basePath + "/", this.options);

        // Start other resources 
        for(var r in this._resources) {

            // Identify the path 
            var path = this._basePath + "/" + (r.route || r.constructor.name.toLowerCase());
            var rPrototype = Reflect.getPrototypeOf(r);

            // Log
            console.info("Adding instance of " + r.constructor.name + " to API");

            // Bind operations to the router 
            for(var m in Reflect.ownKeys(rPrototype)) {
                var fn =this._application[m];
                if(fn && ALLOWED_OPS.indexOf(m) > -1) 
                {
                    console.info("\t" + m + " " + path + " => " + r.constructor.name + "." + m);

                    // This is a stub that will call the user's code, it wraps the 
                    // function from the API class in a common code which will handle
                    // exceptions and return a consistent error object to the caller
                    fn(path, async(req,res) => { 
                        try {
                            r[m](req, res);
                        }
                        catch(e) {
                            if(r.onException)
                                r.onException(e, res);
                            else {
                                // If the exception is not already an error result then we want to wrap it in one
                                var retVal = e;
                                if(!(retVal instanceof uhc.ErrorResult))
                                    retVal = new uhc.ErrorResult(e, uhc.ErrorCodes.UNKNOWN);
                                
                                // Output to error log
                                console.error("Error executing request: " + JSON.stringify(retVal));
                    
                                // Send result
                                res.status(500).send(retVal);
                            }
                        }
                    });
                }
            }
        }
    }
    /**
     * @summary Adds a resource to the API
     * @param {*} resourceInstance An instance of a class with get, options, post, or put defined to attach to this base path
     */
    addResource(resourceInstance) {
        // Verify that the resource instance is valid
        if(!resourceInstance.route) console.warn(resourceInstance.constructor.name + " does not define route property, will use {base}/" + resourceInstance.constructor.name.toLowerCase());
        this._resources.push(resourceInstance);
    }
    /**
     * @summary Handler for the options method
     * @swagger
     * path: /
     * operations:
     *  -   httpMethod: OPTIONS
     *      summary: Returns an OPTIONS statement which contains allowed operations based on current ACL
     *      notes: When logged in, this service will inform clients which methods they can access based on their ACL
     *      responseClass: Options
     */
    async options(req, res) {
        try {
            res.status(501).send("Not Implemented");
        }
        catch(e) {
            // Construct error result
            var causedBy = e instanceof uhc.ErrorResult ?
                e : // exception is already an ErrorResult so we use it
                new uhc.ErrorResult(e, uhc.ErrorCodes.UNKNOWN); // exception is another class 
            
            // Output to error log
            console.error("Error executing options: " + JSON.stringify(causedBy));

            // Send result
            res.status(500).send(
                new uhc.ErrorResult("Error executing OPTIONS", uhc.ErrorCodes.UNKNOWN, causedBy)
            );
        }
    }
}