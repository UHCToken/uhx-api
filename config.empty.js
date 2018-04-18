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
 * This file contains configuration values for the UHC API
 * 
 */

 /**
  * @class UHC API Configuration
  * @description Configuration parameters for the stellar API
  */
 module.exports = {
     /**
      * @summary Groups configuration flags related to UHC database API
      */
     db : {
         /**
          * @summary The location of the PostgreSQL database server
          */
        server: 'postgres://postgres:postgres@localhost:5432/dbname'
     },
     /**
      * @summary Groups configuration related to the STRIPE payment network
      */
     stripe: {
         /**
          * @summary The STRIPE API access key
          */
         key: "XXXXX"
     },
     /**
      * @summary Configuration parameters for the API
      */
     api: {
         /**
          * @summary The port on which the API will listen
          */
         port: 4001,
         /**
          * @summary The base URL on which the API will listen
          */
         base: "api/v1"
     },
     /**
      * @summary Configuration settings related to interaction with the stellar network
      */
     stellar: {
         /**
          * @summary The issuer public key
          */
         issuer: "GXXXXXX"
     }
 }