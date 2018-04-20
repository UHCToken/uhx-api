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
 const ErrorCodes = {
    UNKNOWN : "ERR_UNKNOWN",
    INVALID_CONFIGURATION: "ERR_CONFIGURATION",
    MISSING_PROPERTY: "ERR_MISSING_PROPERTY",
    SECURITY_ERROR: "ERR_SECURITY_ERROR",
    UNAUTHORIZED: "ERR_UNAUTHORIZED",
    NOT_IMPLEMENTED: "ERR_NOTIMPLEMENTED",
    RULES_VIOLATION: "ERR_BUSINESS_RULES"
 }

 /**
  * @enum UHC Permissions
  * @description Permissions
  */
 const SecurityPermissions = {
     EXECUTE : 1,
     READ : 2,
     WRITE : 4,
     RWX : 7,
     LIST: 8,
     SELF : 16
 }

/**
 * @swagger
 * models:
 *  Exception:
 *      id: Exception
 *      properties:
 *          message:
 *              type: String
 *          cause:
 *              type: ErrorResult
 */
  class Exception {
     /**
      * 
      * @param {string} message The human readable message 
      * @param {string} code A codified representation of the message
      * @param {Exception} cause The root cause of this particular error result
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
      * @type {Exception[]}
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

 /**
  * @class
  * @summary Represents a helper class for not implemented features
  */
 class NotImplementedException extends Exception 
 {
     /**
      * @constructor
      * @summary Constructs a new not implemented exception
      */
    constructor() {
        super("Not Implemented", ErrorCodes.NOT_IMPLEMENTED);
    }
 }

 /**
  * @class
  * @summary Represents an exception where one or more business rules have been violated
  */
 class BusinessRuleViolationException extends Exception 
 {

    /**
     * @constructor
     * @param {*} violations The business rules that were violated either as a hash map or list of strings
     */
    constructor(violations) 
    {
        this._violations = violations;

        // Transcribe and call super
        if(Array.isArray(violations)) {
            var causedBy = [];
            for(var i in violations) {
                if(violations[i] instanceof string)
                    causedBy.push(new BusinessRuleViolationException(violations[i]));
                else if(violations[i] instanceof Exception)
                    causedBy.push(violations[i]);
                else if(violations[i].code)
                    causedBy.push(new Exception(violations[i].message, violations[i].code));
            }
            super("Business constraint failed", ErrorCodes.RULES_VIOLATION, causedBy);
        }
        else if(violations)
            super(violations, ErrorCodes.RULES_VIOLATION);
        else
            super("Business constraint failed", Errorcodes.RULES_VIOLATION);
    }
 }

 /**
  * @class
  * @summary Represents the core business logic of the UHC application
  */
 class BusinessLogic {

 }

 // Exports section
 module.exports.Exception = Exception;
 module.exports.NotImplementedException = NotImplementedException;
 module.exports.BusinessRuleViolationException = BusinessRuleViolationException;
 module.exports.ErrorCodes = ErrorCodes;
 module.exports.Permission = SecurityPermissions;
 module.exports.BusinessLogic = BusinessLogic;