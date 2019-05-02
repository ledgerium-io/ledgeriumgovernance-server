var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var fs = require('fs');
var Utils = require('../web3util');
var moment = require('moment');
var Promise = require('promise');
var appjson = require('./version.json')
var net = require('net');
var Web3 = require('web3');
const ethUtil = require('ethereumjs-util');
const utils = new Utils();
const execSync = require('child_process').execSync;
const currentIp = execSync('curl -s https://api.ipify.org');
const sigUtil = require('eth-sig-util');
/*
 * Parameters
 */
var gethIp = process.argv[2] || "localhost";
var gethIpRpcPort = process.argv[3] || "8545";
var privatekey = process.argv[4] || "fd53aa6ddae9d3848c2f961b8050991451112089de72bea8348482988cff8bb2";

var listenPort = "3003";
var consortiumId = "2018";
var ethRpcPort = gethIpRpcPort;

/*
 * Constants
 */
const refreshInterval = 60000;
const nodeRegexExp = /enode:\/\/\w{128}\@(\d+.\d+.\d+.\d+)\:\d+$/;
var hostURL = "http://" + gethIp + ":" + ethRpcPort;
var activeNodes = [];
var abiContent = '';
var adminContractABI = '';
var simpleContractABI = '';
var networkManagerContractABI = '';
var adminValidatorSetAddress, simpleValidatorSetAddress, networkManagerAddress;
var timeStamp;
var web3RPC = new Web3(new Web3.providers.HttpProvider(hostURL));
var networkmanagerContract;
var app = express();
var tokenMap = {};

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: {
    json: function (context) {
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


/*
 * Output Parameters to log file
 */
console.log("governanceapp starting parameters")
console.log(`consortiumId: ${consortiumId}`)
console.log(`listenPort: ${listenPort}`)
console.log(`ethRpcPort: ${ethRpcPort}`)
console.log(`validator node: ${hostURL}`)
console.log(`Started Governanceapp website - Ver.${appjson.version}`);

getAbiData();
networkmanagerContract = new web3RPC.eth.Contract(JSON.parse(networkManagerContractABI), networkManagerAddress);
getNodesfromBlockchain();

function getRecentBlock() {
  return new Promise(function (resolve, reject) {
    var latestBlockNumber;
    //web3RPC = undefined;
    web3RPC.eth.getBlockNumber(function (err, latest) {
      if (err) {
        reject(`getBlockNumber error $(err)`);
      }
      else {
        latestBlockNumber = latest;
        web3RPC.eth.getBlock(latestBlockNumber, function (error, result) {
          if (!error) {
            resolve(result);
          } else {
            reject('Unable to get a recent block');
          }
        }); //web3RPC.eth.getBlock
      }// else err  
    }) //web3RPC.eth.getBlockNumber
  }); //new Promise(function (resolve, reject)
}

/* 
 * Given a node hostinfo object, collect node information (Consortium Id, PeerCount, Latest Block #) 
 */
function getNodeInfo(indexNode) {
  return new Promise(function (resolve, reject) {
    readNodesFromNetworkManager(indexNode)
      .then(function (nodeInfo) {
        resolve(nodeInfo);
      });//end of then
  });
  // });
}

function readNodesFromNetworkManager(nodeIndex) {
  return new Promise(function (resolve, reject) {
    if (networkmanagerContract == undefined)
      reject('NetworkManagerContract not initialised!');
    networkmanagerContract.methods.getNodesCounter().call(function (error, noOfNodes) {
      if (!error) {
        ////(`No of nodes: ${noOfNodes}`)
        if (nodeIndex < noOfNodes) {
          networkmanagerContract.methods.getNodeDetails(nodeIndex).call(function (error, result) {
            if (!error) {
              //console.log(`details of: ${nodeIndex}`)
              //console.log(`HostName : ${result.hostName} \nRole : ${result.role} \nIPAddress : ${result.ipAddress}  \nPort : ${result.port} \nPublic key : ${result.publicKey} \nEnode : ${result.enode}`);
              var nodeInfo = {
                hostname: result.hostName,
                role: result.role,
                ipaddress: result.ipAddress,
                port: result.port,
                publickey: result.publicKey,
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
    if (networkmanagerContract) {
      networkmanagerContract.methods.getNodesCounter().call(function (error, noOfNodes) {
        if (!error) {
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
  //console.log("networkManagerContractABI",networkManagerContractABI);

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
    for (var index = 0; index < noOfNodes; index++) {
      var promise = new Promise(function (resolve, reject) {
        resolve(getNodeInfo(index));
      });
      nodePromiseArray.push(promise);
    }
    Promise.all(nodePromiseArray).then(function (values) {
      if (values.length == 0) {
        resolve("No Values");
      }
      //timeStamp = moment().format('h:mm:ss A UTC,  MMM Do YYYY'); 
      var resultSet = values.sort();
      resolve(resultSet);
    });
  });
  return promise;
}

function getNodesfromBlockchain() {
  return new Promise(function (resolve, reject) {
    // Get Node info
    getNoOfNodes()
      .then(getActiveNodeDetails).catch(function (error) {
        console.log(`Error occurs while getting node details : ${error}`);
        reject('Unable to get active nodes');
      })
      .then(function (activeNodesList) {
        //console.log("getActiveNodeDetails output", activeNodesList);
        if (activeNodesList == undefined)
          activeNodes = [];
        activeNodes = activeNodesList;
        resolve(activeNodes);
      });
  });
}

function getIstanbulSnapshot(url) {
  return new Promise((resolve, reject) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(url));
    w3.currentProvider.send({
      method: "istanbul_getSnapshot",
      params: [],
      jsonrpc: "2.0",
      id: new Date().getTime()
    }, (err, result) => {
      //("received results:removeIstanbulValidator");
      if (err) {
        reject(err);
      } else {
        resolve(result.result);
      }
    });
  });
}

async function synchPeers(URL) {

  var nodesList = await getAdminPeers(URL);
  var ethAccountToUse = '0x' + ethUtil.privateToAddress('0x' + privatekey).toString('hex');

  var nodesListBlockchain = [];
  var noOfNodes = await networkmanagerContract.methods.getNodesCounter().call();
  console.log("No of Nodes -", noOfNodes);
  for (let nodeIndex = 0; nodeIndex < noOfNodes; nodeIndex++) {
    let result = await networkmanagerContract.methods.getNodeDetails(nodeIndex).call();
    nodesListBlockchain.push(result);
  }

  for (var index = 0; index < nodesList.length; index++) {
    let flag = false;
    for (let nodeIndex = 0; nodeIndex < noOfNodes; nodeIndex++) {
      var nodeBlockChain = nodesListBlockchain[nodeIndex];
      if (nodesList[index].enode == nodeBlockChain.enode) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      let encodedABI = networkmanagerContract.methods.registerNode(nodesList[index].hostname,
        nodesList[index].hostname,
        nodesList[index].role,
        nodesList[index].ipaddress,
        nodesList[index].port,
        nodesList[index].publickey,
        nodesList[index].enode
      ).encodeABI();
      var transactionObject = await utils.sendMethodTransaction(ethAccountToUse, networkManagerAddress, encodedABI, privatekey, web3RPC, 0);
      console.log("TransactionLog for adding peer", nodesList[index].enode, "Network Manager registerNode -", transactionObject.transactionHash);
    }
  }
  return;
}

async function getAdminPeers(url) {
  return new Promise(function (resolve, reject) {
    let nodesList = [];
    const w3 = new Web3(new Web3.providers.HttpProvider(url));
    w3.currentProvider.send({
      jsonrpc: '2.0',
      id: new Date().getTime(),
      method: 'admin_peers',
      params: []
    }, function (err, retValue) {
      if (err) {
        reject("Admin peers returned null");
      }
      w3.currentProvider.send({
        jsonrpc: '2.0',
        id: new Date().getTime(),
        method: 'admin_nodeInfo',
        params: []
      }, function (error, curNode) {
        if (error) {
          reject("Admin peers returned null");
        }
        nodesList.push({
          enode: curNode.result.id,
          name: curNode.result.name.split("/")[1],
          role: "Node",
          ip: currentIp,
          publicKey: '0x' + ethUtil.pubToAddress('0x' + curNode.result.id).toString('hex'),
          port: curNode.result.ports.listener
        });
        for (var i in retValue.result) {
          Ip = retValue.result[i].network.remoteAddress.split(":");
          nodesList.push({
            name: retValue.result[i].name.split('/')[1],
            role: "Node",
            ip: Ip[0],
            port: Ip[1],
            publicKey: '0x' + ethUtil.pubToAddress('0x' + retValue.result[i].id).toString('hex'),
            enode: retValue.result[i].id
          });
        }
        resolve(nodesList);
      });
    });
  });
}

// Used for sharing information about the network to joining members
function NetworkInfo() {
  this.adminContractABI = "";
  this.networkID = "";
  this.errorMessage = "";
  this.recentBlock = "";
}

app.get('/', async function (req, res) {
  var data = {
    consortiumid: consortiumId,
    timestamp: moment().format('h:mm:ss A UTC,  MMM Do YYYY'),
    refreshinterval: (refreshInterval / 1000),
    nodeRows: [],
    hasNodeRows: 0,
    snapshot: {
      validators: []
    }
  };
  getAdminPeers(hostURL)
    .then((activeNodes) => {
      data.nodeRows = activeNodes;
      data.hasNodeRows = activeNodes.length;
      getIstanbulSnapshot(hostURL)
        .then((snapshot) => {
          data.snapshot = snapshot;
          res.render('etheradmin', data);
        })
        .catch((err) => {
          console.log("error at istanbul snapshot", err);
          res.render('etheradmin', data);
        })
    })
    .catch((err) => {
      console.log("error at getting admin list", err);
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
      res.send(JSON.stringify(networkInfo));
    })
    .catch(function (error) {
      console.log(`Error getRecentBlock : ${error}`);
      res.send(JSON.stringify(networkInfo));
    })
})

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

app.post('/start_propose', (req, res)=>{
  console.log("Istanbul propose started");
  if(typeof req.body.proposal != 'boolean' || typeof req.body.sender != 'string' || typeof req.body.vote != 'string'){
    console.log("Type Error");
    res.status(405).send({ message: "Wrong typeof request" });
    return;
  }
  var methodData = '';
  const web3 = new Web3(new Web3.providers.IpcProvider('/home/vivek/projects/ledgerium/ledgeriumtools/output/validator-msc0/geth.ipc', net));
  const Admin = new web3.eth.Contract(JSON.parse(adminContractABI), adminValidatorSetAddress);
  console.log("Checking Votes");
  Admin.methods.checkVotes(req.body.vote).call({ from : req.body.sender })
  .then((result)=>{
    if(result[0] == '0' && result[1] == '0'){
      if(req.body.proposal){
        console.log("create proposal");
        methodData = Admin.methods.proposalToAddAdmin(req.body.vote).encodeABI();
      }
      else{
        console.log("remove proposal");
        methodData = Admin.methods.proposalToRemoveAdmin(req.body.vote).encodeABI();
      }
    }else{
      if(req.body.proposal){
        console.log("vote add");
        methodData = Admin.methods.voteForAddingAdmin(req.body.vote).encodeABI();
      }
      else{
        console.log("vote remove");
        methodData = Admin.methods.voteForRemovingAdmin(req.body.vote).encodeABI();
      }
    }
    web3.eth.getTransactionCount(req.body.sender,(err, nonceToUse)=>{
      if(err){
        console.log("Error Getting Transaction Count");
        console.log(err);
        res.status(405).send({});
      }else{
        console.log("Got Transaction Count");
        const token = '0x'+ethUtil.keccak256(Math.random().toString()).toString('hex');
        tokenMap[token] = true;
        res.status(200).send({
          tx:{
            nonce: nonceToUse,
            gasPrice: '0x4A817C800', //20Gwei
            gasLimit: '0x47b760',//'0x48A1C0',//web3.utils.toWei(20,'gwei'), //estimatedGas, // Todo, estimate gas
            from: req.body.sender,
            to: adminValidatorSetAddress,
            value: web3.utils.toHex(0),
            data: methodData
          },
          token : token
        });
        console.log("Response Sent");
      }
    })
  })
  .catch((err)=>{
    console.log("Error Checking Votes");
    console.log(err);
    res.status(500).send();
  });
});

app.listen(listenPort, function () {
  //('Admin webserver listening on port ' + listenPort);
});

app.post('/istanbul_propose', function (req, res) {
  console.log("Istanbul Propose Started");
  const web3 = new Web3(new Web3.providers.IpcProvider('/eth/geth.ipc', net));
  if(!tokenMap[req.body.hash] ){//|| !req.body.transactionHash){
    console.log("Incomplete Request or Wrong Request");
    res.status(400).send({ message:"agalla" });
    return;
  }
  delete tokenMap[req.body.hash];
  const recovered = sigUtil.recoverPersonalSignature({ data: req.body.hash, sig:req.body.signature});
  web3.eth.getCoinbase((err, coinbase) => {
    console.log("Got Coinbase Account");
    if (coinbase && (coinbase.toLowerCase() === recovered.toLowerCase())) {
      console.log("Signatures from Request and Token Match");
      if (typeof req.body.proposal != 'boolean' || typeof req.body.account != 'string'){
        console.log("Request Variables Are Of Wrong Type");
        res.status(405).send({ mes: "wrong request" });
      }
      var message = {
        method: "istanbul_propose",
        params: [req.body.account, req.body.proposal],
        jsonrpc: "2.0",
        id: new Date().getTime()
      };
      let count = 0;
      const getTransactionReceipt = (hash)=>{
        count++;
        if(count == 30){
          console.log("Transaction Receipt Not Received Within 30 Seconds");
          res.status(500).send({ err: "error" });
          return;
        }
        web3.eth.getTransactionReceipt(hash,(err,callbackReceipt)=>{
          if(callbackReceipt && callbackReceipt.status){
            web3.currentProvider.send(message, (err, result) => {
              if (result) {
                console.log("Istanbul Propose Successful");
                res.status(200).send({ result: "success" });
              }
              else {
                console.log("Istanbul Propose Failed");
                res.status(500).send({ err: "error" });
              }
            });
          }else if( !callbackReceipt ) {
            setTimeout(getTransactionReceipt, 1000, hash);                  
          }else if(!callbackReceipt.status){
            console.log("Blockchain Transaction Failed");
            res.status(500).send({ err: "error" });
          }
        });
      }
      console.log("Getting Transaction Receipt");
      getTransactionReceipt(req.body.transactionHash);
    }
    else {
      console.log("wrong signature");
      res.status(400).send("Not an Admin Account");
    }
  });
});