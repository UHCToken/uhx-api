/// <Reference path="../model/model.js"/>
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
 * This file contains the user repository which is the glue logic between the database and 
 * business objects
 * 
 */
 
const pg = require('pg'),
    exception = require('../exception'),
    model = require('../model/model');

    /**
  * @class
  * @summary Represents the user repository logic
  */
 module.exports = class ApplicationRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getByNameSecret = this.getByNameSecret.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific user from the database
     * @param {uuid} id Gets the specified session
     * @returns {Application} The fetched application
     */
    async get(id) {

        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM applications WHERE id = $1", [id]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException('applications', id);
            else
                return new model.Application().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }

    }

    /**
     * @method
     * @summary Get the application information by using the id and secret
     * @param {string} clientId The identifier of the client 
     * @param {string} clientSecret The secret for the client
     * @returns {Application} The fetched application
     */
    async getByNameSecret(clientId, clientSecret) {
        
        const dbc = new pg.Client(this._connectionString);
        try {
            await dbc.connect();

            const rdr = await dbc.query("SELECT * FROM applications WHERE name = $1 AND secret = crypt($2, secret)", [ clientId, clientSecret ]);
            if(rdr.rows.length == 0)
                throw new exception.NotFoundException("application", clientId);
            else
                return new model.Application().fromData(rdr.rows[0]);
        }
        finally {
            dbc.end();
        }
    }
 }
