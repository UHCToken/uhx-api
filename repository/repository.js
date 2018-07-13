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

const UserRepository = require('./userRepository'),
    ApplicationRepository = require("./applicationRepository"),
    SessionRepository = require('./sessionRepository'),
    WalletRepository = require('./walletRepository'),
    PermissionRepository = require('./permissionRepository'),
    GroupRepository = require('./groupRepository'),
    AssetRepository = require('./assetRepository'),
    InvitationRepository = require('./invitationRepository'),
    TransactionRepository = require('./transactionRepository'),
    ReportRepository = require('./reportRepository'),
    InvoiceRepository = require('./invoiceRepository'),
    BalanceRepository = require('./balanceRepository'),
    ServiceInvoiceRepository = require('./serviceInvoiceRepository'),
    pg = require('pg'),
    uhx = require('../uhx'),
    exception = require('../exception');

/**
 * @class
 * @summary Represents UhX's database repositories
 */
class UhcRepositories {

    /**
     * @constructor
     * @summary Creates a new repositories collection with the specified connection data
     * @param {String} connectionString The path to the database on which the repositories should be accessed
     */
    constructor(connectionString) {
        this.connectionString = connectionString;
        this.transaction = this.transaction.bind(this);
    }

    /**
     * @method
     * @summary Executes transactionFn in a database transaction
     * @param {*} transactionFn An asynchronous function which is used to execute as the transaction
     * @example Insert a user and add them to a group in a transaction
     * await repository.transact(async (_txc) => {
     *      user = repository.userRepository.insert(user, null, _txc);
     *      var group = repository.groupRepository.getByName("users");
     *      repository.groupReposiotry.addUser(group.id, user.id, null, _txc);
     * });
     */
    async transaction(transactionFn) {

        var dbc = new pg.Client(this.connectionString);
        try {
            await dbc.connect();
            await dbc.query("BEGIN TRANSACTION");

            var retVal = await transactionFn(dbc);
            
            await dbc.query("COMMIT");

            return retVal;
        }
        catch(e) {
            await dbc.query("ROLLBACK");
            uhx.log.error(`Rolling back transaction due to: ${e.message}`);
            throw new exception.Exception("Database transaction failed", e.constructor.name == "BusinessRuleViolationException" ? exception.ErrorCodes.RULES_VIOLATION : exception.ErrorCodes.DATA_ERROR, e);
        }
        finally {
            dbc.end();
        }

    }
    /**
     * @property
     * @summary Gets the user repository
     * @type {UserRepository}
     */
    get userRepository() {
        if(!this._userRepository)
            this._userRepository = new UserRepository(this.connectionString);
        return this._userRepository;
    }

    /**
     * @property
     * @summary Gets the report repository
     * @type {ReportRepository}
     */
    get reportRepository() {
        if(!this._reportRepository)
            this._reportRepository = new ReportRepository(this.connectionString);
        return this._reportRepository;
    }

    /**
     * @property 
     * @summary Get the purchase repository
     * @type {TransactionRepository}
     */
    get transactionRepository() {
        if(!this._transactionRepository)
            this._transactionRepository = new TransactionRepository(this.connectionString);
        return this._transactionRepository;
    }

    /**
     * @property
     * @summary Gets the application repository
     * @type {ApplicationRepository}
     */
    get applicationRepository() {
        if(!this._applicationRepository)
            this._applicationRepository = new ApplicationRepository(this.connectionString);
        return this._applicationRepository;
    }

        /**
     * @property
     * @summary Gets the service invoice repository
     * @type {ServiceInvoiceRepository}
     */
    get serviceInvoiceRepository() {
        if(!this._serviceInvoiceRepository)
            this._serviceInvoiceRepository = new ServiceInvoiceRepository(this.connectionString);
        return this._serviceInvoiceRepository;
    }

    /**
     * @property
     * @summary Gets the session repository
     * @type {SessionRepository}
     */
    get sessionRepository() {
        if(!this._sessionRepository)
            this._sessionRepository = new SessionRepository(this.connectionString);
        return this._sessionRepository;
    }

    /**
     * @property 
     * @summary Get the permission repository
     * @type {PermissionRepository}
     */
    get permissionRepository() {
        if(!this._permissionRepository)
            this._permissionRepository = new PermissionRepository(this.connectionString);
        return this._permissionRepository;
    }

    /**
     * @property 
     * @summary Get the wallet repository
     * @type {WalletRepository}
     */
    get walletRepository() {
        if(!this._walletRepository)
            this._walletRepository = new WalletRepository(this.connectionString);
        return this._walletRepository;
    }

    /**
     * @property
     * @summary Get the group repository
     * @type {GroupRepository}
     */
    get groupRepository() {
        if(!this._groupRepository)
            this._groupRepository = new GroupRepository(this.connectionString);
        return this._groupRepository;
    }

    /**
     * @property
     * @summary Get the asset repository
     * @type {AssetRepository}
     */
    get assetRepository() {
        if(!this._assetRepository)
            this._assetRepository = new AssetRepository(this.connectionString);
        return this._assetRepository;
    }

    /**
     * @property 
     * @summary Get the invitation repository
     * @type {InvitationRepository}
     */
    get invitationRepository() {
        if(!this._invitationRepository)
            this._invitationRepository = new InvitationRepository(this.connectionString);
        return this._invitationRepository;
    }

    /**
     * @property 
     * @summary Get the invoice repository
     * @type {InvoiceRepository}
     */
    get invoiceRepository() {
        if(!this._invoiceRepository)
            this._invoiceRepository = new InvoiceRepository(this.connectionString);
        return this._invoiceRepository;
    }

    /**
     * @property 
     * @summary Get the balance repository
     * @type {BalanceRepository}
     */
    get balanceRepository() {
        if(!this._balanceRepository)
            this._balanceRepository = new BalanceRepository(this.connectionString);
        return this._balanceRepository;
    }
}

module.exports.UhcRepositories = UhcRepositories;