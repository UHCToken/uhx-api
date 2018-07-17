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
    exception = require('../exception'),
    security = require('../security'),
    walletRepository = require('../repository/walletRepository'),
    Wallet = require('../model/Wallet'),
    model = require('../model/model');

/**
 * @class
 * @summary Represents a user payment service
 * @swagger
 * tags:
 *  - name: "wallet"
 *    description: "The wallet resource represents a single user's wallet (stellar or other blockchain account, etc.)"
 */
class WalletApiResource {

    /**
     * @constructor
     */
    constructor() {

    }
    /**
     * @method
     * @summary Get routing information for this class
     */
    get routes() {
        return {
            "permission_group": "wallet",
            "routes": [
                {
                    "path": "user/:uid/wallet",
                    "put": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.put
                    },
                    "get": {
                        "demand": security.PermissionType.LIST,
                        "method": this.get
                    },
                    "delete": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.delete
                    }
                },
                {
                    "path": "asset/:assetId/wallet",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getAssetWallet
                    }
                },
                {
                    "path": "wallet/:walletId",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.getWallet
                    }
                },
                {
                    "path": "wallet/generate",
                    "post": {
                        "demand": security.PermissionType.EXECUTE,
                        "method": this.generateWallets
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Posts a new transaction to the wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /user/{userid}/wallet:
     *  put:
     *      tags:
     *      - "wallet"
     *      summary: "Activates a new blockchain account for the specified user"
     *      description: "This method will activate the user's wallet enabling the balances to appear"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to activate an account for"
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "body"
     *        description: "The wallet to be created (note: Address is generated automatically, only balances is used to establish an initial balance if this service permits)"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Wallet"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          422:
     *              description: "The user object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:wallet"
     */
    async put(req, res) {
        res.status(201).json(await uhx.TokenLogic.activateStellarWalletForUser(req.params.uid));
        return true;
    }
    /**
     * @method
     * @summary Get a single transaction posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /user/{userid}/wallet:
     *  get:
     *      tags:
     *      - "wallet"
     *      summary: "Gets summary information about the user's wallet"
     *      description: "This method will return summary information for the user's wallet including balances, public address, etc."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to create a wallet for"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The user's wallet information"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          404: 
     *             description: "The user has not bought any UhX yet and does not have an active wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:wallet"
     */
    async get(req, res) {

        var wallets = await uhx.Repositories.walletRepository.getAllForUserId(req.params.uid);
        wallets = await uhx.TokenLogic.getAllBalancesForWallets(wallets);

        var retVal = {};
        wallets.forEach(o => retVal[o._symbol] = o);

        // Get USD balance
        var usd = await uhx.GreenMoney.getBalance(req.params.uid, 'USD');

        if (usd) {
            retVal.usd = {};
            retVal.usd.id = usd.id;
            retVal.usd.balances = [];
            var balance = {};
            balance.code = 'USD';
            balance.value = usd.amount;
            retVal.usd.balances.push(balance)
        }
        else
            retVal.usd = null;


        res.status(200).json(retVal);
        return true
    }

    /**
     * @method
     * @summary Deactivates a wallet
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
    * @swagger
     * /user/{userid}/wallet:
     *  delete:
     *      tags:
     *      - "wallet"
     *      summary: "Deactivates the specified user wallet"
     *      description: "This method will set the deactivation time of the user's wallet"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to deactivate a wallet for"
     *        required: true
     *        type: string
     *      responses:
     *          201: 
     *             description: "The deactivation was successful"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          404: 
     *             description: "The user has not bought any UhX yet and does not have an active wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:wallet"
     */
    async delete(req, res) {
        var retVal = [];
        retVal.push(await uhx.Repositories.balanceRepository.delete(req.params.uid));
        retVal.push(await uhx.Repositories.walletRepository.deleteByUserId(req.params.uid));
        res.status(201).json(retVal);
        return true;
    }

    /**
     * @summary Gets the asset wallet
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
    * @swagger
     * /asset/{assetId}/wallet:
     *  get:
     *      tags:
     *      - "wallet"
     *      summary: "Gets the specified asset class and the wallet balances"
     *      description: "This method will get the specified asset, all offers and all balances of those offers"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "assetId"
     *        description: "The identity of the asset to load wallet info for"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The data was retrieved successfully"
     *             schema: 
     *                  $ref: "#/definitions/Asset"
     *          404: 
     *             description: "The user has not bought any UhX yet and does not have an active wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:wallet"
     *          - "read:asset"
     */
    async getAssetWallet(req, res) {

        var assetWalletStat = await uhx.Repositories.transaction(async (_txc) => {
            var asset = await uhx.Repositories.assetRepository.get(req.params.assetId, _txc);
            await asset.loadDistributorWallet(_txc);

            var stellarPromises = [
                (async () => { asset.distWallet = await uhx.StellarClient.getAccount(asset._distWallet) })(),
                (async () => { asset.issuerWallet = await uhx.StellarClient.getAccount(new Wallet().copy({ address: asset.issuer })) })()
            ];
            // Load from stellar network but don't want ... haha
            var offers = await asset.loadOffers(_txc);

            offers.forEach((o) => {
                stellarPromises.push((async () => {
                    await o.loadWallet(_txc)
                    o.wallet = await uhx.StellarClient.getAccount(o._wallet);
                    o.remain = new Date() > o.startDate && new Date() < o.stopDate ? o.wallet.balances.find(b => b.code == asset.code).value : o.stopDate < new Date() ? 0 : o.amount;

                })());
            });

            // Fill out details
            await Promise.all(stellarPromises);

            return asset;
        });

        res.status(200).json(assetWalletStat);
        return true;
    }

    /**
     * @summary Gets the specified wallet
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async getWallet(req, res) {

        var wallet = await uhx.Repositories.walletRepository.get(req.params.walletId);
        wallet = await uhx.TokenLogic.getAllBalancesForWallets(wallet);
        res.status(200).json(wallet);
        return true;
    }

    /**
     * @summary Generates wallets for those without for a specific network
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
    * @swagger
     * /wallet/generate:
     *  poast:
     *      tags:
     *      - "wallet"
     *      summary: "Creates wallets for current users on a specific network if they don't have one"
     *      description: "This method will find all users without a wallet on the network and create one for each"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "network"
     *        description: "The network id that the wallets will be generated on"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The wallets were created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Asset"
     *          404: 
     *             description: "No users exist without a wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "execute:wallet"
     */
    async generateWallets(req, res) {
        if(req.body.network){
            var response = await uhx.TokenLogic.generateWallets(req.body.network);
            res.status(200).json(response);
            return true;
        }
        else{
            res.status(500).json("Missing parameters")
            return true;
        }
    }

    /**
     * @method
     * @summary Determines additional access control on the wallet resource
     * @param {security.Principal} principal The JWT principal data that has authorization information
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     * @returns {boolean} An indicator of whether the user has access to the resource
     */
    async acl(principal, req, res) {

        if (!(principal instanceof security.Principal)) {
            uhx.log.error("ACL requires a security principal to be passed");
            return false;
        }

        // if the token has OWNER set for USER permission then this user must be SELF
        return (principal.grant.wallet & security.PermissionType.OWNER && req.params.uid == principal.session.userId) // the permission on the principal is for OWNER only
            ^ !(principal.grant.wallet & security.PermissionType.OWNER); // XOR the owner grant flag is not set.

    }

}

// Module exports
module.exports.WalletApiResource = WalletApiResource;
