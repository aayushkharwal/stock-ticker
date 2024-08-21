const axios = require('axios')
const express = require('express')
const moment = require('moment')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({origin: "https://web-tech3-csci571.wl.r.appspot.com"}))
app.use(express.json());
app.use("/", express.static('static'));

const apiBaseUrl = "https://finnhub.io/api/v1/";
const apiToken = "cn271phr01qmg1p4mii0cn271phr01qmg1p4miig";
const chartsBaseUrl = "https://api.polygon.io/v2";
const chartsToken = "j8dlyGBXqBZjYbffatMqg3WxTFgAl9Ig";


const dbUri = "mongodb+srv://webTech_dbAdmin:dbPassword@csci571-webtech.h8d3oxr.mongodb.net/?retryWrites=true&w=majority&appName=csci571-webTech";
const dbClient = new MongoClient(dbUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

async function establishConnection() {
	try {
		console.log('Connecting to MongoDB');
		await dbClient.connect();
		console.log('Connected to MongoDB.');
        return 
	} catch (error) {
		console.error("Error connecting to MongoDB", error);
	}
}

function getFormattedDatetime(unixTime, format="Do MMMM, YYYY") {
    return moment.unix(unixTime).format(format);   
}

// app.use((req, res, next) => { 
//     res.header("Access-Control-Allow-Origin",  
//                "https://web-tech3-csci571.wl.r.appspot.com"); 
//     res.header("Access-Control-Allow-Headers",  
//                "Origin, X-Requested-With, Content-Type, Accept"); 
//     next(); 
// });

app.get("/health_check", (req, res) => {
  res.json({
    "message": "Hello World!"
  })
})


app.get("/search/:symbol", async (req, res) => {
   
    try {

        const apiUrlPath = "search";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);

        const param = {
            "token": apiToken,
            "q": req.params.symbol,
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);
        let filteredSearch = response.data.result.filter(peer => peer.type === "Common Stock" && !(peer.symbol.includes('.')));
        res.json(filteredSearch);
    } catch(err) {
        console.error("Error(Autocomplete): ", err);
    }
})

app.get("/search/:symbol/stock_profile", async (req, res) => {

    try {

        const apiUrlPath = "stock/profile2";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);
    
        const param = {
            "token": apiToken,
            "symbol": req.params.symbol,
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);
        res.json(response.data);
    } catch(err) {
        console.error("Error(Profile): ", err);
    }

})

async function getQuoteData(symbol) {
    
    const apiUrlPath = "quote";
    const apiUrl = new URL(apiUrlPath, apiBaseUrl);
    console.log("API URL: ", apiUrl.href);
   
    const param = {
        "token": apiToken,
        "symbol": symbol,
    }
    console.log("Params: ", param);

    const response = await axios.get(apiUrl, { params: param });
    response.data.unix_t = response.data.t;
    response.data.t = getFormattedDatetime(response.data.t, "YYYY-MM-DD HH:mm:ss");

    return response

}

app.get("/search/:symbol/stock_quote", async (req, res) => {

    try {
        const outputData = await getQuoteData(req.params.symbol);
        console.log(`Status: ${outputData.status}`);
        console.log("Body Size: ", Object.keys(outputData.data).length);
        console.log("Type: ", typeof outputData.data);
        res.json(outputData.data);
    } catch(err) {
        console.error("Error(Quote): ", err);
    }

})


app.get("/search/:symbol/stock_recommendation", async (req, res) => {
    
    try {

        const apiUrlPath = "stock/recommendation";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);
    
        const param = {
            "token": apiToken,
            "symbol": req.params.symbol,
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);

        const outputData = {
            xAxis: [],
            yAxis: {
                strongBuy: [],
                buy: [],
                hold: [],
                sell: [],
                strongSell: []
            }
        };
    
        for (const [key, value] of Object.entries(response.data)) {
            outputData.xAxis.push(value.period);
            outputData.yAxis.strongBuy.push(value.strongBuy);
            outputData.yAxis.buy.push(value.buy);
            outputData.yAxis.hold.push(value.hold);
            outputData.yAxis.sell.push(value.sell);
            outputData.yAxis.strongSell.push(value.strongSell);
        }
    
        res.json(outputData);
    
    } catch(err) {
        console.error("Error(Recommendation): ", err);
    }
})

app.get("/search/:symbol/stock_sentiment", async (req, res) => {

    try {

        const apiUrlPath = "stock/insider-sentiment";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);
    
        const param = {
            "token": apiToken,
            "symbol": req.params.symbol,
            "from": "2022-01-01"
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);
        let outputData = {
            mspr_total: 0,
            mspr_positive: 0,
            mspr_negative: 0,
            change_total: 0,
            change_positive: 0,
            change_negative: 0
        }
        
        response.data.data.forEach(function (item) {
            outputData.mspr_total+=item.mspr;
            outputData.mspr_positive+=item.mspr>0?item.mspr:0;
            outputData.mspr_negative+=item.mspr<0?item.mspr:0;
            outputData.change_total+=item.change;
            outputData.change_positive+=item.change>0?item.change:0;
            outputData.change_negative+=item.change<0?item.change:0;
        });
    
        res.json(outputData);
    
    } catch(err) {
        console.error("Error(Sentiment): ", err);
    }
})

app.get("/search/:symbol/stock_peers", async (req, res) => {
    try {

        const apiUrlPath = "stock/peers";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);
    
        const param = {
            "token": apiToken,
            "symbol": req.params.symbol,
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);

        let filteredPeers = response.data.filter(peer => !(peer.includes('.')));

        res.json(filteredPeers);
    } catch(err) {
        console.error("Error(Peers): ", err);
    }


})

app.get("/search/:symbol/stock_earnings", async (req, res) => {

    try {
        const apiUrlPath = "stock/earnings";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);
    
        const param = {
            "token": apiToken,
            "symbol": req.params.symbol,
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);


        const outputData = {
            xAxis: [],
            yAxis: {
                actual: [],
                estimate: []
            }
        };
        response.data.sort((a, b) => new Date(b.period) - new Date(a.period));

        for (const [key, value] of Object.entries(response.data)) {
            outputData.xAxis.push(`${value.period} Surprise: ${value.surprise}`);
            outputData.yAxis.actual.push(value.actual?value.actual:0);
            outputData.yAxis.estimate.push(value.estimate?value.estimate:0);
        }
    
        outputData.og = response.data;
        res.json(outputData);

    } catch(err) {
        console.error("Error(Earnings): ", err);
    }


})

app.get("/search/:symbol/stock_news", async (req, res) => {
    try {

        const param = {
            "token": apiToken,
            "symbol": req.params.symbol,
            "from": moment().subtract(7, "days").format("YYYY-MM-DD"),
            "to": moment().format("YYYY-MM-DD")
        }
        console.log("Params: ", param);

        const apiUrlPath = "company-news";
        const apiUrl = new URL(apiUrlPath, apiBaseUrl);
        console.log("API URL: ", apiUrl.href);

    
        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);

        const newsKeys = ["image", "url", "headline", "datetime", "source", "summary"];
        const outputData = [];
        const maxOutputSize = 20;
    
        let i=0
        while (i<Object.keys(response.data).length && outputData.length<maxOutputSize) {
            if ( newsKeys.every((key) => { return (response.data[i].hasOwnProperty(key) && String(response.data[i][key]).trim() !== "") }) ) {
                response.data[i].datetime = getFormattedDatetime(response.data[i].datetime);
                outputData.push(response.data[i]);
            }
            i++;
        }
        console.log("Latest News: ", outputData)
    
        res.send(outputData);
    } catch(err) {
        console.error("Error(News): ", err);
    }

})

app.get("/search/:symbol/stock_charts", async (req, res) => {
    try {

        let from;
        let to;
        const quoteData = await getQuoteData(req.params.symbol);

        // const marketStatus = ((new Date().getTime()-quoteData.data.unix_t*1000)/(1000*60*60))>300 ? false:true;
        // if(marketStatus) {
        //     from = moment();
        // } else {
            from = moment.unix(quoteData.data.unix_t).subtract(3, "days").format("YYYY-MM-DD");
            to = moment.unix(quoteData.data.unix_t).format("YYYY-MM-DD");
        // }

        const apiUrlPath = `v2/aggs/ticker/${req.params.symbol}/range/1/hour/${from}/${to}`;
        const apiUrl = new URL(apiUrlPath, chartsBaseUrl);
        console.log("API URL: ", apiUrl.href);
    
        const param = {
            "adjusted": true,
            "sort": "asc",
            "apiKey": chartsToken
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);

        const outputData = response.data.results.map(arrayItem => [arrayItem.t, arrayItem.c]);
        // response.data.results.map(arrayItem => arrayItem.unixt=getFormattedDatetime(arrayItem.t/1000, "YYYY-MM-DD hh:mm:ss"));

        res.json(outputData);

    } catch(err) {
        console.error("Error(Charts): ", err.message);
        res.json({})
    }

})

app.get("/search/:symbol/sma_charts", async (req, res) => {

    try {
        const apiUrlPath = `v2/aggs/ticker/${req.params.symbol}/range/1/day/${moment().subtract(2, "years").subtract(1, "days").format("YYYY-MM-DD")}/${moment().format("YYYY-MM-DD")}`;
        const apiUrl = new URL(apiUrlPath, chartsBaseUrl);
        console.log("API URL: ", apiUrl.href);

        const param = {
            "adjusted": true,
            "sort": "asc",
            "apiKey": chartsToken
        }
        console.log("Params: ", param);

        const response = await axios.get(apiUrl, { params: param });
        console.log(`Status: ${response.status}`);
        console.log("Body Size: ", Object.keys(response.data).length);
        console.log("Type: ", typeof response.data);
        
        const outputData = {
            ohlc: [],
            volume: []
        }
    
        for (const [key, value] of Object.entries(response.data.results)) {
            outputData.ohlc.push([value.t, value.o, value.h, value.l, value.c]);
            outputData.volume.push([value.t, value.v]);
        }
    
        res.json(outputData);
    
    } catch(err) {
        console.error("Error(SMA): ", err.message);
        res.json({})
    }

})



app.get("/db/:symbol", async (req, res) => {

    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await dbClient.connect();

        const query = {"_id": req.params.symbol};
        const database = dbClient.db("ticker_app");  

        const portfolio = database.collection("portfolio");
        const portfolioData = await portfolio.findOne(query);

        const watchlist = database.collection("watchlist");
        const watchlistData = await watchlist.findOne(query);

        const outputData = {};
        outputData.watchlist = (watchlistData)?{status: true, _id:watchlistData._id, name:watchlistData.name}:{status: false};
        outputData.portfolio = portfolioData?portfolioData:{status: false, quantity: 0, totalCost: 0, _id: req.params.symbol};
        res.json(outputData)
 
    } catch(err) {
        console.error("Error(dbInitial): ", err);
 
    } finally {
        // Ensures that the client will close when you finish/error
        //await dbClient.close();
console.log('Keeping connection open');
      }

})

app.get("/wallet/balance", async (req, res) => {
    try {
        
        console.log("Fetching Wallet.");

        // Connect the client to the server	(optional starting in v4.7)
        // await dbClient.connect();

        const database = dbClient.db("ticker_app");
        const wallet = database.collection("wallet");

        const query = {};
        const doc = await wallet.findOne(query);
        console.log(doc);
        res.json({balance: doc.balance})

    } catch(err) {
        console.error("Error(Wallet): ", err);
     } finally {
        // Ensures that the client will close when you finish/error
        //await dbClient.close();
console.log('Keeping connection open');
      }

    }
)

app.get("/watchlist/:symbol/update", async (req, res) => {

    try {
        console.log("Updating Watchlist.", req.params.symbol);

        // Connect the client to the server	(optional starting in v4.7)
        // await dbClient.connect();

        const query = {"_id": req.params.symbol};
        const database = dbClient.db("ticker_app");

        const watchlist = database.collection("watchlist");
        const doc = await watchlist.findOne(query);
        
        let result;
        if (doc) {
            console.log('Deleting from watchlist');
            result = await watchlist.deleteOne(query);
            // Print the ID of the inserted document
            console.log(`A document was deleted with the _id: ${req.params.symbol}`);
            console.log('Result', result);
            result.status = 'removed from';
        } else {
            console.log('Adding to watchlist');
            // Create a document to insert
            const doc = {
            _id: req.params.symbol,
            name: req.query.companyName
            }
            // Insert the defined document into the "haiku" collection
            result = await watchlist.insertOne(doc);
            // Print the ID of the inserted document
            console.log(`A document was inserted with the _id: ${result.insertedId}`);
            console.log('Result', result)
            result.status = 'added to';
        }
        res.json(result)

    } catch(err) {
        console.error("Error(WatchlistUpdate): ", err);

      } finally {
        // Ensures that the client will close when you finish/error
        //await dbClient.close();
console.log('Keeping connection open');
      }
    
})

app.post('/portfolio/update', async (req, res) => {
    try {
        console.log("Updating Portfolio. Received request: ", req.body);

        // Connect the client to the server	(optional starting in v4.7)
        // await dbClient.connect();

        console.log(req.body);

        let outputData = {tickerSymbol: req.body.tickerSymbol};
        let totalCost = 0;
        let quantity = 0;
        let balance = 0;
        const options = { upsert: true };

        const database = dbClient.db("ticker_app");
        const portfolio = database.collection("portfolio");
        const wallet = database.collection("wallet");
        
        const walletDoc = await wallet.findOne();
        balance = walletDoc.balance;
        
        const query = {_id: req.body.tickerSymbol, name: req.body.name};
        const portfolioDoc = await portfolio.findOne(query);
        console.log('doc fetched from portfolio: ', portfolioDoc);
        if (portfolioDoc) {
            totalCost=portfolioDoc.totalCost;
            quantity=portfolioDoc.quantity
        }

        if (req.body.action==="Sell" && quantity===req.body.quantity) {

            result = await portfolio.deleteOne({ _id: req.body.tickerSymbol });

            result = await wallet.updateOne({_id: "user"}, {$set: {balance: balance + req.body.totalCost}}, options);
            console.log('Result', result);

            outputData.balance = balance + req.body.totalCost;
            outputData.quantity = 0;
            outputData.totalCost = 0;

        } else {

            const filter = { _id: req.body.tickerSymbol };
            let updateDoc;
            let result;

            if(req.body.action==="Buy") {
                updateDoc = {
                    $set: {
                        _id: req.body.tickerSymbol,
                        name: req.body.name,
                        quantity: quantity + req.body.quantity,
                        totalCost: totalCost + req.body.totalCost
                    },
                };
    
                result = await portfolio.updateOne(filter, updateDoc, options);
                console.log('Result', result);
    
                result = await wallet.updateOne({_id: "user"}, {$set: {balance: balance - req.body.totalCost}}, options);
                console.log('Result', result);

                outputData.balance = balance - req.body.totalCost;
                outputData.quantity = quantity + req.body.quantity;
                outputData.totalCost = totalCost + req.body.totalCost;

            } else {

                updateDoc = {
                    $set: {
                        _id: req.body.tickerSymbol,
                        name: req.body.name,
                        quantity: quantity - req.body.quantity,
                        totalCost: totalCost - req.body.totalCost
                    },
                };
    
                result = await portfolio.updateOne(filter, updateDoc, options);
                console.log('Result', result);
    
                result = await wallet.updateOne({_id: "user"}, {$set: {balance: balance + req.body.totalCost}}, options);
                console.log('Result', result);

                outputData.balance = balance + req.body.totalCost;
                outputData.quantity = quantity - req.body.quantity;
                outputData.totalCost = totalCost - req.body.totalCost;

            }    
        }

        res.json(outputData)

    } catch(err) {
        console.error("Error(PortfolioUpdate): ", err);
     } finally {
        // Ensures that the client will close when you finish/error
        //await dbClient.close();
console.log('Keeping connection open');
      }  
})

app.get("/watchlist/all", async (req, res) => {
    try {
        console.log("Fetching all Watchlist data.");

        // Connect the client to the server	(optional starting in v4.7)
        // await dbClient.connect();

        const database = dbClient.db("ticker_app");
        const watchlist = database.collection("watchlist");
        
        const query = {};

        // Execute query 
        const requests = [];
        const outputData = [];
        const cursor = watchlist.find(query);

        // Print a message if no documents were found
        if ((await watchlist.countDocuments(query)) !== 0) {
            // Print returned documents
            for await (const doc of cursor) {
                requests.push(getQuoteData(doc._id)); 
                outputData.push({name:doc.name, ticker:doc._id});
            }

            const responses = await Promise.all(requests); 
            
            responses.forEach(function (arrayItem, index) {
                outputData[index].c=arrayItem.data.c;                  
                outputData[index].d=arrayItem.data.d;                  
                outputData[index].dp=arrayItem.data.dp;                  
            });    
        }

        res.json(outputData)

    } catch(err) {
        console.error("Error(Watchlist): ", err);

        } finally {
        // Ensures that the client will close when you finish/error
        //await dbClient.close();
console.log('Keeping connection open');
        }

})

app.get("/portfolio/all", async (req, res) => {
    try {
        console.log("Fetching all Portfolio data.");
        // Connect the client to the server	(optional starting in v4.7)
        // await dbClient.connect();

        const database = dbClient.db("ticker_app");
        
        const portfolio = database.collection("portfolio");

        const wallet = database.collection("wallet");
        const walletData = await wallet.findOne();

        
        const query = {};

        // Execute query 
        const requests = [];
        const outputData = [];
        const cursor = portfolio.find(query);

        // Print a message if no documents were found
        if ((await portfolio.countDocuments(query)) !== 0) {
            // Print returned documents
            for await (const doc of cursor) {
                requests.push(getQuoteData(doc._id)); 
                outputData.push(doc);
            }

            const responses = await Promise.all(requests); 
            
            responses.forEach(function (arrayItem, index) {
              outputData[index].c=arrayItem.data.c;
              outputData[index].tickerSymbol = outputData[index]._id; 
            //   outputData[index].acs = outputData[index].totalCost/outputData[index].quantity;
            //   outputData[index].marketValue = outputData[index].quantity*arrayItem.data.c;
            //   outputData[index].changePercent = ((outputData[index].marketValue-outputData[index].totalCost)/outputData[index].totalCost)*100;             
              delete outputData[index]._id;                  
            });    
        }

        res.json({balance:walletData.balance, stocks:outputData})

    } catch(err) {
        console.error("Error(Portfolio): ", err);

      } finally {
        // Ensures that the client will close when you finish/error
        //await dbClient.close();
console.log('Keeping connection open');
      }

})

app.listen(port, () => {
    console.log(`Stock Ticker App listening on port ${port}`)
})

establishConnection();
