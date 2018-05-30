'use strict';

const exception = require("./exception"),
    uhx = require("./uhx"),
    model = require("./model/model"),
    security = require("./security");

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
        if(workData.batchId && !transactions)
            transactions = await uhx.Repositories.transactionRepository.getByBatch(workData.batchId);
        uhx.log.info(`Worker process will transact ${transactions.length} for batch ${workData.batchId}`);
        for(var i in transactions) {
            if(transactions[i].state == model.TransactionStatus.Pending ||
                transactions[i].state == model.TransactionStatus.Active) {
                try {
                    uhx.log.info(`Setting status of ${transactions[i].id} to ACTIVE`);
                    transactions[i].state = model.TransactionStatus.Active;
                    await uhx.Repositories.transactionRepository.update(transactions[i], principal);
                    transactions[i] = await uhx.StellarClient.execute(transactions[i]);
                    uhx.log.info(`Setting status of ${transactions[i].id} to COMPLETE`);
                    await uhx.Repositories.transactionRepository.update(transactions[i], principal);
                }
                catch(e) {
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
    }
}

/**
 * A message has been sent to the worker object
 */
process.on('message', (data) => {

    console.log(data);
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