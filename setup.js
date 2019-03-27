'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Utils =  require('./web3util');
const SimpleValidator = require('./simplevalidatorindex');
const AdminValidator = require('./adminvalidatorindex');

var web3;
global.web3 = web3;

var protocol;
var subscribePastEventsFlag = false;
var webSocketProtocolFlag = false;
global.webSocketProtocolFlag = webSocketProtocolFlag;
global.subscribePastEventsFlag = subscribePastEventsFlag;

const utils = new Utils();
global.utils = utils;

var contractsList = {};
//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidator,simpleValidator;

var privateKey = {};
var accountAddressList = [];
var adminValidatorSetAddress = "", simpleValidatorSetAddress = "";

async function initiateApp() {

    readContractsFromConfig();
    if((!simpleValidatorSetAddress || (simpleValidatorSetAddress == "")) && (!adminValidatorSetAddress || adminValidatorSetAddress == "")) {
        if(accountAddressList.length < 3){
            console.log("Ethereum accounts are not available! Can not proceed further!!");
            return;
        }    
        adminValidatorSetAddress = await adminValidator.deployNewAdminSetValidatorContractWithPrivateKey();
        simpleValidatorSetAddress = await simpleValidator.deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
        utils.writeContractsINConfig();
    }
    console.log("adminValidatorSetAddress",adminValidatorSetAddress);
    console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
    global.adminValidatorSetAddress = adminValidatorSetAddress;
    global.simpleValidatorSetAddress = simpleValidatorSetAddress;

    let tranHash = await adminValidator.setHelperParameters(adminValidatorSetAddress);
    console.log("tranHash of initialisation", tranHash);
    tranHash = await simpleValidator.setHelperParameters(simpleValidatorSetAddress,adminValidatorSetAddress);
    console.log("tranHash of initialisation", tranHash);

    var peerNodesFileName = "../ledgeriumtools/output/tmp/nodesdetails.json";
    setupNetworkManagerContract(peerNodesFileName);
}

async function readAccountsAndKeys() {
    var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
    if(fs.existsSync(privateKeyFileName)){
        var keyData = fs.readFileSync(privateKeyFileName,"utf8");
        privateKey = JSON.parse(keyData);
        accountAddressList = Object.keys(privateKey);
        console.log("There are", accountAddressList.length, "ethereum accounts & private keys in the privatekey file");
        global.accountAddressList = accountAddressList;
        global.privateKey = privateKey;
        return true;
    }
    else{
        console.log("privatekey.json file does not exist! The program may not function properly!");
        return false;
    }    
}

async function readContractsFromConfig() {
    try{
        var contractFileName = __dirname + "/keystore/" + "contractsConfig.json";
        var keyData = {};
        if(fs.existsSync(contractFileName)){
            keyData = fs.readFileSync(contractFileName,"utf8");
            contractsList = JSON.parse(keyData);
            if(contractsList["adminValidatorSetAddress"] != undefined)
                adminValidatorSetAddress = contractsList["adminValidatorSetAddress"];
            if(contractsList["simpleValidatorSetAddress"] != undefined)    
                simpleValidatorSetAddress= contractsList["simpleValidatorSetAddress"];
        }
    }
    catch (error) {
        console.log("Error in readContractsFromConfig: " + error);
    }
}

async function setupNetworkManagerContract(peerNodesfileName) {

    var ethAccountToUse = global.accountAddressList[0];

    // Todo: Read ABI from dynamic source.
    var abiFilename = __dirname + "/build/contracts/NetworkManagerContract.abi";
    var json = JSON.parse(fs.readFileSync(abiFilename, 'utf8'));
    if(json == "") {    
        return;
    }

    var networkManagerAddress = "0x0000000000000000000000000000000000002023";
    var nmContract = new web3.eth.Contract(json,networkManagerAddress);
    var encodedABI = nmContract.methods.init().encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,networkManagerAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    console.log("TransactionLog for Network Manager init() method -", transactionObject.transactionHash);
  
    var peerNodejson = JSON.parse(fs.readFileSync(peerNodesfileName, 'utf8'));
    if(peerNodejson == "") {    
        return;
    }

    var peerNodes = peerNodejson["nodes"];
    for(var index = 0; index < peerNodes.length; index++){
        encodedABI = nmContract.methods.registerNode(peerNodes[index].nodename,
                                                    peerNodes[index].hostname,
                                                    peerNodes[index].role,
                                                    peerNodes[index].ipaddress,
                                                    peerNodes[index].port.toString(),
                                                    peerNodes[index].publickey,
                                                    peerNodes[index].enodeUrl
        ).encodeABI();
        transactionObject = await utils.sendMethodTransaction(ethAccountToUse,networkManagerAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
        console.log("TransactionLog for Network Manager registerNode -", transactionObject.transactionHash);
    }

    var noOfNodes = await nmContract.methods.getNodesCounter().call();
    for(let nodeIndex = 0; nodeIndex < noOfNodes; nodeIndex++) {
        let result = await nmContract.methods.getNodeDetails(nodeIndex).call();
        console.log("****** Details of peer index -", nodeIndex, "**********");
        console.log("HostName -", result.hostName,"\nRole -", result.role, "\nIP Address -", result.ipAddress, "\nPort -", result.port, "\nPublic Key -", result.publicKey, "\nEnode -", result.enode);
    }
    return;
  }


test();

async function test() {
    const args = process.argv.slice(2);
    for (let i=0; i<args.length ; i++) {
        switch (args[0]) {
            case "protocol":
                switch (args[1]) {
                    case "ws":
                        protocol = "ws://";
                        break;
                    case "http":
                    default:
                        protocol = "http://";
                        break;
                }
                break;
            default:
                //throw "command should be of form :\n node deploy.js host=<host> file=<file> contracts=<c1>,<c2> dir=<dir>";
                break;
        }
        break; // We are processing only first flag, once read break out of the for loop!!
    }
    if (protocol=="ws://") {
        web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:9000"));
        webSocketProtocolFlag = true;
        subscribePastEventsFlag = true;
    }
    else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        webSocketProtocolFlag = false;
        subscribePastEventsFlag = false;
    }

    global.webSocketProtocolFlag = webSocketProtocolFlag;
    global.subscribePastEventsFlag = subscribePastEventsFlag;
    global.web3 = web3;
    adminValidator = new AdminValidator();
    global.adminValidator = adminValidator;
    simpleValidator = new SimpleValidator();
    global.simpleValidator = simpleValidator;
    await readAccountsAndKeys();
    await initiateApp();
}