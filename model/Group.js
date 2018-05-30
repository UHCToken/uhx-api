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


const ModelBase = require('./ModelBase'),
    uhx = require('../uhx');

/**
 * @class
 * @summary Represents a group of users 
 * @swagger
 * definitions:
 *  Group:
 *      properties:
 *          id: 
 *              type: string
 *              description: The unique identifier for the group
 *          name:
 *              type: string
 *              description: The unique system name for the group
 *          creationTime:
 *               type: Date
 *               description: The time that this user account was created
 *          createdBy:
 *              type: string
 *              description: The identifier of the user which created this group
 *          updatedTime:
 *               type: Date
 *               description: The time that the user account was last updated
 *          updatedBy:
 *              type: string
 *              description: The identifier of the user which created this group
 *          deactivatedTime:
 *               type: Date
 *               description: The time that the user account did or will become deactivated
 *          deactivatedBy:
 *               type: Date
 *               description: The time that the user account did or will become deactivated
 */
module.exports = class Group extends ModelBase{

    /**
     * @constructor
     * @summary Constructs a new instance of the group class
     */
    constructor() {
        super();
        this.fromData = this.fromData.bind(this);
        this.toData = this.toData.bind(this);
    }

    /**
     * @method
     * @summary Converts a data representation of a group to a structure in this instance
     * @param {*} dbGroup The data representation of the group
     */
    fromData(dbGroup) {
        this.id = dbGroup.id;
        this.name = dbGroup.name;
        this.creationTime = dbGroup.creation_time;
        this.createdBy = dbGroup.created_by;
        this.updatedTime = dbGroup.updated_time;
        this.updatedBy = dbGroup.updated_by;
        this.deactivationTime = dbGroup.deactivation_time;
        this.deactivatedBy = dbGroup.deactivated_by;
        return this;
    }

    /**
     * @method
     * @summary Converts this representation of a group to a data structure
     */
    toData() {
        return {
            id: this.id,
            name: this.name
            // No tracking properties are updated here.
        };
    }

}