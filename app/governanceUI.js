var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var fs = require('fs');
var util = require('util');
var Web3 = require('web3');
var moment = require('moment');
var Promise = require('promise');
// var storage = require('azure-storage');
var appjson = require('./version.json')
var net = require('net');
var Web3 = require('web3');

/*
 * Parameters
 */
var listenPort = process.argv[2] || "3002";
var consortiumId = process.argv[3] || "111";
process.env['AZURE_STORAGE_ACCOUNT'] = process.argv[4] || "dontcare";
process.env['AZURE_STORAGE_ACCESS_KEY'] = process.argv[5] || "dontcare";
var containerName = process.argv[6] || "dontcare";
var identityBlobPrefix = process.argv[7] || "passphrase-";
var ethRpcPort = process.argv[8] || "8546";
var validatorListBlobName = process.argv[9] || "AddressList.json";
var paritySpecBlobName = process.argv[10] || "spec.json";
var valSetContractBlobName = process.argv[11] || "../contracts/SimpleValidatorSet.sol";
var adminContractBlobName = process.argv[12] || "../contracts/AdminValidatorSet.sol";
var adminContractABIBlobName = process.argv[13] || "../contracts/AdminValidatorSet.sol.abi";
var logFilePath=process.argv[14] || "log1.txt";

/*
 * Constants
 */
const refreshInterval = 10000;
const nodeRegexExp = /enode:\/\/\w{128}\@(\d+.\d+.\d+.\d+)\:\d+$/;
// var blobService = storage.createBlobService();
const recentBlockDecrement = 10; // To find a recent block for "/networkInfo", take the "currentBlock - recentBlockDecrement"

var app = express();

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
      json: function(context) {
        return JSON.stringify(context);
      }
  },
 }));
app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(express.static('share'));
app.use('/assets', express.static('assets'))
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

var activeNodes = [];
var abiContent = '';
var timeStamp;
var addressList = undefined;

process.on('uncaughtException', err => {
  if (err.message.includes("ECONNRESET")) {
    console.log(err);
  } else throw err;
});
process.on('unhandledRejection', err => {
  if (err.message.includes("ECONNRESET")) {
    console.log(err);
  } else throw err;
});

// Set logging
var log_file = fs.createWriteStream(logFilePath, {
  flags: 'a'
});
var log_stdout = process.stdout;

console.log = function (d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

/*
 * Output Parameters to log file
 */
console.log("etheradmin.js starting parameters")
console.log(`listenPort: ${listenPort}`)
console.log(`consortiumId: ${consortiumId}`)
console.log(`containerName: ${containerName}`)
console.log(`identityBlobPrefix: ${identityBlobPrefix}`)
console.log(`ethRpcPort: ${ethRpcPort}`)
console.log(`validatorListBlobName: ${validatorListBlobName}`)
console.log(`paritySpecBlobName: ${paritySpecBlobName}`)
console.log(`valSetContractBlobName: ${valSetContractBlobName}`)
console.log(`adminContractBlobName: ${adminContractBlobName}`)
console.log(`adminContractABIBlobName: ${adminContractABIBlobName}`)
console.log(`Started EtherAdmin website - Ver.${appjson.version}`);


function getRecentBlock() {
  return new Promise(function (resolve, reject) {
    try {
      var web3RPC = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:' + ethRpcPort));
    } catch (err) {
      console.log(err);
    }
    var latestBlockNumber = web3RPC.eth.blockNumber;
    var recentBlockNumber = Math.max(latestBlockNumber - recentBlockDecrement, 1);

    web3RPC.eth.getBlock(recentBlockNumber, function (error, result) {
      if (!error) {
        resolve(result);
      } else {
        reject('Unable to get a recent block');
      }
    })
  });
}


/* 
 * Given a node hostinfo object, collect node information (Consortium Id, PeerCount, Latest Block #) 
 */
function getNodeInfo(hostinfo, ipAddress) {
  return new Promise(function (resolve, reject) {
    try {
      var web3RPC = new Web3(new Web3.providers.HttpProvider('http://' + ipAddress + ':' + ethRpcPort));
    } catch (err) {
      console.log(err);
    }
    var web3PromiseArray = [];
    web3PromiseArray.push(new Promise(function (resolve, reject) {
      web3RPC.net.getPeerCount(function (error, result) {
        if (!error) {
          resolve(result);
        } else {
          resolve('Not running');
        }
      })
    }));
    web3PromiseArray.push(new Promise(function (resolve, reject) {
      web3RPC.eth.getBlockNumber(function (error, result) {
        if (!error) {
          resolve(result);
        } else {
          resolve('Not running');
        }
      })
    }));
    Promise.all(web3PromiseArray).then(function (values) {
      var peerCount = values[0];
      var blockNumber = values[1];
      var nodeInfo = {
        hostname: hostinfo.hostname,
        peercount: peerCount,
        blocknumber: blockNumber,
        consortiumid: consortiumId,
        enodeUrl: hostinfo.enodeUrl
      }
      resolve(nodeInfo);
    });
  });
} 

function getAddressListExists() {
  return new Promise((resolve, reject) => {
    blobService.doesBlobExist(containerName, validatorListBlobName, function (err, result) {
      if (err) {
        console.log(`Error trying to determine if ${validatorListBlobName} exists in ${containerName}`);
        console.error(err);
        reject(err);
      } else {
        resolve(result.exists);
      }
    })
  })
}

function getAddressListContents() {
  return new Promise((resolve, reject) => {
    getAddressListExists()
      .then(function (exists) {
        if (exists) {
          console.log(`${validatorListBlobName} file exists.`);

          var addressListPromise = new Promise((resolve, reject) => {
            blobService.getBlobToText(
              containerName,
              validatorListBlobName,
              function (err, blobText, blockBlob) {
                if (err) {
                  reject(err);
                } else {
                  console.log(`${validatorListBlobName} contents: ${blobText}`)
                  var addressListObject = JSON.parse(blobText);
                  resolve(addressListObject)
                }
              }
            )
          });
          addressListPromise.then((result) => {
            resolve(result);
          });
        } else {
          resolve(null);
        }
      });
  });
}

function getBlobs(continuationToken = null) {
  var promise = new Promise((resolve, reject) => {
    resolve(["passphrase-0.json","passphrase-1.json", "passphrase-2.json", "passphrase-3.json"]);
  });
  return promise;
}

function getLeasedBlobList(listBlobs) {
  var promise = new Promise((resolve, reject) => {
    var x = 100;
    resolve([
      {
        name: 'passphrase-0.json',
        state: 'leased'
      },
      {
        name: 'passphrase-1.json',
        state: 'leased'
      },
      {
        name: 'passphrase-2.json',
        state: 'leased'
      },
      {
        name: 'passphrase-3.json',
        state: 'leased'
      },
      {
        name: 'passphrase-4.json',
        state: 'leased'
      },
      {
        name: 'passphrase-5.json',
        state: 'leased'
      },
      {
        name: 'passphrase-6.json',
        state: 'leased'
      }
    ]);
  });
  return promise;
}

function getAbiDatafromBlob() {
  var abiPromise = new Promise((resolve, reject) => {
    var contract = require("../build/contracts/AdminValidatorSet.json");
    var simpleContract = require("../build/contracts/SimpleValidatorSet.json");
    var addresses = require("../keystore/contractsConfig.json");
    resolve(JSON.stringify({contract, simpleContract, 
      adminValidatorSetAddress: addresses.adminValidatorSetAddress,
      simpleValidatorSetAddress: addresses.simpleValidatorSetAddress }));
  });
  abiPromise.then(function (contents) {
    contents = JSON.parse(contents);
    abiContent = contents.contract.abi;
    simpleContent = contents.simpleContract.abi;
    adminValidatorSetAddress = contents.adminValidatorSetAddress;
    simpleValidatorSetAddress = contents.simpleValidatorSetAddress;
  });
}

function getActiveNodeDetails(leasedList) {
  var nodePromiseArray = [];
  var promise = new Promise((resolve, reject) => {
    if (leasedList.length == 0) {
      // No list       
      resolve([]);
    }

    leasedList.forEach((value) => {

      var filecontent = require("./config/"+value.name);
      var result = filecontent.enodeUrl.match(nodeRegexExp);

      var promise = new Promise(function (resolve, reject) {
        resolve(getNodeInfo(filecontent, "localhost"));
      });

      nodePromiseArray.push(promise);
    });

    Promise.all(nodePromiseArray).then(function (values) {
      if (values.length == 0) {
        resolve("No Values");
      }
      timeStamp = moment().format('h:mm:ss A UTC,  MMM Do YYYY');
      var resultSet = values.sort();
      resolve(resultSet);
    });
  });

  return promise;
  }

function getNodesfromBlob() {
  // Get Node info
  getBlobs()
    .then(getLeasedBlobList)
    .then(getActiveNodeDetails).catch(function (error) {
      console.log(`Error occurs while getting node details : ${error}`);
    })
    .then(function (activeNodesList) {
      activeNodes = activeNodesList;
    });
}

console.log('Start EtherAdmin Site');
setInterval(getNodesfromBlob, refreshInterval);
getAbiDatafromBlob();
// getAddressListContents().then((result) => {
//   if (result) {
//     console.log(`getAddressListContents() returns: ${JSON.stringify(result)}`);
//     addressList = result;
//   } else {
//     console.log(`${validatorListBlobName} does not exist`);
//   }
// });

app.get('/', function (req, res) {
  var hasNodeRows = activeNodes.length > 0;
  if (hasNodeRows) {
    var data = {
      hasNodeRows: hasNodeRows,
      consortiumid: consortiumId,
      nodeRows: activeNodes,
      timestamp: timeStamp,
      refreshinterval: (refreshInterval / 1000),
      contractAbi: abiContent,
      nodes: {
        adminContractAbi: JSON.stringify(abiContent),
        adminContractAddress: adminValidatorSetAddress,
        simpleContractAbi: JSON.stringify(simpleContent),
        simpleContractAddress: simpleValidatorSetAddress
      }
    };
    res.render('etheradmin', data);
  } else {
    res.render('etherstartup');
  }
});

// Get:networkinfo
app.get('/networkinfo', function (req, res) {
  var networkInfo = new NetworkInfo();
  networkInfo.adminContractABI = abiContent;
  if (addressList)
    networkInfo.addressList = addressList;
  // Get Node info
  getBlobs()
    .then(getLeasedBlobList)
    .then(getActiveNodeDetails).catch(function (error) {
      console.log(`Error occurs while getting node details : ${error}`);
      networkInfo.errorMessage += error + "\n";
    })
    .then(function (activeNodesList) {
      if (activeNodesList.length > 0) {
        activeNodesList.forEach((nodeInfo) => {
          networkInfo.bootnodes.push(nodeInfo.enodeUrl);
        });

      } else {
        networkInfo.errorMessage += "Couldn't find any active nodes\n";
      }
    })
    .then(getRecentBlock)
    .then(function (recentBlock) {
      // Get paritySpecBlobName
      networkInfo.recentBlock = recentBlock;
      networkInfo.paritySpec = '{ "params": {"networkID":"2018"} }';

      networkInfo.adminContract = fs.readFileSync("../contracts//AdminValidatorSet.sol")
      networkInfo.valSetContract = fs.readFileSync("../contracts/SimpleValidatorSet.sol");
      res.send(JSON.stringify(networkInfo));
    })
})

// Used for sharing information about the network to joining members
function NetworkInfo() {
  // Indicates break in compatibility
  this.majorVersion = 0;
  // Indicates backward compatible change
  this.minorVersion = 0;
  this.bootnodes = [];
  this.valSetContract = "";
  this.adminContract = "";
  this.adminContractABI = "";
  this.paritySpec = "";
  this.errorMessage = "";
  this.recentBlock = "";
}

app.get('/AdminValidatorSet.js', function (req, res) {
  var file = __dirname.replace("/app", "") + '/adminvalidatorset.js';
  res.download(file);
});

app.get('/SimpleValidatorSet.js', function (req, res) {
  var file = __dirname.replace("/app", "") + '/simplevalidatorset.js';
  res.download(file);
});

app.get('/ethereumjs-tx-1.3.3.min.js', function (req, res) {
  var file = __dirname.replace("/app", "/app/dist") + '/ethereumjs-tx-1.3.3.min.js';
  res.download(file);
});

app.get('/web3util.js', function (req, res) {
  var file = __dirname + '/web3util.js';
  res.download(file);
});

app.get('/web3.1-beta.js', function (req, res) {
  var file = __dirname.replace("/app", "/app/dist") + '/web3.min.js';
  res.download(file);
});

app.listen(listenPort, function () {
  console.log('Admin webserver listening on port ' + listenPort);
});

app.post('/istanbul_propose', function(req, res) {
  var web3 = new Web3(new Web3.providers.IpcProvider('/Users/ashwath.s/eth/geth.ipc', net));

  web3.eth.getCoinbase((err, coinbase) => {
    //let coinbase = web3.eth.coinbase;
    if(coinbase === req.body.account) {
      var message = {
        method: "istanbul_propose",
        params: [validator, req.body.proposal],
        jsonrpc: "2.0",
        id: new Date().getTime()
      };
    
      web3.currentProvider.send(message, (err,result)=>{
          console.log("received results:removeIstanbulValidator");
          if(result){
              console.log("results", result.result);
              res.status(200).send(result);
          }
          else if(err) {
            console.log("print result", err);
            res.status(500).send(err);
          }
      });
      
    }
    res.status(400).send("Invalid sender address for the node")
  });
});
