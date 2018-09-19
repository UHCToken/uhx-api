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
  * @enum UhX API Error Codes
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
    ACCOUNT_LOCKED : "ERR_LOCKED",
    MISSING_PAYLOAD : "ERR_PAYLOAD_MISSING",
    INSUFFICIENT_FUNDS : "ERR_NSF",
    INVALID_ACCOUNT : "ERR_ACCOUNT_UNKNOWN",
    PASSWORD_COMPLEXITY : "ERR_PASSWD_COMPLEXITY",
    INVALID_NAME : "ERR_INVALID_NAME",
    DUPLICATE_NAME : "ERR_DUPLICATE_NAME",
    COM_FAILURE: "ERR_COMMUNICATIONS_FAILURE",
    API_RATE_EXCEEDED : "ERR_RATE_LIMIT_EXCEEDED",
    DATA_ERROR: "ERR_DATA_STOR",
    TFA_REQUIRED: "WRN_TFA_REQUIRED",
    TFA_FAILED: "ERR_TFA_FAILURE",
    NO_OFFER: "ERR_NO_CURRENT_OFFER",
    ASSET_LOCKED: "ERR_ASSET_LOCK",
    AML_CHECK: "ERR_AML_LIMIT_EXCEED",
    EXPIRED: "ERR_EXPIRED",
    DATABASE_ERROR: "ERR_DATABASE",
    FILE_CREATION_ERROR: "ERR_FILE_CREATION",
    ENCRYPTION_ERROR: "ERR_ENCRYPTION"
 }

 /**
  * @enum
  * @description Enumeration of rule severities
  */
 const RuleViolationSeverity = {
     ERROR : "ERROR",
     WARNING : "WARN",
     INFORMATION : "INFO"
 }

 /**
  * @class
  * @summary Represents an exceptional case
 * @swagger
 * definitions:
 *  Exception:
 *      properties:
 *          message:
 *              description: The human readable description of the error
 *              type: string
 *          cause:
 *              $ref: "#/definitions/Exception"
 *          code: 
 *              description: "A codified error message"
 *              type: string
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
         if(Array.isArray(this._cause))
            this._cause = this._cause.filter(o=>o);
            
         return {
             message:this._message,
             code:this._code,
             cause:this._cause && (!Array.isArray(this._cause) ^ this._cause.length) ? this._cause : null
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
    constructor(message) {
        super(message || "Not Implemented", ErrorCodes.NOT_IMPLEMENTED);
    }
 }

 /**
  * @class
  * @summary Represents an argument exception
  */
 class ArgumentException extends Exception {
    constructor(argName) {
        super("Improper argument value for " + argName, ErrorCodes.ARGUMENT_EXCEPTION);
    }
 }

 /**
  * @class
  * @summary Represents a single instance of a rule violation
  */
 class RuleViolation {

    /**
     * @constructor
     * @summary Creates a new instance of the rule violation
     * @param {string} message The message to be shown
     * @param {string} code A codified reason for the violation
     * @param {string} severity The severity of the rule violation
     */
    constructor(message, code, severity) {
        this._message = message;
        this._code = code;
        this._severity = severity;
    }

    /**
     * @method
     * @summary Represent as JSON
     */
    toJSON() {
        return {
            message: this._message,
            code: this._code,
            severity: this._severity
        }
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
        // Transcribe and call super
        if(Array.isArray(violations)) {
            var causedBy = [];
            for(var i in violations) {
                if(violations[i] instanceof String)
                    causedBy.push(new RuleViolation(violations[i], ErrorCodes.UNKNOWN, RuleSeverity.ERROR));
                else if(violations[i] instanceof RuleViolation)
                    causedBy.push(violations[i]);
            }
            super("Business constraint failed", ErrorCodes.RULES_VIOLATION, causedBy);
        }
        else if(violations)
            super(violations, ErrorCodes.RULES_VIOLATION);
        else
            super("Business constraint failed", ErrorCodes.RULES_VIOLATION);
        this._violations = violations;


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
module.exports.RuleViolation = RuleViolation;
module.exports.RuleViolationSeverity = RuleViolationSeverity;
module.exports.ArgumentException = ArgumentException;