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

 const uhc = require('../uhc'),
  exception = require('../exception'),
  security = require('../security'),
  jwt = require('jsonwebtoken');

 const TOKEN_TYPE_JWT = "bearer";

 /**
  * @class
  * @summary Represents an OAUTH2 Error Response
  * @swagger
  * definitions:
  *   OAuthErrorResult:
  *     properties:
  *       error:
  *         type: string
  *         description: The codified error message
  *       error_description:
  *         type: string
  *         description: A human readable error message
  */
 class OAuthErrorResult {
   /**
    * 
    * @param {string} error An error code describing the issue 
    * @param {string} description A human readable description of the issue
    */
  constructor(error, description) {
    this._error = error;
    this._description = description;
  }
  /**
   * @property error
   * @summary Gets the error code
   * @type {string}
   */
  get error() {
    return this._error;
  }
  /**
   * @property description
   * @summary Get the human readable description of the error
   * @type {string}
   */
  get description() {
    return this._description;
  }
  /**
   * @method
   * @summary Represent this object as JSON
   */
  toJSON() {
    return {
      error: this._error,
      error_description: this._description
    }
  }
 }
 /**
  * @class 
  * @summary Represents an OAUTH2 Token Response
  * @swagger
  * definitions:
  *   OAuthTokenResult:
  *     properties:
  *       token:
  *         type: string
  *         description: The token that was issued to the client
  *       tokenType:
  *         type: string
  *         description: The type of token that was issued (Default is JWT)
  *       expiresIn:
  *         type: number
  *         description: The number of seconds before this session expires
  *       refreshToken:
  *         type: string
  *         description: A token that can be used for a refresh of this session
  */
 class OAuthTokenResult {
   /**
    * @constructor
    * @param {stirng} token The issued token 
    * @param {string} tokenType The type of token being issued
    * @param {number} expiresIn Identifies the time in MS that the token will expire
    * @param {string} refreshToken A token which can be used to refresh this session
    */
    constructor(token, tokenType, expiresIn, refreshToken) {
      this._token = token;
      this._tokenType = tokenType;
      this._expiresIn = expiresIn;
      this._refreshToken = refreshToken;
    }
    /**
     * @property token
     * @type {string}
     * @summary Gets the issued token
     */
    get token() {
      return this._token;
    }
    /**
     * @property tokenType
     * @summary Gets the type of token
     * @type {string}
     */
    get tokenType() {
      return this._tokenType;
    }
    /**
     * @property expiresIn
     * @summary Gets the time (in epoch) that this token is valid
     * @type {number}
     */
    get expiresIn() {
      return this._expiresIn;
    }
    /**
     * @property refreshToken
     * @summary Gets the refresh token
     * @type {string}
     */
    get refreshToken() {
      return this._refreshToken;
    }
    /**
     * @summary Represents this object as a JSON object
     */
    toJSON() {
      return {
        access_token: this._token,
        token_type: this._tokenType,
        expires_in: this._expiresIn,
        refresh_token: this._refreshToken
      };
    }
 }

 /**
  * @class
  * @summary Represents the OAUTH2 Token Service 
  * @swagger
  * tags:
  *   - name: "auth"
  *     description: "Represents the authorization for using methods on this service"
  */
 class OAuthTokenService {
    /**
      * @constructor
      */
    constructor() {
        
    }
    /**
     * @property
     * @summary Gets the paths on which this class should be routed
     */
    get routes() {
      return {
        "permission_group" : "oauth",
        "routes" : [
          {
            "path": "auth/oauth2_token",
            "post" : {
              "demand" : security.PermissionType.EXECUTE,
              "method":this.post 
            }
          }
        ]           
      }
    }

    /**
     * @method
     * @summary Overrides the underlying API authentication to use HTTP-Basic or client_id and client_secret body parameters
     * @param {Express.Request} req The request object
     * @param {Express.Response} res The response object
     */
    async authorize(req, res) {
      // Authorization is done via HTTP basic
      var authHeader = req.get("Authorization");
      var clientAuthentication = [];

      if(authHeader) {
        var authParts = authHeader.split(' ');
        if(authParts.length != 2 || authParts[0].toLowerCase() != "basic")
          throw new exception.Exception("Invalid authentication scheme used", exception.ErrorCodes.SECURITY_ERROR);
        else { // Authorization is good
          var clientAuthentication = Buffer(authParts[1], 'base64').toString('ascii').split(':');
        }
      }
      else { // There is no authorization, is it in the body as client_id and client_secret
        clientAuthentication = [req.param("client_id"), req.param("client_secret")];
      }

      // Authorization
      if(!clientAuthentication[0] || !clientAuthentication[1])
        throw new exception.Exception("Either Authorization HTTP header or client_id/client_secret must be specified. See RFC6749", exception.ErrorCodes.SECURITY_ERROR);

      var principal = await uhc.SecurityLogic.authenticateClientApplication(clientAuthentication[0], clientAuthentication[1]);
      req.principal = principal;

      return principal !== undefined;

    }

    /**
     * @method
     * @summary OAUTH 2.0 Token Service 
     * @param {*} req The request object
     * @param {*} res The response object
     * @swagger
     * /auth/oauth2_token:
     *  post:
     *    description: OAUTH 2.0 token service for authentication. This service returns a JWT token
     *    tags: [auth]
     *    produces:
     *      - application/json
     *    parameters:
     *      - name: grant_type
     *        description: The type of grant (code and password supported)
     *        in: formData
     *        required: true
     *        type: string
     *        enum: 
     *          - password
     *          - refresh_token
     *          - client_credentials
     *          - authorization_code
     *      - name: username
     *        description: The e-mail address of the UHC user
     *        in: formData
     *        required: false
     *        type: string
     *      - name: password
     *        description: The user's current password
     *        in: formData
     *        required: false
     *        type: string
     *      - name: scope
     *        description: The requested scope of the token
     *        in: formData
     *        required: false
     *        type: string
     *      - name: client_id
     *        description: The client application which is requesting the token
     *        in: formData
     *        required: true
     *        type: string
     *      - name: client_secret
     *        description: The client application secret which is requesting the token
     *        in: formData
     *        required: true
     *        type: string
     *      - name: refresh_token
     *        description: If this is a refresh_token grant type then this is the refresh token
     *        in: formData
     *        required: false
     *        type: string
     *      - name: tfa_secret
     *        description: The user's TFA secret
     *        in: formData
     *        required: false
     *        type: string
     *    responses:
     *          200: 
     *             description: "Authentication was successful"
     *             schema: 
     *                  $ref: "#/definitions/OAuthTokenResult"
     *          400:
     *              description: "Authorization was unsuccessful"
     *              schema: 
     *                  $ref: "#/definitions/OAuthErrorResult"
     */
    async post(req, res) {
      // HACK: The majority of work has been done on the authorization() method
      var principal = req.principal;

      var userPrincipal = null;
    
      // GRANT TYPE
      switch(req.param("grant_type")){
        case "password":
          userPrincipal = await uhc.SecurityLogic.establishSession(principal, req.param("username"), req.param("password"), req.param("scope") || "*", req.body.tfa_secret, req.ip);
          break;
        case "refresh_token":
          userPrincipal = await uhc.SecurityLogic.refreshSession(principal, req.param("refresh_token"), req.ip);
          break;
        case "client_credentials":
          userPrincipal = await uhc.SecurityLogic.establishClientSession(principal, req.param("scope") || "*", req.ip);
          break;
        case "authorization_code":
          break;
        default:
          throw new exception.NotSupportedException("Non supported grant type");
      }

      var payload = userPrincipal.toJSON();
      payload.iss = uhc.Config.security.tokenServiceUri;
      var retVal = new OAuthTokenResult(jwt.sign(payload, uhc.Config.security.hmac256secret), TOKEN_TYPE_JWT,  Math.floor(payload.exp - (new Date().getTime() / 1000)), userPrincipal.session.refreshToken);

      res.status(200).json(retVal);
      return true;
    }
    /**
     * Custom exception handler for OAUTH
     * @param {*} e The exception to be handled 
     */
    async error(e, res) {
      uhc.log.error(`Error executing OAUTH: ${JSON.stringify(e)} `);
      if(e instanceof exception.Exception)
        res.status(400).json(new OAuthErrorResult(e.code, e.message));
      else
        res.status(400).json(new OAuthErrorResult(exception.ErrorCodes.SECURITY_ERROR, e.message || e));
    }
 }

 // Module exports
 module.exports.OAuthTokenService = OAuthTokenService;