var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var fs = require('fs');
var util = require('util');
var Web3 = require('web3');
var moment = require('moment');
var Promise = require('promise');
var appjson = require('./version.json')
var net = require('net');
var Web3 = require('web3');

/*
 * Parameters
 */
var gethIp = process.argv[2];
var gethIpRpcPort = process.argv[3];

var listenPort = "3003";
var consortiumId = "2018";
var identityBlobPrefix = "passphrase-";
var ethRpcPort = gethIpRpcPort;
//////var validatorListBlobName = "AddressList.json";
var logFilePath = "log1.txt";

/*
 * Constants
 */
const refreshInterval = 60000;
const nodeRegexExp = /enode:\/\/\w{128}\@(\d+.\d+.\d+.\d+)\:\d+$/;

//const recentBlockDecrement = 10; // To find a recent block for "/networkInfo", take the "currentBlock - recentBlockDecrement"
var activeNodes = [];
var abiContent = '';
var timeStamp;
//var addressList = undefined;
var web3RPC = new Web3(new Web3.providers.HttpProvider(`http://${gethIp}:${ethRpcPort}`));
var networkmanagerContract;

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
console.log(`identityBlobPrefix: ${identityBlobPrefix}`)
console.log(`ethRpcPort: ${ethRpcPort}`)
//console.log(`validatorListBlobName: ${validatorListBlobName}`)
console.log(`validator node: http://${gethIp}:${ethRpcPort}`)
console.log(`Started EtherAdmin website - Ver.${appjson.version}`);

console.log('Start EtherAdmin Site');
setInterval(getNodesfromBlob, refreshInterval);
getAbiDatafromBlob();
readNetworkManagerContract();

function readNetworkManagerContract() {
  var networkManagerAddress = "0x0000000000000000000000000000000000002023";
  var web3RPC = new Web3(new Web3.providers.HttpProvider(`http://${gethIp}:${ethRpcPort}`));

  // Todo: Read ABI from dynamic source.
  var filename = __dirname + "/../build/contracts/NetworkManagerContract.abi";
  var json = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if(json == "") {    
    reject('Failed in reading NetworkManagerContract.abi!');
  }
  networkmanagerContract = new web3RPC.eth.Contract(json,networkManagerAddress);
}

function getRecentBlock() {
  return new Promise(function (resolve, reject) {
    console.log(web3RPC);
    var latestBlockNumber;
    web3RPC.eth.getBlockNumber(function(err, latest) {
      latestBlockNumber = latest;
      web3RPC.eth.getBlock(latestBlockNumber, function (error, result) {
        if (!error) {
          resolve(result);
        } else {
          reject('Unable to get a recent block');
        }
      });
    })
  });
}
/* 
 * Given a node hostinfo object, collect node information (Consortium Id, PeerCount, Latest Block #) 
 */
function getNodeInfo(indexNode) {
  return new Promise(function (resolve, reject) {
    var web3PromiseArray = [];
    web3PromiseArray.push(new Promise(function (resolve, reject) {
      web3RPC.eth.net.getPeerCount(function (error, result) {
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
      readNodesFromNetworkManager(indexNode)
      .then(function(nodeInfo){
            // var node = {
            //   hostname: nodeInfo.hostname,
            //   peercount: peerCount,
            //   blocknumber: blockNumber,
            //   consortiumid: 2018,
            //   enodeUrl: nodeInfo.enodeUrl
            // }
            resolve(nodeInfo);
        });//end of then
      });
  });
}

function readNodesFromNetworkManager(nodeIndex) {
  return new Promise(function (resolve, reject) {
    
    networkmanagerContract.methods.getNodesCounter().call(function (error, noOfNodes) {
      if (!error) {
        console.log(`No of nodes: ${noOfNodes}`)
        
        if (nodeIndex < noOfNodes) {
          networkmanagerContract.methods.getNodeDetails(nodeIndex).call(function (error, result) {
            if (!error) {
              console.log(`details of: ${nodeIndex}`)
              console.log(`ID : ${result.i} \nNode Name : ${result.n} \npublic key : ${result.p} \nrole : ${result.r} \nIP : ${result.ip} \nEnode : ${result.e}`);
              var nodeInfo = {
                nodename: result.n,
                hostname: result.ip,
                publickey:result.p,
                enodeUrl: result.e
              }
              resolve(nodeInfo);
            }
            else {
              console.log("NetworkManager.getNodeDetails failed!");
              reject('NetworkManager.getNodeDetails failed!');
            }
          });
        }
      } else {
        console.log("web3.eth.getNodesCounter failed!");
        reject('NetworkManager.getNodesCounter failed!');
      }
    });
  });//end of promise 
}

function getNoOfNodes() {
  var promise = new Promise((resolve, reject) => {
    if(networkmanagerContract) {
      networkmanagerContract.methods.getNodesCounter().call(function (error, noOfNodes) {
        if(!error) {
          resolve(noOfNodes);
        }
        else {
          reject('networkmanagerContract.getNodesCounter failed')
        }
      });
    }
  });
  return promise;
}

function getAbiDatafromBlob() {
  var abiPromise = new Promise((resolve, reject) => {
    var contract = require("../build/contracts/AdminValidatorSet.abi.json");
    var simpleContract = require("../build/contracts/SimpleValidatorSet.abi.json");
    var addresses = require("../keystore/contractsConfig.json");
    resolve(JSON.stringify({contract, simpleContract, 
      adminValidatorSetAddress: addresses.adminValidatorSetAddress,
      simpleValidatorSetAddress: addresses.simpleValidatorSetAddress }));
  });
  abiPromise.then(function (contents) {
    contents = JSON.parse(contents);
    abiContent = contents.contract;
    simpleContent = contents.simpleContract;
    adminValidatorSetAddress = contents.adminValidatorSetAddress;
    simpleValidatorSetAddress = contents.simpleValidatorSetAddress;
  });
}

function getActiveNodeDetails(noOfNodes) {
  var nodePromiseArray = [];
  var promise = new Promise((resolve, reject) => {
    if (noOfNodes.length == 0) {
      resolve([]);
    }

    for(var index = 0; index < noOfNodes; index++) {
      // var filecontent = require("./config/"+value.name);
      // var result = filecontent.enodeUrl.match(nodeRegexExp);
      var promise = new Promise(function (resolve, reject) {
        //resolve(getNodeInfo(filecontent, result[1]));
        resolve(getNodeInfo(index));
      });

      nodePromiseArray.push(promise);
    }

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
  getNoOfNodes()
    .then(getActiveNodeDetails).catch(function (error) {
      console.log(`Error occurs while getting node details : ${error}`);
    })
    .then(function (activeNodesList) {
      activeNodes = activeNodesList;
    });
}

app.get('/', function (req, res) {
  var hasNodeRows = activeNodes.length >= 0;
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
  // if (addressList)
  //   networkInfo.addressList = addressList;
  // Get Node info
  getNoOfNodes()
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
      networkInfo.recentBlock = recentBlock;
      networkInfo.paritySpec = '{ "params": {"networkID":"2018"} }';
      networkInfo.adminContract = fs.readFileSync("../contracts/AdminValidatorSet.sol")
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
  var web3 = new Web3(new Web3.providers.IpcProvider('/eth/geth.ipc', net));

  console.log("Initiated a web3 ipc interface");
  web3.eth.getCoinbase((err, coinbase) => {
    console.log(`coinbase - ${coinbase} & sender - ${req.body.sender}`);
    if(coinbase && (coinbase.toLowerCase() === req.body.sender.toLowerCase())) {
      
      var message = {
        method: "istanbul_propose",
        params: [req.body.account, req.body.proposal],
        jsonrpc: "2.0",
        id: new Date().getTime()
      };

      console.log(JSON.stringify(message));

      web3.currentProvider.sendAsync(message, (err,result)=>{
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
    else{
      res.status(400).send("Invalid sender address for the node");
    }
  });
});


