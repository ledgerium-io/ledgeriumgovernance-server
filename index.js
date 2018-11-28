'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Utils =  require('./web3util');
const SimpleValidator = require('./simplevalidatorindex');
const AdminValidator = require('./adminvalidatorindex');
const ethUtil = require('ethereumjs-util');

var provider;
var protocol,host,port,web3;

var subscribePastEventsFlag = false;
var webSocketProtocolFlag = false;
global.subscribePastEventsFlag = subscribePastEventsFlag;

const utils = new Utils();
global.utils = utils;

var usecontractconfig = false;
var readkeyconfig = false;
var contractsList = {};
//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidator,simpleValidator;
var privateKey = {};
var accountAddressList = [];
var adminValidatorSetAddress = "", simpleValidatorSetAddress = "";

var main = async function () {

    const args = process.argv.slice(2);
    for (let i=0; i<args.length ; i++) {
        let temp = args[i].split("=");
        switch (temp[0]) {
            case "ws":
                protocol = "ws://";
                global.protocol = protocol;
                webSocketProtocolFlag = true;
                global.webSocketProtocolFlag = webSocketProtocolFlag;
                break;
            case "http":
                protocol = "http://";
                global.protocol = protocol;
                webSocketProtocolFlag = false;
                global.webSocketProtocolFlag = webSocketProtocolFlag;
                break;
            case "hostname":
                host = temp[1];
                global.host = host;
                break;
            case "port":
                port = temp[1];
                global.port = port;
                let URL = protocol + host + ":" + port;
                switch(protocol){
                    case "http://":
                    default:
                        web3 = new Web3(new Web3.providers.HttpProvider(URL));
                        break;
                    case "ws://":
                        web3 = new Web3(new Web3.providers.WebsocketProvider(URL));
                        break;
                }
                global.web3 = web3;
                adminValidator = new AdminValidator();
                global.adminValidator = adminValidator;
                simpleValidator = new SimpleValidator();
                global.simpleValidator = simpleValidator;
                break;
            case "subscribePastEvents":
                subscribePastEventsFlag = true;
                global.subscribePastEventsFlag = subscribePastEventsFlag;
                break;
            case "privateKeys":
                let prvKeys = temp[1].split(",");
                createAccountsAndManageKeysFromPrivateKeys(prvKeys);
                writeAccountsAndKeys();
                break;
            case "readkeyconfig":
                readkeyconfig = temp[1];
                switch(readkeyconfig){
                    case "true":
                    default: 
                        readAccountsAndKeys();
                        break;
                    case "false":
                        console.log("Given readkeyconfig option not supported! Provide correct details");
                        break;     
                }
                break;
            case "usecontractconfig":
                let usecontractconfig = temp[1];
                switch(usecontractconfig){
                    case "true":
                        readContractsFromConfig();
                        if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == ""){
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
                        let tranHash = await adminValidator.setHelperParameters(adminValidatorSetAddress);
                        console.log("tranHash of initialisation", tranHash);
                        tranHash = await simpleValidator.setHelperParameters(simpleValidatorSetAddress,adminValidatorSetAddress);
                        console.log("tranHash of initialisation", tranHash);
                        global.adminValidatorSetAddress = adminValidatorSetAddress;
                        global.simpleValidatorSetAddress = simpleValidatorSetAddress;
                        break;
                    case "false":
                        if(accountAddressList.length < 3){
                            console.log("Ethereum accounts are not available! Can not proceed further!!");
                            return;
                        }
                        adminValidatorSetAddress = await adminValidator.deployNewAdminSetValidatorContractWithPrivateKey();
                        console.log("adminValidatorSetAddress",adminValidatorSetAddress);
                        simpleValidatorSetAddress = await simpleValidator.deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
                        console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
                        let tranHash1 = await adminValidator.setHelperParameters(adminValidatorSetAddress);
                        console.log("tranHash of     initialisation", tranHash1);
                        tranHash1 = await simpleValidator.setHelperParameters(simpleValidatorSetAddress,adminValidatorSetAddress);
                        console.log("tranHash of initialisation", tranHash1);

                        global.adminValidatorSetAddress = adminValidatorSetAddress;
                        global.simpleValidatorSetAddress = simpleValidatorSetAddress;
                        break;
                    default:
                        console.log("Given usecontractconfig option not supported! Provide correct details");
                        break;
                }
                break;
            case "runadminvalidator":{
                let list = temp[1].split(",");
                for (let j=0; j<list.length ; j++) {
                    switch (list[j]) {
                        case "runAdminTestCases":
                            var result = await adminValidator.runAdminTestCases();
                            console.log("result",result);
                            break;
                        case "runRemoveAdminTestCases":
                            var result = await adminValidator.runRemoveAdminTestCases();
                            console.log("result",result);
                            break;
                        case "getAllActiveAdmins":
                            var result = await adminValidator.getAllActiveAdmins();
                            console.log("No of active admins",result.length);
                            break;
                        case "getAllAdmins":
                            var result = await adminValidator.getAllAdmins();
                            console.log("No of admins",result.length);
                            break;
                        case "addOneAdmin":
                            var adminToAdd = list[++j];
                            console.log("adminToAdd ", adminToAdd);
                            var result = await adminValidator.addOneAdmin(adminToAdd);
                            result = await adminValidator.getAllAdmins();
                            console.log("No of admins",result.length);
                            break;
                        case "removeOneAdmin":
                            var adminToRemove = list[++j];
                            console.log("adminToRemove ", adminToRemove);
                            var result = await adminValidator.removeOneAdmin(adminToRemove);
                            result = await adminValidator.getAllAdmins();
                            console.log("No of admins",result.length);
                            break;
                        case "runClearProposalsAdminTestCases":
                            var result = await adminValidator.runClearProposalsAdminTestCases();
                            console.log("result",result);
                            break;
                        default:
                            console.log("Given runadminvalidator option not supported! Provide correct details");
                            break;
                    }
                }
                break;
            }
            case "runsimplevalidator":{
                let list = temp[1].split(",");
                for (let j=0; j<list.length ; j++) {
                    switch (list[j]) {
                        case "validatorSetup":
                            var result = await simpleValidator.validatorSetup();
                            console.log("result",result);
                            break;
                        case "runValidatorTestCases":
                            var result = await simpleValidator.runValidatorTestCases();
                            console.log("result",result);
                            break;
                        case "runRemoveValidatorTestCases":
                            var result = await simpleValidator.runRemoveValidatorTestCases();
                            console.log("result",result);
                            break;
                        case "getListOfActiveValidators":
                            var result = await simpleValidator.getListOfActiveValidators();
                            console.log("No of validators",result.length);
                            break;
                        case "addSimpleSetContractValidatorForAdmin":
                            var validator = list[++j];
                            console.log("validator ", validator);
                            var result = await simpleValidator.addSimpleSetContractValidatorForAdmin(validator);
                            result = await simpleValidator.getListOfActiveValidators();
                            console.log("No of validators",result.length);
                            break;
                        case "removeSimpleSetContractValidatorForAdmin":
                            var validator = list[++j];
                            console.log("validator ", validator);
                            var result = await simpleValidator.removeSimpleSetContractValidatorForAdmin(validator);
                            result = await simpleValidator.getListOfActiveValidators();
                            console.log("No of validators",result.length);
                            break;
                        default:
                            console.log("Given runsimplevalidator option not supported! Provide correct details");
                            break;
                    }
                }
                break;
            }
            case "rinkeby":{
                var HDWalletProvider = require("truffle-hdwallet-provider");
                //var privateKey1 = "79fe2e5ef4cb81e1dd04f236e66c793d152eb372234c487405aa71cce90db9c7";
                provider = new HDWalletProvider(privateKey[accountAddressList[0]], "https://rinkeby.infura.io/v3/931eac1d45254c16acc71d0fc11b88f0");
                web3 = new Web3();
                web3.setProvider(provider);
                global.web3 = web3;
                adminValidator = new AdminValidator();
                global.adminValidator = adminValidator;
                simpleValidator = new SimpleValidator();
                global.simpleValidator = simpleValidator;
                adminValidatorSetAddress = await adminValidator.deployNewAdminSetValidatorContractWithPrivateKey();
                simpleValidatorSetAddress = await simpleValidator.deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
                console.log("adminValidatorSetAddress",adminValidatorSetAddress);
                console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
                let tranHash = await adminValidator.setHelperParameters(adminValidatorSetAddress);
                console.log("tranHash of initialisation", tranHash);
                tranHash = await simpleValidator.setHelperParameters(simpleValidatorSetAddress,adminValidatorSetAddress);
                console.log("tranHash of initialisation", tranHash);
                global.adminValidatorSetAddress = adminValidatorSetAddress;
                global.simpleValidatorSetAddress = simpleValidatorSetAddress;
                break;
            }
            default:
                //throw "command should be of form :\n node deploy.js host=<host> file=<file> contracts=<c1>,<c2> dir=<dir>";
                break;
        }
    }
    if(web3 != undefined)
        web3.currentProvider.disconnect();
    
    if(provider)
        provider.engine.stop();
    return;
}

main();

async function createAccountsAndManageKeysFromPrivateKeys(inputPrivateKeys){
    
    accountAddressList.length = 0;
    let pubkey;
    for(var index = 0; index < inputPrivateKeys.length; index++){
        let eachElement = inputPrivateKeys[index];
        try{
            let prvKey = ethUtil.toBuffer("0x" + eachElement);
            pubkey = '0x' + ethUtil.privateToAddress(prvKey).toString('hex');
        }
        catch (error) {
            console.log("Error in index.createAccountsAndManageKeysFromPrivateKeys(): " + error);
            return "";
        }    
        accountAddressList.push(pubkey);
        privateKey[pubkey] = eachElement;
    }
    var noOfPrivateKeys = Object.keys(privateKey).length;
    var noOfAccounts = accountAddressList.length;
    if(noOfAccounts > 0 && noOfPrivateKeys > 0 && (noOfAccounts == noOfPrivateKeys)){
        console.log(accountAddressList.length + " ethereum accounts are created using private keys!");
    }
    global.accountAddressList = accountAddressList;
    global.privateKey = privateKey;
    return;
}

async function readAccountsAndKeys(){
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

async function writeAccountsAndKeys(){
    var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
    var data = JSON.stringify(privateKey,null, 2);
    fs.writeFileSync(privateKeyFileName,data);
    console.log(accountAddressList.length + " ethereum accounts & private keys are written to the privateKey.json file");
    return false;
}

async function readContractsFromConfig(){
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

async function writeContractsINConfig(){
    try{
        var contractFileName = __dirname + "/keystore/" + "contractsConfig.json";
        contractsList["adminValidatorSetAddress"] = adminValidatorSetAddress;
        contractsList["simpleValidatorSetAddress"] = simpleValidatorSetAddress;
    
        var data = JSON.stringify(contractsList,null, 2);
        fs.writeFileSync(contractFileName,data);
    }
    catch (error) {
        console.log("Error in writeContractsINConfig: " + error);
    }
}