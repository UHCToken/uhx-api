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
    NOT_SUPPORTED: "ERR_NOTSUPPORTED",
    RULES_VIOLATION: "ERR_BUSINESS_RULES",
    ARGUMENT_EXCEPTION: "ERR_ARGUMENT",
    NOT_FOUND: "ERR_NOTFOUND",
    ACCOUNT_LOCKED : "ERR_LOCKED"
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
            super("Business constraint failed", ErrorCodes.RULES_VIOLATION);
    }
 }

 /**
  * @class 
  * @summary Indicates a resource could not be found
  */
 class NotFoundException extends Exception {

    /**
     * @constructor
     * @summary Creates a new instance of the NotFoundException
     * @param {string} objectType The type of object that was not found
     * @param {string} objectId The identifier of the object
     */
    constructor(objectType, objectId) {
        super(`${objectType} with id ${objectId} was not found`, ErrorCodes.NOT_FOUND);
    }
 }

 /**
  * @class
  * @summary Signifies an exceptional case where the requested operation cannot be performed
  */
 class NotSupportedException extends Exception {
    /**
     * @constructor
     * @summary Creates a new instance of the NotSupportedException
     */
    constructor(message) {
        super(message || "Operation not supported", ErrorCodes.NOT_SUPPORTED);
    }
 }

// Exports
module.exports.Exception = Exception;
module.exports.NotImplementedException = NotImplementedException;
module.exports.BusinessRuleViolationException = BusinessRuleViolationException;
module.exports.ErrorCodes = ErrorCodes;
module.exports.NotFoundException = NotFoundException;
module.exports.NotSupportedException = NotSupportedException;