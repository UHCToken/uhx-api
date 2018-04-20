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
 * This file contains implementation of the OAUTH 2.0 IdP for UHC API
 * 
 */

 const uhc = require('../uhc');

 const TOKEN_TYPE_JWT = "urn:ietf:params:oauth:token-type:jwt";

 /**
  * @class
  * @summary Represents an OAUTH2 Error Response
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
              "demand" : uhc.Permission.EXECUTE,
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
    authorize(req, res) {
      throw new uhc.NotImplementedException();
    }
    /**
     * @method
     * @summary OAUTH 2.0 Token Service 
     * @param {*} req The request object
     * @param {*} res The response object
     * @swagger
     * /api/v1/auth/oauth2_token
     * post:
     *    description: OAUTH 2.0 token service for authentication. This service returns a JWT token
     *    tags: [OAuth]
     *    produces:
     *      - application/json
     *    parameters:
     *      - name: grant_type
     *        description: The type of grant (code and password supported)
     *        in: formData
     *        required: true
     *        type: string
     *      - name: username
     *        description: The e-mail address of the UHC user
     *        in: formData
     *        required: true
     *        type: string
     *      - name: password
     *        description: The user's current password
     *        in: formData
     *        required: true
     *        type: string
     *      - name: scope
     *        description: The requested scope of the token
     *        in: formData
     *        required: true
     *        type: string
     */
    post(req, res) {
      throw new uhc.NotImplementedException();
    }
    /**
     * Custom exception handler for OAUTH
     * @param {*} e The exception to be handled 
     */
    error(e, res) {
      if(e instanceof uhc.Exception)
        res.status(400).json(new OAuthErrorResult(e.code, e.message));
      else
        res.status(400).json(new OAuthErrorResult(uhc.ErrorCodes.SECURITY_ERROR, e));
    }
 }

 // Module exports
 module.exports.OAuthTokenService = OAuthTokenService;