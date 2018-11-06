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
 security = require('../security'),
  exception = require('../exception');

  /**
   * @class
   * @summary A specialized resource for fetching statistics
   * @swagger
   * tags:
   *    - name: "stats"
   *      description: Tools for running reports against the UHX API
   */
class StatisticsApiResource {

    /**
     * @property 
     * @summary Get all routes on this resource
     */
    get routes() {
        return {
            permission_group: "reporting",
            routes: [
                {
                    "path": "reports",
                    "get": {
                        demand: security.PermissionType.LIST,
                        method: this.getReports
                    }
                },
                {
                    "path": "reports/:id.:format",
                    "get" : {
                        demand: security.PermissionType.EXECUTE,
                        method: this.runReport
                    }
                }
            ]
        }
    }

    /**
     * @method
     * @summary List all registered reports
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /reports:
     *  get:
     *      tags:
     *      - "stats"
     *      description: Lists all reports on this service
     *      produces: 
     *      - "application/json"
     *      parameters:
     *          - name: "name"
     *            in: "query"
     *            description: "The name of the report to search for"
     *            type: "string"
     *            required: false
     *      responses:
     *          200:
     *              description: The query was successful
     *              schema:
     *                  properties:
     *                      name: 
     *                          type: string
     *                          description: The name of the report
     *                      id: 
     *                          type: string
     *                          description: The ID of the report
     *                      description:    
     *                          type: string
     *                          description: A short description of the report
     *          500:
     *              description: An internal server error occurred
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "list:reporting"          
     */
    async getReports(req, res) {
        res.status(200).json(await uhx.Repositories.reportRepository.query(req.query, req.query._offset, req.query._count));
        return true;
    }

    /**
     * @method
     * @summary Runs a report on this instance
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @swagger
     * /reports/{reportId}.{reportFormat}:
     *  get:
     *      tags:
     *      - "stats"
     *      description: Executes the specified report identifier
     *      produces: 
     *      - "application/json"
     *      parameters:
     *          - in: path
     *            name: reportId
     *            description: The id of the report to run
     *            type: string
     *          - in: path
     *            name: reportFormat
     *            description: >
     *              The desired format of the report output:
     *               * `csv` - Comma separated values
     *               * `htm` - HTML with header
     *               * `json` - JSON format
     *            type: string
     *            enum: [ csv, htm, json ]
     *      responses:
     *          200:
     *              description: The report was generated was successfully
     *          500:
     *              description: An internal server error occurred
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "execute:reporting"          
     */
    async runReport(req, res) {

        var reportData = await uhx.Repositories.reportRepository.execute(req.params.id, req.query, req.query._offset, req.query._count);
        switch(req.params.format) {
            case "htm":
            case "txt":
                if(!reportData.data)
                    res.status(200).send();
                
                var out = `<h1>${reportData.name}</h1><small>${reportData.description}</small><table border=1><tr>`;
                out += Object.keys(reportData.data[0]).map((h)=>`<th>${h}</th>`).join('');
                out += "</tr>";
                out += reportData.data.map((r)=> 
                    `<tr>${Object.keys(r).map((k)=>`<td>${r[k]}</td>`).join('')}</tr>`
                );
                out += "</table>";
                res.set("Content-Disposition", 'attachment; filename="report.html"');
                res.status(200).send(out);
                return true;
            case "csv":
                if(!reportData.data)
                    res.status(200).send();
                
                var out = Object.keys(reportData.data[0]).join(",") + "\r\n";
                reportData.data.forEach((r)=> {
                    var row = [];
                    Object.keys(r).forEach((k)=>row.push(r[k]));
                    out += row.join(",") + "\r\n";
                });
                res.set("Content-Disposition", 'attachment; filename="report.csv"');
                res.status(200).send(out);
                return true;
            case "json":
                res.status(200).json(reportData);
                return true;
        }
        return false;
    }
}

module.exports.StatisticsApiResource = StatisticsApiResource;
