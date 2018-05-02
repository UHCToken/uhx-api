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

// HTTP operations that are premitted
const ALLOWED_OPS = [ 'use', 'options', 'get', 'post', 'put', 'delete' ];

const uhc = require("./uhc"),
    security = require("./security"),
    jwt = require('jsonwebtoken'),
    express = require('express'),
    exception = require('./exception');
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
    async checkAccessCore(req, res) {
            
        // Get the security map
        if(!req.route) return true; // no route defined
        var permissionSet = [
            this._routeInfo._instance.routes.permission_group,
            this._routeInfo[req.method.toLowerCase()].demand
        ];

        // First, is the method open?
        if(!permissionSet || !permissionSet[1])
            return true;
        else // it isn't and must be authenticated
        {
            var authHeader = req.get('Authorization');

            // No auth header?
            if(!authHeader) {
                res.setHeader("WWW-Authenticate", `Bearer authorization_uri="${uhc.Config.security.tokenServiceUri}"`);
                // TODO: Send to auth service
                throw new exception.Exception("Missing authorization header", exception.ErrorCodes.UNAUTHORIZED);
            }
            else { // Auth header is present, validate it
                var authParts = authHeader.split(" ");

                // Verify that the authorization is bearer based and that it is a JWT token
                try {
                    if(authParts[0].trim().toLowerCase() != "bearer" &&
                        authParts[0].trim().toLowerCase() != "urn:ietf:params:oauth:token-type:jwt")
                        throw new exception.Exception("Invalid type of authorization provided, this service expects Bearer", exception.ErrorCodes.SECURITY_ERROR);
                    else if(!authParts[1] || authParts[1].split(".").length != 3)
                        throw new exception.Exception("Invalid bearer token format, this service expects IETF RFC 7519 format tokens", exception.ErrorCodes.SECURITY_ERROR);
                    else { // Validate the jwt
                        var token = jwt.verify(authParts[1], uhc.Config.security.hmac256secret);
                        
                        // Now we want to create a principal from the token
                        var principal = new security.JwtPrincipal(token, true);

                        req.principal = principal;
                        
                        // TODO: Check the grants!
                        if(new security.Permission(permissionSet[0], permissionSet[1]).demand(principal)) // we have permission granted 
                            return this._routeInfo._instance.acl ? this._routeInfo._instance.acl(principal, req) : true; // if the method provides additional ACL constraints then run them 
                            
                    }
                }
                catch(e) {
                    console.error(`Error validting security - ${e}`);
                    if(e instanceof exception.Exception)
                        throw new exception.Exception("Error validating security", exception.ErrorCodes.SECURITY_ERROR, e);
                    else 
                        throw new exception.Exception("Error validating security", exception.ErrorCodes.SECURITY_ERROR, new exception.Exception(e, exception.ErrorCodes.UNKNOWN));
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
            if(this._routeInfo._instance.authorize && await this._routeInfo._instance.authorize(req, res) ||
                await this.checkAccessCore(req, res))
                {
                    var result = await this._routeInfo[req.method.toLowerCase()].method(req, res);
                    if(!result)
                        res.status(204).send();
                }
            else
                throw new exception.Exception("Authentication failure", exception.ErrorCodes.SECURITY_ERROR);
        }
        catch(e) {
            if(this._routeInfo._instance.error)
                await this._routeInfo._instance.error(e, res);
            else {
                // If the exception is not already an error result then we want to wrap it in one
                var retVal = e;
                if(retVal instanceof exception.Exception)
                    retVal = e;
                else if(e.message)
                    retVal = new exception.Exception(e.message, exception.ErrorCodes.UNKNOWN);
                else
                    retVal = new exception.Exception(e, exception.ErrorCodes.UNKNOWN);
                
                // Set appropriate status code
                var httpStatusCode = 500;
                switch(retVal.code) {
                    case exception.ErrorCodes.NOT_IMPLEMENTED:
                        httpStatusCode = 501;
                        break;
                    case exception.ErrorCodes.SECURITY_ERROR:
                        httpStatusCode = 403;
                        break;
                    case exception.ErrorCodes.UNAUTHORIZED:
                        httpStatusCode = 401;
                        break;
                    case exception.ErrorCodes.ARGUMENT_EXCEPTION:
                    case exception.ErrorCodes.MISSING_PROPERTY:
                    case exception.ErrorCodes.RULES_VIOLATION:
                        httpStatusCode = 422;
                        break;
                    case exception.ErrorCodes.NOT_FOUND:
                        httpStatusCode = 404;
                        break;
                    case exception.ErrorCodes.API_RATE_EXCEEDED:
                        httpStatusCode = 429;
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
 class RestApi {

    /**
     * Constructs a new API instance and attaches it to the specified application
     * @param {string} basePath Identifies the base path which this API should operate on
     * @param {Express.Application} app The Express router to attach this router to
     */
    constructor(basePath, app) {
        this._application = app;
        this._basePath = basePath;
        this._resources = [];
        this.options = this.options.bind(this);
    }
    /**
     * @summary When called, will attach the CORS handler to the api application
     */
    enableCors() {
        // Verify configuration
        if(!this._application) throw new exception.Exception("Application is not specified", exception.ErrorCodes.INVALID_CONFIGURATION);

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
        if(!this._application) throw new exception.Exception("Application is not specified", exception.ErrorCodes.INVALID_CONFIGURATION);
        if(!this._basePath) throw new exception.Exception("Base Path is not specified", exception.ErrorCodes.INVALID_CONFIGURATION);

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
     * /:
     *  options:
     *      summary: Gets the operations uspported on this UHC API instance
     *      description: "Note: When the session is authenticated this resource will only show routes which the authenticated user has access to"
     *      responses:
     *          200:
     *              description: Options operation was successful
     *              schema:
     *                  properties:
     *                      version:
     *                          type: string
     *                          description: The version of the API being reported
     *                      routes:
     *                          description: The routing information for the API resources available
     *                                      
     */
    async options(req, res) {
        try {
            // Get the routes on this service

            var retVal = {
                api_version: "1.0-alpha",
                routes: []
            };
            this._resources.forEach((o)=>{
                o.routes.routes.forEach((r) => {
                    
                    retVal.routes.push({
                        path: r.path, 
                        permission_group: o.permission_group,
                        get: r.get,
                        delete: r.delete,
                        options: r.options,
                        put: r.put,
                        post: r.post
                    });
                })
            });
            res.status(200).json(retVal);
            return true;
        }
        catch(e) {
            // Construct error result
            var causedBy = e instanceof exception.Exception ?
                e : // exception is already an ErrorResult so we use it
                new exception.Exception(e, exception.ErrorCodes.UNKNOWN); // exception is another class 
            
            // Output to error log
            console.error("Error executing options: " + JSON.stringify(causedBy));

            // Send result
            res.status(500).json(
                new exception.Exception("Error executing OPTIONS", exception.ErrorCodes.UNKNOWN, causedBy)
            );
        }
    }
}

// Module exports
module.exports.RestApi = RestApi;