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

const uhx = require('../uhx');

/**
  * @class
  * @summary Provides helper methods for dealing with model classes
  */
module.exports = class ModelUtil {

    /**
     * @method
     * @summary Generate update SET statement
     * @param {*} modelObject Represents the model object to generate update text for
     * @param {string} tableName The index of parameters 
     * @param {string} timestampColumn The name of the update timestamp column to insert
     * @returns {Object} The SET portion of a SQL update and an array of parameters
     */
    generateUpdate(modelObject, tableName, timestampColumn) {
        var dbModel = modelObject.toData ? modelObject.toData() : modelObject;

        var updateSet = "", parmId = 1, parameters = [], whereClause = "";
        for(var k in dbModel) 
            {

                if(k == "id")
                    whereClause += `${k} = $${parmId++}`;
                else if(k.startsWith("$"))
                    updateSet += `${k.substring(1)} = crypt($${parmId++}, gen_salt('bf')), `;
                else if(dbModel[k] !== undefined)
                    updateSet += `${k} = $${parmId++}, `;
                
                if(dbModel[k]  !== undefined)
                    parameters.push(dbModel[k]);
            }

        // Append timestamp?
        if(timestampColumn)
            updateSet += ` ${timestampColumn} = CURRENT_TIMESTAMP`;    
        else
            updateSet = updateSet.substr(0, updateSet.length - 2);
            
        var retVal = {
            sql: `UPDATE ${tableName} SET ${updateSet} WHERE ${whereClause} RETURNING *`,
            args : parameters
        };
        uhx.log.debug(`Generated update : ${retVal.sql}`);
        return retVal;
    }

    /**
     * @method
     * @summary Generate a select statement
     * @param {*} filter The query filter to be created
     * @param {string} tableName The name of the database table to query
     * @param {number} offset The starting record number
     * @param {number} count The number of records to return
     * @param {*} order The order control 
     * @param {string} order.order The ordering (asc or desc)
     * @param {Array} order.col The columns to sort on
     * @param {Array} columns Columns to select 
     */
    generateSelect(filter, tableName, offset, count, order, columns) {
        var dbModel = filter.toData ? filter.toData() : filter;

        var parmId = 1, parameters = [], whereClause = "";
        for(var k in dbModel) 
            if(dbModel[k] !== undefined &&
                dbModel[k] !== null) {
                
                if(dbModel[k] == "null")
                    whereClause += `${k} IS NULL AND `;
                else {
                    var op = "=";
                    if(dbModel[k].indexOf && dbModel[k].indexOf("*") > -1)
                    {
                        op = "ILIKE";
                        dbModel[k] = dbModel[k].replace(/\*/g, '%');
                    }
                    whereClause += `${k} ${op} $${parmId++} AND `;
                    parameters.push(dbModel[k]);
                }
            }
            
        // Strip last AND
        if(whereClause.endsWith("AND "))
            whereClause = "WHERE " + whereClause.substring(0, whereClause.length - 4);
        else if(whereClause.trim() == "")
            whereClause = "";

        // Order? 
        var control = "";
        if(order) 
            control += `ORDER BY ${order.col.join(` ${order.order} ,`)} ${order.order} `;
        if(offset)
            control += `OFFSET ${offset} `;
        if(count)
            control += `LIMIT ${count} `;
        else 
            control += "LIMIT 100";

        // Join
        if(Array.isArray(tableName))
        {
            var join = "";
            for(var i in tableName) {
                join += tableName[i];
                if(i > 0)
                    join += " USING(id) ";
                join += " LEFT JOIN ";
            }
            tableName = join.substr(0, join.length - 10);
        }
        
        var retVal = {
            sql: `SELECT DISTINCT ${columns ? columns.join(",") : "*"} FROM ${tableName} ${whereClause} ${control}`,
            args : parameters
        };
        uhx.log.debug(`Generated select : ${retVal.sql}`);
        return retVal;

    }

    /**
     * @method
     * @summary Generate the column names and values portions of an insert statement
     * @param {*} modelObject Represents the model object to generate the insert text for
     * @param {string} tableName The name of the table to insert into
     * @returns {Object} The column and values tuple for the insert statement
     */
    generateInsert(modelObject, tableName) {

        var dbModel = modelObject.toData ? modelObject.toData() : modelObject;
        var parmId = 1, colNames = "", values = "", parameters = [];
        for(var k in dbModel) {
            var val = dbModel[k];
            if(val !== undefined) {

                if(k.startsWith("$")) {
                    colNames += `${k.substring(1)},`;
                    values += `crypt($${parmId++}, gen_salt('bf')),`;
                }
                else {
                    colNames += `${k},`;
                    values += `$${parmId++},`;
                }
                parameters.push(val);
            }
        }

        var retVal = {
            sql: `INSERT INTO ${tableName} (${colNames.substring(0, colNames.length - 1)}) VALUES (${values.substring(0, values.length - 1)}) RETURNING *`,
            args: parameters
        };
        uhx.log.debug(`Generated insert : ${retVal.sql}`);
        return retVal;

    }
 }
