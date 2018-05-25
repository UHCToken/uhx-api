'use strict';

const exception = require("./exception"),
    uhc = require("./uhc"),
    model = require("./model/model"),
    security = require("./security");

const actions = {
    /**
     * @method
     * @summary Processes transactions on Stellar
     * @param {*} workData Parameters for the transaction processing
     */
    processTransactions : async (workData) => {

        // Load the batch
        if(!workData.batchId)
            throw new exception.ArgumentException("Missing batch identifier");
        else if(!workData.sessionId)
            throw new exception.ArgumentException("Error finding session");
        
        // Execute as session
        var session = await uhc.Repositories.sessionRepository.get(workData.sessionId);
        await session.loadUser();
        var principal = new security.Principal(session);

        var transactions = await uhc.Repositories.transactionRepository.getByBatch(workData.batchId);
        uhc.log.info(`Worker process will transact ${transactions.length} for batch ${workData.batchId}`);
        for(var i in transactions) {
            if(transactions[i].state == model.TransactionStatus.Pending) {
                try {
                    uhc.log.info(`Start processing ${transactions[i].id}...`);
                    transactions[i] = await uhc.StellarClient.execute(transactions[i]);
                    uhc.log.info(`Processing complete ${transactions[i].id}...`);
                    await uhc.Repositories.transactionRepository.update(transactions[i], principal);
                }
                catch(e) {
                    transactions[i].state = model.TransactionStatus.Failed;
                    transactions[i].postingDate = new Date();
                    await uhc.Repositories.transactionRepository.update(transactions[i], principal);
                }
            }
            else 
                uhc.log.info(`Transaction ${transactions[i].id} has state of ${transactions[i].state}, will not retry`);
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
                    uhc.log.error(`Worker process error: ${e.message} @ ${e.stack}`);
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
        uhc.log.error(`Worker process error: ${e.message} @ ${e.stack}`);
        process.send({
            msg: 'error',
            error: e.message,
            workId: data.workId, 
            result: null
        });
    }
});

