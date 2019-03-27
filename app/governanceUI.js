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
var ethRpcPort = gethIpRpcPort;

/*
 * Constants
 */
const refreshInterval = 60000;
const nodeRegexExp = /enode:\/\/\w{128}\@(\d+.\d+.\d+.\d+)\:\d+$/;

//const recentBlockDecrement = 10; // To find a recent block for "/networkInfo", take the "currentBlock - recentBlockDecrement"
var activeNodes = [];
var abiContent = '';
var adminContractABI = '';
var simpleContractABI = '';
var networkManagerContractABI = '';
var adminValidatorSetAddress, simpleValidatorSetAddress, networkManagerAddress;

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
    //(err);
  } else throw err;
});
process.on('unhandledRejection', err => {
  if (err.message.includes("ECONNRESET")) {
    //(err);
  } else throw err;
});

// Set logging
// var log_file = fs.createWriteStream(logFilePath, {
//   flags: 'a'
// });
// var log_stdout = process.stdout;

// // = function (d) {
//   log_file.write(util.format(d) + '\n');
//   log_stdout.write(util.format(d) + '\n');
// };

/*
 * Output Parameters to log file
 */
//("governanceapp starting parameters")
//(`consortiumId: ${consortiumId}`)
//(`listenPort: ${listenPort}`)
//(`ethRpcPort: ${ethRpcPort}`)
//(`validator node: http://${gethIp}:${ethRpcPort}`)
////(`Started Governanceapp website - Ver.${appjson.version}`);

//('Start EtherAdmin Site');
//setInterval(getNodesfromBlockchain, 120000);

getNodesfromBlockchain();

function readNetworkManagerContract() {
  //("networkManagerAddress",networkManagerAddress);
  var web3RPC = new Web3(new Web3.providers.HttpProvider(`http://${gethIp}:${ethRpcPort}`));
  networkmanagerContract = new web3RPC.eth.Contract(JSON.parse(networkManagerContractABI),networkManagerAddress);
  //("networkmanagerContract ", networkmanagerContract);
}

function getRecentBlock() {
  return new Promise(function (resolve, reject) {
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
      readNodesFromNetworkManager(indexNode)
      .then(function(nodeInfo){
            resolve(nodeInfo);
        });//end of then
      });
  // });
}

function readNodesFromNetworkManager(nodeIndex) {
  return new Promise(function (resolve, reject) {
    if(networkmanagerContract == undefined)
    reject('NetworkManagerContract not initialised!');
    networkmanagerContract.methods.getNodesCounter().call(function (error, noOfNodes) {
      if (!error) {
        ////(`No of nodes: ${noOfNodes}`)
        if (nodeIndex < noOfNodes) {
          networkmanagerContract.methods.getNodeDetails(nodeIndex).call(function (error, result) {
            if (!error) {
              console.log(`details of: ${nodeIndex}`)
              console.log(`HostName : ${result.hostName} \nRole : ${result.role} \nIPAddress : ${result.ipAddress}  \nPort : ${result.port} \nPublic key : ${result.publicKey} \nEnode : ${result.enode}`);
              var nodeInfo = {
                hostname: result.hostName,
                role: result.role,
                ipaddress:result.ipAddress,
                port:result.port,
                publickey:result.publicKey,
                enode: result.enode
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
          console.log(`No of nodes: ${noOfNodes}`);
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

function getAbiData() {

  adminContractABI = fs.readFileSync(__dirname + "/../build/contracts/AdminValidatorSet.abi.json", 'utf8');
  simpleContractABI = fs.readFileSync(__dirname + "/../build/contracts/SimpleValidatorSet.abi.json", 'utf8');
  networkManagerContractABI = fs.readFileSync(__dirname + "/../build/contracts/NetworkManagerContract.abi.json", 'utf8');
  console.log("networkManagerContractABI",networkManagerContractABI);

  var addresses = require("../keystore/contractsConfig.json");
  adminValidatorSetAddress = addresses.adminValidatorSetAddress;
  simpleValidatorSetAddress = addresses.simpleValidatorSetAddress;
  networkManagerAddress = addresses.networkManagerAddress;
}

function getActiveNodeDetails(noOfNodes) {
  var nodePromiseArray = [];
  var promise = new Promise((resolve, reject) => {
    if (noOfNodes.length == 0) {
      resolve([]);
    }
    for(var index = 0; index < noOfNodes; index++) {
      var promise = new Promise(function (resolve, reject) {
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

function getNodesfromBlockchain() {
  return new Promise(function (resolve, reject) {
    getAbiData();
    readNetworkManagerContract();
    // Get Node info
    getNoOfNodes()
      .then(getActiveNodeDetails).catch(function (error) {
        console.log(`Error occurs while getting node details : ${error}`);
        reject('Unable to get active nodes');
      })
      .then(function (activeNodesList) {
        console.log("getActiveNodeDetails output", activeNodesList);
        if(activeNodesList == undefined)
          activeNodes = [];
        activeNodes = activeNodesList;
        resolve(activeNodes);
      });
  });
}

app.get('/', function (req, res) {
  var data = {
    consortiumid: consortiumId,
    refreshinterval: (refreshInterval / 1000),
    contractAbi: adminContractABI,
    nodes: {
      adminContractAbi: adminContractABI,
      adminContractAddress: adminValidatorSetAddress,
      simpleContractAbi: simpleContractABI,
      simpleContractAddress: simpleValidatorSetAddress
    }
  }

  getNodesfromBlockchain()
  .then(function (activeNodes) {
    if(activeNodes == undefined) {
      data.hasNodeRows = 0;
      data.timestamp = timeStamp;
      data.nodeRows = [];
    } else {
      //console.log("activeNodes", activeNodes);
      data.hasNodeRows = activeNodes.length;
      data.timestamp = "timeStamp";
      data.nodeRows = activeNodes; 
    }
    res.render('etheradmin', data);
  });
});

// Get:networkinfo
app.get('/networkinfo', function (req, res) {
  var networkInfo = new NetworkInfo();
  networkInfo.adminContractABI = abiContent;

  getRecentBlock()
  .then(function (recentBlock) {
    networkInfo.recentBlock = recentBlock;
    networkInfo.networkID = "2018";
    //networkInfo.adminContract = fs.readFileSync("../contracts/AdminValidatorSet.sol")
    //networkInfo.valSetContract = fs.readFileSync("../contracts/SimpleValidatorSet.sol");

  // getNodesfromBlockchain()
  // .then(function (activeNodesList) {
  //   if(activeNodesList == undefined) {
  //     //(`Error occurs while getting node details`);
  //     networkInfo.errorMessage += error + "\n";
  //   } else {
  //     //("activeNodes", activeNodesList);
  //     if (activeNodesList.length > 0) {
  //       activeNodes = activeNodesList;
  //       for(var index = 0; index < activeNodesList.length; index++) {
  //         var nodeInfo = activeNodesList[index];
  //         networkInfo.addressList.push(nodeInfo.publickey);
  //       }
  //     }
  //     else {
  //       networkInfo.errorMessage += "Couldn't find any active nodes\n";
  //     }  
  //   }
  //   res.send(JSON.stringify(networkInfo));
  // });
  //})
    // getNoOfNodes()
    // .then(getActiveNodeDetails).catch(function (error) {
    //   //(`Error occurs while getting node details : ${error}`);
    //   networkInfo.errorMessage += error + "\n";
    // })
    // .then(function (activeNodesList) {
    //   //("getActiveNodeDetails output", activeNodesList);
    //   if(activeNodesList == undefined)
    //     activeNodes = [];
    //   if (activeNodesList.length > 0) {
    //     activeNodes = activeNodesList;
    //     for(var index = 0; index < activeNodesList.length; index++) {
    //       var nodeInfo = activeNodesList[index];
    //       networkInfo.addressList.push(nodeInfo.publickey);
    //     }
    //   } else {
    //     networkInfo.errorMessage += "Couldn't find any active nodes\n";
    //   } 
    // })
    res.send(JSON.stringify(networkInfo));
  });
})

// Used for sharing information about the network to joining members
function NetworkInfo() {
  // Indicates break in compatibility
  //this.majorVersion = 0;
  // Indicates backward compatible change
  //this.minorVersion = 0;
  //this.valSetContract = "";
  //this.adminContract = "";
  this.adminContractABI = "";
  this.networkID = "";
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
  //('Admin webserver listening on port ' + listenPort);
});

app.post('/istanbul_propose', function(req, res) {
  var web3 = new Web3(new Web3.providers.IpcProvider('/eth/geth.ipc', net));

  //("Initiated a web3 ipc interface");
  web3.eth.getCoinbase((err, coinbase) => {
    //(`coinbase - ${coinbase} & sender - ${req.body.sender}`);
    if(coinbase && (coinbase.toLowerCase() === req.body.sender.toLowerCase())) {
      
      var message = {
        method: "istanbul_propose",
        params: [req.body.account, req.body.proposal],
        jsonrpc: "2.0",
        id: new Date().getTime()
      };

      //(JSON.stringify(message));

      web3.currentProvider.sendAsync(message, (err,result)=>{
          //("received results:removeIstanbulValidator");
          if(result){
              //("results", result.result);
              res.status(200).send(result);
          }
          else if(err) {
            //("print result", err);
            res.status(500).send(err);
          }
      });
      
    }
    else{
      res.status(400).send("Invalid sender address for the node");
    }
  });
});


