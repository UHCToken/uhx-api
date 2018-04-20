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

const uhc = require("./uhc"),
    jwt = require('jsonwebtoken'),
    express = require('express');

/** 
 * @class
 * @summary This class provides a wrapper for requests allowing for consistent error messaging, and authorization controls
 */
class RouteHandler {

    /**
     * @constructor
     * @param {*} routeInfo Information about the route to which this handler is binding itself
     */
    constructor(routeInfo) {
        this._routeInfo = routeInfo;
        this.exec = this.exec.bind(this);
        this.checkAccessCore = this.checkAccessCore.bind(this);
    }

    /**
     * @method
     * @summary The check access core function provides a basic implementation which will use the registered access information and provide basic ACL
     * @param {Express.Request} req The HTTP request object for authorization to be checked
     * @param {Express.Response} res The HTTP response object for writing any additional headers
     */
    checkAccessCore(req, res) {
            
        // Get the security map
        if(!req.route) return true; // no route defined
        var permissionSet = [
            this._routeInfo._instance.routes.permission_group,
            this._routeInfo[req.method.toLowerCase()].demand
        ];

        // First, is the method open?
        if(!permissionSet || !permissionSet[0] && !permissionSet[1])
            return true;
        else // it isn't and must be authenticated
        {
            var authHeader = req.get('Authorization');

            // No auth header?
            if(!authHeader) {
                res.setHeader("WWW-Authenticate", `Bearer authorization_uri="${uhc.Config.security.tokenServiceUri}"`);
                // TODO: Send to auth service
                throw new uhc.Exception("Missing authorization header", uhc.ErrorCodes.UNAUTHORIZED);
            }
            else { // Auth header is present, validate it
                var authParts = authHeader.split(" ");

                // Verify that the authorization is bearer based and that it is a JWT token
                try {
                    if(authParts[0].trim().toLowerCase() != "bearer")
                        throw new uhc.Exception("Invalid type of authorization provided, this service expects Bearer", uhc.ErrorCodes.SECURITY_ERROR);
                    else if(!authParts[1] || authParts[1].split(".").length != 3)
                        throw new uhc.Exception("Invalid bearer token format, this service expects IETF RFC 7519 format tokens", uhc.ErrorCodes.SECURITY_ERROR);
                    else { // Validate the jwt
                        var token = jwt.verify(authParts[1], uhc.Config.security.hmac256secret);
                        
                        // TODO: Check the grants!
                        return true;
                    }
                }
                catch(e) {
                    console.error(`Error validting security - ${e}`);
                    throw new uhc.Exception("Error validating security", uhc.ErrorCodes.SECURITY_ERROR, new uhc.Exception(e, uhc.ErrorCodes.UNKNOWN));
                }
            }
            
        }    
    }

    /**
     * @method
     * @summary Wraps requests in a simple exception and logging handler
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to be sent to the client
     */
    async exec(req, res) {
        try {
            // Is there custom authentication checker?
            if(this._routeInfo._instance.authorize)
                this._routeInfo._instance.authorize(req, res);
            else
                this.checkAccessCore(req, res); // use our built in one

                this._routeInfo[req.method.toLowerCase()].method(req, res);
        }
        catch(e) {
            if(this._routeInfo._instance.error)
                this._routeInfo._instance.error(e, res);
            else {
                // If the exception is not already an error result then we want to wrap it in one
                var retVal = e;
                if(retVal instanceof uhc.Exception)
                    retVal = e;
                else if(e.message)
                    retVal = new uhc.Exception(e.message, uch.ErrorCodes.UNKNOWN);
                else
                    retVal = new uhc.Exception(e, uhc.ErrorCodes.UNKNOWN);
                
                // Set appropriate status code
                var httpStatusCode = 500;
                switch(retVal.code) {
                    case uhc.ErrorCodes.NOT_IMPLEMENTED:
                        httpStatusCode = 501;
                        break;
                    case uhc.ErrorCodes.SECURITY_ERROR:
                        httpStatusCode = 403;
                        break;
                    case uhc.ErrorCodes.UNAUTHORIZED:
                        httpStatusCode = 401;
                        break;
                }

                // Output to error log
                console.error(`Error executing ${req.method} ${req.path} :  ${JSON.stringify(retVal)}`);
    
                // Send result
                res.status(httpStatusCode).json(retVal);
            }
        }
    }
}
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
        if(!this._application) throw new uhc.Exception("Application is not specified", uhc.ErrorCodes.INVALID_CONFIGURATION);

        // CORS
        this._application.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
            res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type')
            next();
        });
    }
    /**
     * @summary Starts the API with the bound resources
     */
    start() {

        // Verify configuration
        if(!this._application) throw new uhc.Exception("Application is not specified", uhc.ErrorCodes.INVALID_CONFIGURATION);
        if(!this._basePath) throw new uhc.Exception("Base Path is not specified", uhc.ErrorCodes.INVALID_CONFIGURATION);

        // Bind my own operations
        this._application.options(this._basePath + "/", this.options);

        // Start other resources 
        for(var r in this._resources) {

            // Log
            console.info("Adding instance of " + this._resources[r].constructor.name + " to API");

            // Route information
            var routesInfo = this._resources[r].routes;

            // Bind operations to the router 
            for(var rid in routesInfo.routes) {
                
                var route  = routesInfo.routes[rid];
                route._instance = this._resources[r];
                var path = uhc.Config.api.base + "/" + route.path;
                
                // Bind the HTTP parameters
                for(var httpMethod in route) {

                    var fn = this._application[httpMethod];

                    if(fn && ALLOWED_OPS.indexOf(httpMethod) > -1) 
                    {
                        console.info("\t" + httpMethod + " " + path + " => " + this._resources[r].constructor.name + "." + route[httpMethod].method.name);

                        // This is a stub that will call the user's code, it wraps the 
                        // function from the API class in a common code which will handle
                        // exceptions and return a consistent error object to the caller
                        var pathHandler = new RouteHandler(route);
                        this._application[httpMethod](path, pathHandler.exec);
                    }
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
        if(!resourceInstance.routes) 
            console.warn(resourceInstance.constructor.name + " does not define routes property, will use {base}/" + resourceInstance.constructor.name.toLowerCase());
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
            var causedBy = e instanceof uhc.Exception ?
                e : // exception is already an ErrorResult so we use it
                new uhc.Exception(e, uhc.ErrorCodes.UNKNOWN); // exception is another class 
            
            // Output to error log
            console.error("Error executing options: " + JSON.stringify(causedBy));

            // Send result
            res.status(500).json(
                new uhc.Exception("Error executing OPTIONS", uhc.ErrorCodes.UNKNOWN, causedBy)
            );
        }
    }
}