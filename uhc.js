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
 * This file contains the main business logic for the UHC API
 * 
 */

 module.exports.Config = require('./config');

 /**
  * @enum UHC API Error Codes
  * @description This is used to expose common error codes 
  */
 module.exports.ErrorCodes = {
    UNKNOWN : "ERR_UNKNOWN",
    INVALID_CONFIGURATION: "ERR_CONFIGURATION",
    MISSING_PROPERTY: "ERR_MISSING_PROPERTY",
    SECURITY_ERROR: "ERR_SECURITY_ERROR",
    UNAUTHORIZED: "ERR_UNAUTHORIZED"
 }

/**
 * @swagger
 * models:
 *  ErrorResult:
 *      id: ErrorResult
 *      properties:
 *          message:
 *              type: String
 *          cause:
 *              type: ErrorResult
 */
 module.exports.ErrorResult = class ErrorResult {
     /**
      * 
      * @param {string} message The human readable message 
      * @param {string} code A codified representation of the message
      * @param {ErrorResult} cause The root cause of this particular error result
      */
     constructor(message, code, cause) {
         this._message = message;
         this._code = code;

         if(Array.isArray(cause))
            this._cause = cause;
        else
            this._cause = [cause];
     }
     /**
      * @property message
      * @summary Gets the human readable message for th error result
      * @type {string}
      */
     get message() {
         return this._message;
     }
     /**
      * @property cause
      * @summary Gets a list of ErrorResults which may have caused this error to occur
      * @type {ErrorResult[]}
      */
     get cause() {
         return this._cause;
     }
     /**
      * @property code
      * @summary Gets the codified error for this result
      * @type {string}
      */
     get code() {
         return this._code;
     }
     toJSON() {
         return {
             message:this._message,
             code:this._code,
             cause:this._cause
         };
     }
 }
