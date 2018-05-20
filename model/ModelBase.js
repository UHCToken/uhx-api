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
 * @class
 * @summary Represents a base model object
 */
module.exports = class ModelBase {

    /**
     * @constructor
     */
    constructor() {
        this.stripHiddenFields = this.stripHiddenFields.bind(this);
        this.copy = this.copy.bind(this);
        this.summary = this.summary.bind(this);
    }

    /**
     * @private
     * @method
     * @summary Strips hidden fields for JSON from instance
     * @returns {*} An instance with all private fields stripped
     */
    stripHiddenFields(obj) {
        obj = obj || this;
        var retVal = {
            $type : this.constructor.name
        };

        for(var k in this) 
            if(!k.startsWith("_") && !k.startsWith("$"))
                retVal[k] = this[k];

        return retVal;
    }
    
    /**
     * @summary Represet this object as JSON
     */
    toJSON() {
        return this.stripHiddenFields();
    }

    /**
     * @method
     * @summary Gets a summary object
     */
    summary() {
        return this;
    }
    
    /**
     * @method
     * @summary Copy all the values from other into this 
     * @returns {ModelBase} This object with copied fields
     * @param {ModelBase} other The object from which the values for this user should be copied
     */
    copy(other) {
        if(this.fromData) this.fromData({});
        for(var p in this)
            if(!p.startsWith("_"))
                this[p] = other[p] || this[p];
        return this;
    }

}