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

const uhx = require('../uhx'),
    fs = require('fs');
 
/**
 * @class
 * @summary Stellar Federation API resource
 */
class StellarFederationApiResource {

    /**
     * @property
     * @summary Get the routes for this TOML file
     */
    get routes() {
        return {
            "permission_group": null,
            routes : [
                {
                    path: "/.well-known/stellar.toml",
                    get : {
                        method: this.generateToml
                    }
                }
            ]
        }
    }

    /**
     * @method
     * @summary Generate the TOML file for stellar federation
     * @param {Express.Request} req The HTTP request 
     * @param {Express.Response} res The HTTP response
     */
    async generateToml(req, res) {

        // Set CORS
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Cache-Control", "public, max-age=3600");
        res.set("Content-Type", "text/plain");

        // Generate the cache
        if(!this._toml) 
            this._toml = fs.readFileSync("./federation/stellar.toml").toString('utf-8');
        
        var retVal = this._toml;
        
        // Get assets
        var assets = await uhx.Repositories.assetRepository.query();
        retVal += assets.map(o=>
            "[[CURRENCIES]]\r\n" + 
            `code="${o.code}"\r\n` + 
            `issuer="${o.issuer}"\r\n` + 
            `display_decimals=${o.displayDecimals}\r\n` + 
            `name="${o.name}"\r\n` + 
            `desc="${o.description}"\r\n` + 
            `image="${o.imageUrl}"\r\n`
        ).join("\r\n\r\n");

        res.status(200).send(retVal);
        return true;
    }

}

module.exports.StellarFederationApiResource = StellarFederationApiResource;