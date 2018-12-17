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
    if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == "") {
        if(accountAddressList.length < 3){
            console.log("Ethereum accounts are not available! Can not proceed further!!");
            return;
        }    
        adminValidatorSetAddress = await adminValidator.deployNewAdminSetValidatorContractWithPrivateKey();
        simpleValidatorSetAddress = await simpleValidator.deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
        writeContractsINConfig();
    }
    console.log("adminValidatorSetAddress",adminValidatorSetAddress);
    console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
    global.adminValidatorSetAddress = adminValidatorSetAddress;
    global.simpleValidatorSetAddress = simpleValidatorSetAddress;

    let tranHash = await adminValidator.setHelperParameters(adminValidatorSetAddress);
    console.log("tranHash of initialisation", tranHash);
    tranHash = await simpleValidator.setHelperParameters(simpleValidatorSetAddress,adminValidatorSetAddress);
    console.log("tranHash of initialisation", tranHash);
   
    // var value = utils.readSolidityContractJSON("./build/contracts/AdminValidatorSet.abi");
    // var adminValidatorContract = new web3.eth.Contract(JSON.parse(value[0]),adminValidatorSetAddress);
    // global.adminValidatorContract = adminValidatorContract;
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