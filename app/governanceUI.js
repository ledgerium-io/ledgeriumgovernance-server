const express     = require('express');
const exphbs      = require('express-handlebars');
const bodyParser  = require('body-parser');
const fs          = require('fs');
const Utils       = require('../web3util');
const moment      = require('moment');
const Promise     = require('promise');
const appjson     = require('./version.json')
const net         = require('net');
const Web3        = require('web3');
const ethUtil     = require('ethereumjs-util');
const execSync    = require('child_process').execSync;
const sigUtil     = require('eth-sig-util');
const addresses   = require("../keystore/contractsConfig.json");
const EthereumTx  = require('ethereumjs-tx');
/*
 * Parameters
 */
const utils         = new Utils();
const currentIp     = String(execSync('curl -s https://api.ipify.org'));
const listenPort    = "3003";
const consortiumId  = "2018";
if(addresses.networkManagerAddress == undefined)
{
  console.log("networkManagerAddress was not defined")
  addresses.networkManagerAddress = "0x0000000000000000000000000000000000002023"
}
console.log("networkManagerAddress ", addresses.networkManagerAddress)

/*
 * Constants
 */
const refreshInterval           = 60000;
const hostURL                   = "http://" + (process.argv[2] || "localhost") + ":" + (process.argv[3] || "8545");
const adminContractABI          = fs.readFileSync(__dirname + "/../build/contracts/AdminValidatorSet.abi.json", 'utf8');
//const simpleContractABI         = fs.readFileSync(__dirname + "/../build/contracts/SimpleValidatorSet.abi.json", 'utf8');
const networkManagerContractABI = fs.readFileSync(__dirname + "/../build/contracts/NetworkManagerContract.abi.json", 'utf8');
var activeNodes                 = [];
const nodeMap                   = {};
const abiContent                = '';
const web3RPC                   = new Web3(new Web3.providers.HttpProvider(hostURL));
var networkManagerContract      = new web3RPC.eth.Contract(JSON.parse(networkManagerContractABI), addresses.networkManagerAddress);
const tokenMap                  = {};
const ipcPath                   = "/eth/geth.ipc";
const fixedGasPrice             = "0x77359400";
const fixedGasLimit             = '0x47b760';
const eNodeStr                  = "enode://"

/*
Set Up express to use handlebars and required Middleware
*/
const app = express();
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

/*
Exception Handler for an Uncaught Exception
*/
process.on('uncaughtException', err => {
  if (err.message.includes("ECONNRESET")) {
  } else throw err;
});
process.on('unhandledRejection', err => {
  if (err.message.includes("ECONNRESET")) {
  } else throw err;
});

/*
 * Output Parameters to log file
 */
console.log("governanceapp starting parameters")
console.log(`consortiumId: ${consortiumId}`)
console.log(`listenPort: ${listenPort}`)
console.log(`ethRpcPort: ${(process.argv[3] || "8545")}`)
console.log(`validator node: ${hostURL}`)
console.log(`Started Governanceapp website - Ver.${appjson.version}`);

const readNetworkManagerContractNodeList = ()=>{
  console.log("refreshing node list");  
  getAllNodeInfoFromContract()
  .then((allNodes)=>{
    console.log("refreshed List");
    activeNodes = allNodes;
    
  console.log("populating activenode public key map");
  for(var i=0; i< activeNodes.length; i++){
    nodeMap[activeNodes[i].publicKey] = true;
  }
  })
  .catch(console.log);
}

function getIstanbulSnapshot(url) {
  console.log("Istanbul Get Snapshot called");
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
        console.log("Istanbul Get Snapshot Error");
        reject(err);
      } else {
        console.log("Istanbul Get Snapshot Success");
        resolve(result.result);
      }
    });
  });
}

function getNetworkNodesList(url) {
  console.log("getNetworkNodesList called");
  return new Promise(function (resolve, reject) {
    let nodesList = [];
    const w3 = new Web3(new Web3.providers.HttpProvider(url));
    w3.currentProvider.send({
      jsonrpc: '2.0',
      id: new Date().getTime(),
      method: 'admin_nodeInfo',
      params: []
    }, function (error, curNode) {
    if (error) {
      console.log("getNetworkNodesList admin_nodeInfo Error");
      //reject("Admin peers returned null");
      resolve(nodesList);
      return;
    }
    //Add the the current info to the nodelist first
    //validate the values!
    if(!curNode.result.enode) {
      console.log("getNetworkNodesList listener call did not fetch node enode!");
      resolve(nodesList);
      return;
    }
    if(!curNode.result.name) {
      console.log("getNetworkNodesList listener call did not fetch node name!");
      resolve(nodesList);
      return;
    }
    if(!curNode.result.ports.listener) {
      console.log("getNetworkNodesList listener call did not fetch node listener port!");
      resolve(nodesList);
      return;
    }
    var role;
    var nodeID = curNode.result.enode.slice(eNodeStr.length,curNode.result.enode.indexOf("@"));
    currentPublicKey = '0x' + ethUtil.pubToAddress('0x' + nodeID).toString('hex')
    curNode.result.id = nodeID;
    if(nodeMap[currentPublicKey]) {
      role = "MasterNode"
    } 
    else {
      role = "PeerNode"
    }
    nodesList.push({
      enode: curNode.result.id,
      name: curNode.result.name.split("/")[1],
      role: role,
      ip: currentIp,
      publicKey: currentPublicKey,
      port: curNode.result.ports.listener
    });
    //Now add the the peer nodes info to the nodelist
    w3.currentProvider.send({
      jsonrpc: '2.0',
      id: new Date().getTime(),
      method: 'admin_peers',
      params: []
    }, function (err, retValue) {
        if (err) {
          console.log("getNetworkNodesList admin_peers Error");
          reject("Admin peers returned null");
        }
        var publicKey;
        for (var i in retValue.result) {
          //validate the values!
          if(!retValue.result[i].id) {
            console.log("getNetworkNodesList admin_peers call did not fetch node id!");
            resolve(nodesList);
          }
          if(!retValue.result[i].name) {
            console.log("getNetworkNodesList admin_peers call did not fetch node name!");
            resolve(nodesList);
            return;
          }
          if(!retValue.result[i].network.remoteAddress) {
            console.log("getNetworkNodesList admin_peers call did not fetch node IP address!");
            resolve(nodesList);
            return;
          }
          Ip = retValue.result[i].network.remoteAddress.split(":");
          publicKey = '0x' + ethUtil.pubToAddress('0x' + retValue.result[i].id).toString('hex')
          if(nodeMap[publicKey]) {
            role = "MasterNode"
          } 
          else {
            role = "PeerNode"
          }
          nodesList.push({
            name: retValue.result[i].name.split('/')[1],
            role: role,
            ip: Ip[0],
            port: Ip[1],
            publicKey: publicKey,
            enode: retValue.result[i].id
          });
        }
        console.log("getNetworkNodesList success");
        resolve(nodesList);
      });
    });
  });
}

function getRecentBlock() {
  console.log("getRecentBlock called");
  return new Promise((resolve,reject)=>{
    web3RPC.eth.getBlockNumber()
    .then((blockNumber)=>{
      console.log("getRecentBlock got blockNumber");
      return web3RPC.eth.getBlock(blockNumber);
    })
    .then((block)=>{
      console.log("getRecentBlock got complete block");
      resolve(block);
    })
    .catch((err)=>{
      console.log("error in getBlockNumber or getBlock");
      reject(err);
    });
  });
}

function readNodesFromNetworkManager (nodeIndex){
  return new Promise((resolve,reject)=>{
    if(!networkManagerContract){
      networkManagerContract = new web3RPC.eth.Contract(JSON.parse(networkManagerContractABI), addresses.networkManagerAddress);
      reject("Network Manager Contract not defined");
    }
    networkManagerContract.methods.getNodeDetails(nodeIndex)
    .call()
    .then(resolve)
    .catch(reject);
  })
}

function getAllNodeInfoFromContract(){
  console.log("getAllNodeInfoFromContract called");
  return new Promise((resolve, reject)=>{
    networkManagerContract.methods.getNodesCounter()
    .call()
    .then((nodeCount)=>{
      console.log("getAllNodeInfoFromContract got node count");
      const promises = [];
      for(var i=0; i<nodeCount; i++){
        promises.push(
          new Promise((resolveInternal,rejectInternal)=>{
            readNodesFromNetworkManager(i)
            .then(resolveInternal)
            .catch(rejectInternal);
          })
        );
      }
      Promise.all(promises)
      .then((allNodes)=>{
        console.log("getAllNodeInfoFromContract got all promises pending after sending transaction");
        const nodes = [];
        for(var i=0; i<allNodes.length; i++){
          nodes.push({
            hostName  : allNodes[i]['0'],
            role      : allNodes[i]['1'],
            ipAddress : allNodes[i]['2'],
            port      : allNodes[i]['3'],
            publicKey : allNodes[i]['4'],
            enode     : allNodes[i]['5']
          });
        }
        resolve(nodes);
      })
      .catch(reject);
    });
  });
}

const syncContractListToNetworkNodeList = async ()=> {
  peers = await getNetworkNodesList(hostURL);
  console.log("syncContractListToNetworkNodeList got admin peers");
  if(process.argv[4] == undefined) {
    return;
  }  
  fromAccountAddress = '0x' + ethUtil.privateToAddress(process.argv[4]).toString('hex')
  for(var index=0; index<peers.length; index++) {
    if(!nodeMap[peers[index].publicKey]) {
      console.log("New Peer to be added", peers[index].name, peers[index].publicKey);
      let encodedABI = networkManagerContract.methods.registerNode(peers[index].name,
        peers[index].name,
        peers[index].role,
        peers[index].ip,
        peers[index].port,
        peers[index].publicKey,
        peers[index].enode
      ).encodeABI();
      key = process.argv[4];
      if(key.indexOf("0x") == 0) {
        key = key.slice(2);
      }
      transactionObject = await utils.sendMethodTransaction(fromAccountAddress, addresses.networkManagerAddress,encodedABI, key, web3RPC, 0)
      console.log("TransactionLog for Network Manager registerNode -", transactionObject.transactionHash);
      nodeMap[peers[index].publicKey] = true;
    } //end of if
  }//end of for
}//end of syncContractListToNetworkNodeList

app.get('/', async function (req, res) {
  var data = {
    consortiumid: consortiumId,
    timestamp: moment().format('h:mm:ss A UTC,  MMM Do YYYY'),
    refreshinterval: (refreshInterval / 1000),
    nodeRows: [],
    allNodes: [],
    hasNodeRows: 0,
    snapshot: {
      validators: []
    }
  };
  getNetworkNodesList(hostURL)
  .then((activeNodes) => {
    data.nodeRows = activeNodes;
    data.hasNodeRows = activeNodes.length;
    return getIstanbulSnapshot(hostURL);
  })
  .then((snapshot) => {
    data.snapshot = snapshot;
    if(activeNodes.length){
      data.allNodes = activeNodes;
      res.render('etheradmin', data);
    }
    else{
      getAllNodeInfoFromContract()
      .then((allNodes)=>{
        data.allNodes = allNodes;
        res.render('etheradmin', data);
      })
    }
  })
  .catch((err) => {
    console.log("error at getting admin list or getSnapshot", err);
    res.render('etheradmin', data);
  });
});

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
  const web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net));
  const Admin = new web3.eth.Contract(JSON.parse(adminContractABI), addresses.adminValidatorSetAddress);
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
            gasPrice: fixedGasPrice, //20Gwei
            gasLimit: fixedGasLimit,//'0x48A1C0',//web3.utils.toWei(20,'gwei'), //estimatedGas, // Todo, estimate gas
            from: req.body.sender,
            to: addresses.adminValidatorSetAddress,
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

app.post('/istanbul_propose', function (req, res) {
  console.log("Istanbul Propose Started");
  const web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net));
  if(!tokenMap[req.body.hash] || !req.body.transactionHash){
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

readNetworkManagerContractNodeList();
setInterval(syncContractListToNetworkNodeList, refreshInterval/2);
setInterval(readNetworkManagerContractNodeList, refreshInterval);
app.listen(listenPort, function () {
  console.log('Admin webserver started');
});
