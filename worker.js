'use strict';

const StellarClient = require("./integration/stellar"),
    Transaction = require('./model/Transaction'),
    exception = require("./exception"),
    model = require("./model/model"),
    security = require("./security"),
    config = require('./config'),
    uhx = require("./uhx");

const actions = {
    /**
     * @method
     * @summary Processes backlogged transactions
     * @param {*} workData Parameters for the transaction processing
     */
    backlogTransactions : async () => {
        uhx.log.info("Pickup up transactions");
        var txns = (await uhx.Repositories.transactionRepository.query(new model.Transaction().copy({ state: 3})))
            .concat(await uhx.Repositories.transactionRepository.query(new model.Transaction().copy({ state: 1})));
        await actions.processTransactions({ transactions: txns });
    },
    /**
     * @method
     * @summary Processes transactions on Stellar
     * @param {*} workData Parameters for the transaction processing
     */
    processTransactions : async (workData) => {
        // Load the batch
        if(!workData.batchId && !workData.transactions)
            throw new exception.ArgumentException("Missing batch identifier");
        
        // Execute as session
        var session = null;
        if(workData.sessionId) 
            session = await uhx.Repositories.sessionRepository.get(workData.sessionId);
        else 
            session = new model.Session(await uhx.Repositories.userRepository.get("00000000-0000-0000-0000-000000000000"), new model.Application(), '*', null, null);
        
        await session.loadUser();
        var principal = new security.Principal(session);

        var transactions = workData.transactions;

        const stellarClient = await uhx.Repositories.assetRepository.query().then(function (result) {
            return new StellarClient(config.stellar.horizon_server, result, config.stellar.testnet_use);   
        });

        if(workData.batchId && !transactions)
            transactions = await uhx.Repositories.transactionRepository.getByBatch(workData.batchId);
        uhx.log.info(`Worker process will transact ${transactions.length} for batch ${workData.batchId}`);
        for(var i in transactions) {
            uhx.log.info(transactions[i].state);
            if(transactions[i].state == model.TransactionStatus.Pending ||
                transactions[i].state == model.TransactionStatus.Active) {
                try {
                    uhx.log.info(`Setting status of ${transactions[i].id} to ACTIVE`);
                    transactions[i].state = model.TransactionStatus.Active;
                    await uhx.Repositories.transactionRepository.update(transactions[i], principal);
                    transactions[i] = await stellarClient.execute(transactions[i]);
                    uhx.log.info(`Setting status of ${transactions[i].id} to COMPLETE`);
                    await uhx.Repositories.transactionRepository.update(transactions[i], principal);
                }
                catch(e) {
                    uhx.log.info(`Failed submitting transaction: ${e}`);
                    transactions[i].state = model.TransactionStatus.Failed;
                    transactions[i].postingDate = new Date();
                    uhx.log.info(`Setting status of ${transactions[i].id} to FAILED`);
                    await uhx.Repositories.transactionRepository.update(transactions[i], principal);
                }
            }
            else 
                uhx.log.info(`Transaction ${transactions[i].id} has state of ${transactions[i].state}, will not retry`);
        }
        return workData.batchId;
    },
    /**
     * @method
     * @summary Processes subscriptions
     * @param {*} workData Parameters for the transaction processing
     */
    processSubscriptionsForBilling : async (workData) => {
        // Execute as session
        const session = new model.Session(await uhx.Repositories.userRepository.get("00000000-0000-0000-0000-000000000000"), new model.Application(), '*', null, null);
        
        await session.loadUser();
        var principal = new security.Principal(session);

        var transactions = workData.transactions;

        const stellarClient = await uhx.Repositories.assetRepository.query().then(function (result) {
            return new StellarClient(config.stellar.horizon_server, result, config.stellar.testnet_use);   
        });

        uhx.log.info(`Worker process will transact ${transactions.length} subscriptions.`);

        try {
            transactions = transactions.map(t => {
                const trans = new Transaction(t.id, t.type, t.memo, t.postingDate, t.payor || t.payorId, t.payee || t.payeeId, t.amount, null, null, t.state)
                trans.subscription = t.subscription;
                return trans;
            });
             
            await uhx.Repositories.transaction(async (_txc) => {  
              for (var i in transactions) {
                await transactions[i].loadPayorWallet();
                await transactions[i].loadPayeeWallet();
                await stellarClient.execute(transactions[i]);
                await uhx.Repositories.transactionRepository.insert(transactions[i], principal, _txc);
                await uhx.Repositories.subscriptionRepository.updateBilledSubscription(transactions[i].subscription);
              }  
            });
          }
          catch (e) {
            uhx.log.error(`Error creating transaction: ${e.message}`);
            while (e.code == exception.ErrorCodes.DATA_ERROR && e.cause)
                e = e.cause[0];
            throw new exception.Exception("Error creating transaction", e.code || exception.ErrorCodes.UNKNOWN, e);
          }

        return;
    }
}

/**
 * A message has been sent to the worker object
 */
process.on('message', (data) => {
    var fn = actions[data.msg.action];

    try {
        if(fn) {
            Promise.all([fn(data.msg)]).then(
                (r) => process.send({
                    msg: 'done/return/to/pool',
                    error: null,
                    workId: data.workId,
                    result: r
                })
            ).catch(
                (e) => { 
                    uhx.log.error(`Worker process error: ${e.message} @ ${e.stack}`);
                    process.send({
                        msg: 'error',
                        error: e.message,
                        workId: data.workId, 
                        result: null
                    });
                 }
            )
        }
        else  
            throw new exception.Exception(`${data.msg.action} is not valid task for this worker`);
    }
    catch(e) {
        uhx.log.error(`Worker process error: ${e.message} @ ${e.stack}`);
        process.send({
            msg: 'error',
            error: e.message,
            workId: data.workId, 
            result: null
        });
    }
});