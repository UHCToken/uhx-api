
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

 const request = require("request"),
    exception = require("../exception"),
    uhc = require("../uhc");

 module.exports = class BittrexClient {


    /**
     * 
     * @param {*} quoteRequest The quote request or array of requests
     * @param {string} quoteRequest.from The asset code which is the source 
     * @param {string} quoteRequest.to The asset code which is the target 
     * @param {Array} quoteRequest.via An array of codes to establish the from>to quote
     * @return {number} The identified / calculated exchange rate
     * @example Fetch USD<>XLM price via BTC
     * var client = new BittrexClient();
     * client.getExchange("XLM", "USD", ["BTC"]);
     */
    async getExchange(quoteRequest) {
        // Establish the quote path
        if(quoteRequest && !Array.isArray(quoteRequest))
            quoteRequest = [quoteRequest];

        // Promise 
        return new Promise((fulfill, reject) => {
            request("https://bittrex.com/api/v2.0/pub/markets/GetMarketSummaries",
            function(err, res, body) {
                if(err) {
                    uhc.log.error(`HTTP ERR: ${err}`)
                    reject(new exception.Exception("Error contacting BitTrex API", exception.ErrorCodes.COM_FAILURE, err));
                }
                else if(res.statusCode == 200) {
                    var response = JSON.parse(body);
                    
                    var retVal = [];

                    quoteRequest.forEach((quote) => {
                        // From Code is USD or EUR we need to tether
                        if(quote.from == "USD" || quote.from == "EUR")
                            quote.from += "T";
                        if(quote.to == "USD" || quote.to == "EUR")
                            quote.to += "T";

                        if(quote.via && !Array.isArray(quote.via))
                            quote.via = [quote.via];
                            
                        // Quote path
                        var quotePath = quote.via || [];
                        quotePath.push(quote.from);
                        quotePath.unshift(quote.to);

                        // Calculate quote
                        var currency = quotePath.shift();
                        var quote = 1;
                        while(quotePath.length > 0) {
                            var base = quotePath.shift();
                            if(base == currency) continue;
                            var tradePair = response.result.find((o)=> o.Market.MarketCurrency == currency && o.Market.BaseCurrency == base );
                            if(!tradePair)
                                reject(new exception.NotFoundException(`Trade pair ${currency}>${base} not valid`, exception.ErrorCodes.NOT_FOUND));
                            else 
                            {
                                quote *= tradePair.Summary.Bid;
                                uhc.log.verbose(`${currency}>${base} = ${base.bid} ===> ${quote.from}>${base} = ${quote}`)
                            }
                            currency = base;
                        }
                        retVal.push(quote);
                    });
                    fulfill(retVal);
                }
            })
        });
    }

 }
