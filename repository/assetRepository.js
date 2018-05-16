/// <Reference path="../model/model.js"/>
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

const pg = require('pg'),
    exception = require('../exception'),
    security = require('../security'),
    model = require('../model/model'),
    Asset = require('../model/Asset'),
    AssetQuote = require('../model/AssetQuote'),
    Offer = require('../model/Offer');

/**
 * @class
 * @summary Represents the asset data repository logic
 */
module.exports = class AsssetRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.insert = this.insert.bind(this);
        this.query = this.query.bind(this);
        this.lock = this.lock.bind(this);
        this.unlock = this.unlock.bind(this);
        this.insertOffer = this.insertOffer.bind(this);
        this.removeOffer = this.removeOffer.bind(this);
        this.getOffers = this.getOffers.bind(this);
        this.getActiveOffer = this.getActiveOffer.bind(this);
        this.updateOffer = this.updateOffer.bind(this);
        this.insertQuote = this.insertQuote.bind(this);
        this.getQuote = this.getQuote.bind(this);
        this.getByPublicAddress = this.getByPublicAddress.bind(this);
    }

    /**
     * @method
     * @summary Inserts the specified asset into the database
     * @param {Asset} asset The asset to be inserted
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transaction to run this in
     * @returns {Asset} The inserted asset
     */
    async insert(asset, runAs, _txc) {

        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbAsset = asset.toData();
            dbAsset.created_by = runAs.session.userId;
            var insertCmd = model.Utils.generateInsert(dbAsset, "assets");
            // Insert the asset
            var rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not insert asset", exception.ErrorCodes.DATA_ERROR);
            else
                return asset.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Locks the specified asset from sale
     * @param {string} assetId The ID of the asset to lock
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transactional client
     * @returns {Asset} The locked asset
     */
    async lock(assetId, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Update the asset
            var rdr = await dbc.query("UPDATE assets SET locked = TRUE, updated_by = $1, updated_time = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *", [runAs.session.userId, assetId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not lock asset", exception.ErrorCodes.DATA_ERROR);
            else
                return new Asset().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Unlocks the specified asset from sale
     * @param {string} assetId The ID of the asset to lock
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transactional client
     * @returns {Asset} The locked asset
     */
    async unlock(assetId, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Update the asset
            var rdr = await dbc.query("UPDATE assets SET locked = FALSE, updated_by = $1, updated_time = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *", [runAs.session.userId, assetId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not unlock asset", exception.ErrorCodes.DATA_ERROR);
            else
                return new Asset().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Adds an asset offer to the specified asset
     * @param {string} assetId The ID of the asset to lock
     * @param {Offer} offer The offer of the asset to be inserted
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transactional client
     * @returns {Offer} The inserted asset sale
     */
    async insertOffer(assetId, offer, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Insert the asset sale
            var dbOffer = offer.toData();
            dbOffer.created_by = runAs.session.userId;
            dbOffer.asset_id = assetId;
            var insertCmd = model.Utils.generateInsert(dbOffer, "asset_offer");
            // Insert the asset sale
            var rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not insert asset offer", exception.ErrorCodes.DATA_ERROR);
            else
                return offer.fromData(rdr.rows[0]); 
        }
        catch(e) {
            switch(e.constraint || null) {
                case "ck_asset_sale_sell":
                    throw new exception.BusinessRuleViolationException(new exception.RuleViolation(`Start date exceeds stop date of offer for ${JSON.stringify(offer.price)}`, exception.ErrorCodes.ARGUMENT_EXCEPTION, exception.RuleViolationSeverity.ERROR));
                default:
                    throw e;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }
    
    /**
     * @method
     * @summary Deletes an asset offer to the specified asset
     * @param {string} offerId The offer of the asset to be removed
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transactional client
     * @returns {Offer} The removed asset offer
     */
    async removeOffer(offerId, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Delete the asset sale
            var rdr = await dbc.query("UPDATE asset_offer SET deactivated_time = CURRENT_TIMESTAMP, deactivated_by = $1 WHERE id = $2 RETURNING *", [ runAs.session.userId, offerId ]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not delete asset offer", exception.ErrorCodes.DATA_ERROR);
            else
                return new Offer().fromData(rdr.rows[0]); 
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

        /**
     * @method
     * @summary Updates an asset offer 
     * @param {Offer} offer The offering of the asset to be updated
     * @param {SecurityPrincipal} runAs The principal to run as
     * @param {Client} _txc The transactional client
     * @returns {Offer} The removed asset offer
     */
    async updateOffer(offer, runAs, _txc) {
        if (!runAs || !(runAs instanceof security.Principal))
            throw new exception.ArgumentException("runAs");

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Delete the asset offer
            var dbOffer = offer.toData();
            dbOffer.updated_by = runAs.session.userId;
            var updateCmd = model.Utils.generateUpdate(dbOffer, "asset_offer", "updated_time");
            var rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not update asset offer", exception.ErrorCodes.DATA_ERROR);
            else
                return offer.fromData(rdr.rows[0]); 
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Gets all offers for the specified asset id
     * @param {string} assetId The id of the asset to get offers for
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Offer} The asset offers with identifier matching
     */
    async getOffers(assetId, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM asset_offer WHERE asset_id = $1 ORDER BY start_date ASC", [assetId]);
            var retVal = [];
            rdr.rows.forEach((o)=>retVal.push(new Offer().fromData(o)));
            return retVal;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Gets active sale for the specified asset
     * @param {string} assetId The id of the asset to get sales for
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Offer} The asset sales with identifier matching
     */
    async getActiveOffer(assetId, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM asset_offer WHERE asset_id = $1 AND deactivation_time IS NULL AND CURRENT_TIMESTAMP BETWEEN COALESCE(start_date, CURRENT_DATE) AND COALESCE(stop_date, CURRENT_DATE)", [assetId]);
            if(rdr.rows.length == 0)
                return null;
            else
                return new Offer().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Gets the specified asset by ID
     * @param {string} id The id of the asset to get
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Asset} The asset with identifier matching
     */
    async get(id, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT * FROM assets WHERE id = $1", [id]);
            if (rdr.rows.length == 0)
                throw new exception.NotFoundException("asset", id);
            else
                return new Asset().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Gets the specified asset by ID
     * @param {string} addr The public address of the asset to get
     * @param {Client} _txc When present, the database transaction to use
     * @returns {Asset} The asset with identifier matching
     */
    async getByPublicAddress(addr, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            // Get by ID
            var rdr = await dbc.query("SELECT DISTINCT assets.* FROM wallets " +
                    "LEFT JOIN asset_offer ON (wallet_id = wallets.id) " +
                    "LEFT JOIN assets ON (asset_offer.asset_id = assets.id OR wallets.id = assets.dist_wallet_id) " + 
                    "WHERE assets.id IS NOT NULL AND address = $1", [addr]);
            if (rdr.rows.length == 0)
                return null;
            else
                return new Asset().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Get the specified asset by code
     * @param {Asset} filter The filter to query on
     * @param {number} offset The offset to start filter on
     * @param {number} count The number of results to return
     * @param {Client} _txc When present, the database transaction to use
     * @return {Asset} The asset with the matching code
     */
    async query(filter, offset, count, _txc) {

        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbFilter = {};
            // User supplied filter
            if (filter) {
                dbFilter = filter.toData();
                if (!filter.deactivationTime)
                    dbFilter.deactivation_time = filter.deactivationTime;
            }
            var selectCmd = model.Utils.generateSelect(dbFilter, "assets", offset, count);
            var rdr = await dbc.query(selectCmd.sql, selectCmd.args);
            var retVal = [];
            for (var r in rdr.rows)
                retVal.push(new Asset().fromData(rdr.rows[r]));
            return retVal;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Inserts the specified quote into the database
     * @param {AssetQuote} quote The quote to be inserted into the database
     * @param {Client} _txc When present, the transaction to run as
     */
    async insertQuote(quote, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            
            var insertCmd = model.Utils.generateInsert(quote, "asset_quote");
            var rdr = await dbc.query(insertCmd.sql, insertCmd.args);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not insert the asset quote", exception.ErrorCodes.DATA_ERROR);
            else 
                return quote.fromData(rdr.rows[0]);
        }
        finally { 
            if(!_txc) dbc.end();
        }
    }

    /**
     * @summary
     * @method Retrieves the specified quote from the database
     * @param {string} quoteId The ID of the quote to retrieve
     * @param {Client} _txc When present, the transaction to run as
     */
    async getQuote(quoteId, _txc) {
        var dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            
            var rdr = await dbc.query(`SELECT * FROM asset_quote WHERE id = $1`, [quoteId]);
            if(rdr.rows.length == 0)
                throw new exception.Exception("Could not get the asset quote", exception.ErrorCodes.DATA_ERROR);
            else 
                return new AssetQuote().fromData(rdr.rows[0]);
        }
        finally { 
            if(!_txc) dbc.end();
        }
    }
}