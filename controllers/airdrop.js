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

 const uhc = require('../uhc'),
    security = require('../security'),
    exception = require('../exception'),
    Airdrop = require('../model/Airdrop');

  /**
   * @class
   * @summary Represents a resource to fetch assets
   * @swagger
   * tags:
   *    - name: airdrop
   *      description: Resource for planning airdrops
   */
module.exports.AirdropApiResource = class AirdropApiResource {

    /**
     * @property {*}
     */
    get routes() {
        return {
            "permission_group": "transaction",
            "routes": [
                {
                    "path": "asset/:id/airdrop",
                    "post": {
                        "demand": security.PermissionType.EXECUTE,
                        "method": this.post
                    }
                }
            ]
        }
    }

    /**
     * @method
     * @summary Plans a new airdrop returning the transactions that need to occur
     * @param {Express.Request} req The HTTP request object
     * @param {Express.Response} res The HTTP response object
     * @swagger
     * /asset/{assetid}/airdrop:
     *  post:
     *      tags:
     *      - airdrop
     *      description: Plans an stages an airdrop
     *      parameters:
     *          - name: assetid
     *            in: path
     *            description: The asset for which an airdrop is to be planned
     *            type: string
     *            required: true
     *          - name: body
     *            in: body
     *            description: Details about the airdrop
     *            schema: 
     *              $ref: "#/definitions/Airdrop"
     *      responses:
     *          200: 
     *              description: "The airdrop was planned successfully"
     *              schema:
     *                  multiple: true
     *                  $ref: "#/definitions/Airdrop"
     *          422: 
     *              description: "A business rule was violated which prevents the creation of the airdrop"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *          500: 
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *          - uhc_auth:
     *              - "execute:transaction"
     *              - "write:transaction"
     */
    async post(req, res) {

        if(!req.body.distribution)
            throw new exception.ArgumentException("distribution missing");
        
        var airdrop = await uhc.TokenLogic.planAirdrop(new Airdrop().copy(req.body), req.principal);
        airdrop.plan.forEach(t=>{
            t._payor = null;
            t._payee = t.payee.summary();
        });
        res.status(200).json(airdrop);
        return true;
    }
}