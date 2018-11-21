'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Utils =  require('./web3util');
const mnemonic = require('./mnemonic');
const SimpleValidator = require('./simplevalidatorindex');
const AdminValidator = require('./adminvalidatorindex');
const ethUtil = require('ethereumjs-util');

// var HDWalletProvider = require("truffle-hdwallet-provider");
// var privateKey1 = "79fe2e5ef4cb81e1dd04f236e66c793d152eb372234c487405aa71cce90db9c7";
// var provider = new HDWalletProvider(privateKey1, "https://rinkeby.infura.io/v3/931eac1d45254c16acc71d0fc11b88f0");

//var host = "http://localhost:20100";
var host,port;
var web3;
//var web3 = new Web3();
//web3.setProvider(provider);
const utils = new Utils();
global.utils = utils;

//var host = "ws://localhost:9000";
//web3 = new Web3(new Web3.providers.WebsocketProvider(host));
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
            case "hostname":
                host = temp[1];
                global.host = host;
                break;
            case "port":
                port = temp[1];
                global.port = port;
                let URL = "http://" + host + ":" + port;
                web3 = new Web3(new Web3.providers.HttpProvider(URL));
                global.web3 = web3;
                adminValidator = new AdminValidator();
                global.adminValidator = adminValidator;
                simpleValidator = new SimpleValidator();
                global.simpleValidator = simpleValidator;
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
                usecontractconfig = temp[1];
                switch(usecontractconfig){
                    case "true":
                        readContractsFromConfig();
                        if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == ""){
                            if(accountAddressList.length < 3){
                                console.log("Ethereum accounts are not available! Can not proceed further!!");
                                return;
                            }    
                            adminValidatorSetAddress = await adminValidator.deployNewAdminSetValidatorContractWithPrivateKey();
                            console.log("adminValidatorSetAddress",adminValidatorSetAddress);
                            simpleValidatorSetAddress = await simpleValidator.deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
                            console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
                            writeContractsINConfig();
                        }
                        adminValidator.setHelperParameters(adminValidatorSetAddress);
                        simpleValidator.setHelperParameters(simpleValidatorSetAddress);
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
                        adminValidator.setHelperParameters(adminValidatorSetAddress);
                        simpleValidatorSetAddress = await simpleValidator.deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
                        console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
                        simpleValidator.setHelperParameters(simpleValidatorSetAddress);

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
                        case "getAllAdmins":
                            var result = await adminValidator.getAllAdmins();
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
                            console.log("result",result);
                            break;
                        default:
                            console.log("Given runsimplevalidator option not supported! Provide correct details");
                            break;
                    }
                }
                break;
            }
            default:
                //throw "command should be of form :\n node deploy.js host=<host> file=<file> contracts=<c1>,<c2> dir=<dir>";
                break;
        }
    }

    //await generateKeysAndCreateAccounts(accountAddressList);
    //await readWritePrivateKeys(accountAddressList);
    
    //We need minimum 3 accounts and private keys set to continue from here!
    // if((accountAddressList.length <3) || (Object.keys(privateKey).length < 3))
    //     return;

    // result = await web3.eth.net.getId();
    // console.log("Network ID", web3.utils.toHex(result));

    //var ethAccountToUse = accountAddressList[0];
    ////await accessEarlierGreeting(ethAccountToUse);
    //return;

    // simpleValidatorSet = new SimpleValidatorSet(web3, utils, "", "", Web3);

    // readContractsFromConfig();
    // if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == ""){
    //     adminValidatorSetAddress = await deployNewAdminSetValidatorContractWithPrivateKey();
    //     console.log("adminValidatorSetAddress",adminValidatorSetAddress);
        
    //     simpleValidatorSetAddress = await deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress);
    //     console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
        
    //     writeContractsINConfig();
    // }
    // //If we dont have contracts to operate, abort!!
    // if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == "" 
    // || simpleValidatorSetAddress == undefined || adminValidatorSetAddress == undefined){
    //     return;
    // }
    //// adminValidatorSet.setOwnersParameters(ethAccountToUse,privateKey[ethAccountToUse],adminValidatorSetAddress); 
    // simpleValidatorSet.setOwnersParameters(simpleValidatorSetAddress);

    // flag = await runAdminTestCases();
    //flag = await getListOfActiveValidators();
    //flag = await runAdminTestCases();
    // flag = await runRemoveAdminTestCases();
    //flag = await validatorSetup();
    // flag = await runValidatorTestCases();
    // flag = await runRemoveValidatorTestCases();

    //await addInitialValidators(accountAddressList);
    // await addIstanbulValidator("8545", accountAddressList[2]);
    // await addIstanbulValidator("8546", accountAddressList[2]);
    // await addIstanbulValidator("8548", accountAddressList[2]);
    // await addIstanbulValidator("8549", accountAddressList[2]);
    // await addIstanbulValidator("8550", accountAddressList[2]);
    //removeIstanbulValidator("8551", accountAddressList[2]);
    // return;
    //await addNewNodeAsValidator("0xfbef52b4f9d99a197a3ec14ddbdc235af22e1ca8");
    //flag = await getListOfActiveValidators();

    //provider.engine.stop();
    return;
}

main();

/** This will add all the istanbul existing validator nodes as validator in SimpleValidatorSet SmartContract! Both list will come 
/in sync.
*/
async function validatorSetup()
{
    console.log("****************** Setup Validators list ******************");
    console.log("****************** Start ******************");
    try{
        var activeValidatorList;
        activeValidatorList = await getListOfActiveValidators();
        console.log("return list for getListOfActiveValidators",activeValidatorList.length);

        var noOfAccounts = Object.keys(privateKey).length;
        //Let the first account, as existing validator propose to add new validators!
        var ethAccountToPropose = accountAddressList[0];
        console.log("No of accounts to setup as validators ", noOfAccounts);
        
        //We will start with 4th element as first 3 are as
        for(var index = 3; index < noOfAccounts; index++ ){
            newValidator = accountAddressList[index]; //New validator to be added
            
            var transactionhash = await simpleValidatorSet.proposalToAddValidator(ethAccountToPropose, privateKey[ethAccountToPropose], newValidator);
            console.log("submitted transactionhash ",transactionhash, "for proposal to add ", newValidator);

            var whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose,newValidator);
            console.log(newValidator, "checked proposal for the validator ?", whatProposal);

            var activeValidatorList = await getListOfActiveValidators();
            for(var indexAV = 0; indexAV < activeValidatorList.length; indexAV++){
                if(ethAccountToPropose == activeValidatorList[indexAV])
                    continue;
                console.log("****************** New Voting Loop Start ******************");
                var votingFrom = activeValidatorList[indexAV];
                transactionhash = await simpleValidatorSet.voteForAddingValidator(votingFrom, privateKey[votingFrom], newValidator);
                console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

                whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, newValidator);
                console.log(newValidator, "checked proposal for the validator ?", whatProposal);
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
                console.log("****************** New Voting Loop End ******************");    
            }
            //istanbulAddValidator(newValidator);
        }
        activeValidatorList = await getListOfActiveValidators();
        console.log("return list for getListOfActiveValidators",activeValidatorList.length);
        console.log("****************** End validatorSetup ******************");
    }
    catch (error) {
        console.log("Error in validatorSetup(): " + error);
        return false;
    }
}

async function runValidatorTestCases(){
    
    console.log("****************** Running Validator Test cases ******************");
    console.log("****************** Start Validator Test cases ******************");

    var activeValidatorList;
    //Default 3 validators in the list, we will add 4 more from the list first. 
    var newValidator = accountAddressList[3];
    flag = await addSimpleSetContractValidatorForAdmin(newValidator);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    activeValidatorList = await getListOfActiveValidators();
    console.log("return list for getListOfActiveValidators",activeValidatorList.length);
    
    newValidator = accountAddressList[4];
    flag = await addSimpleSetContractValidatorForAdmin(newValidator);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    activeValidatorList = await getListOfActiveValidators();
    console.log("return list for getListOfActiveValidators",activeValidatorList.length);

    newValidator = accountAddressList[5];
    flag = await addSimpleSetContractValidatorForAdmin(newValidator);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    activeValidatorList = await getListOfActiveValidators();
    console.log("return list for getListOfActiveValidators",activeValidatorList.length);

    newValidator = accountAddressList[6];
    flag = await addSimpleSetContractValidatorForAdmin(newValidator);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    activeValidatorList = await getListOfActiveValidators();
    console.log("return list for getListOfActiveValidators",activeValidatorList.length);

    //Now, total no of validators are not 7! Now, run the remove validator testcase!
    var removeValidator = accountAddressList[6];
    flag = await removeSimpleSetContractValidatorForAdmin(removeValidator);
    console.log("return flag for removeSimpleSetContractValidatorForAdmin",flag);

    activeValidatorList = await getListOfActiveValidators();
    console.log("return list for getListOfActiveValidators",activeValidatorList.length);

    console.log("****************** End Validator Test cases ******************");
}

async function runRemoveValidatorTestCases(){
    
    console.log("****************** Running Remove Validator Test cases ******************");
    var activeValidatorList;
    activeValidatorList = await getListOfActiveValidators();
    for(var indexAV = 1; indexAV < activeValidatorList.length; indexAV++){
        removeValidator = activeValidatorList[indexAV];
        flag = await removeSimpleSetContractValidatorForAdmin(removeValidator);
        console.log("return flag for removeSimpleSetContractValidatorForAdmin",flag);
        activeValidatorCurrentList = await getListOfActiveValidators();
        console.log("return list for updated getListOfActiveValidators",activeValidatorCurrentList.length);
    }
    console.log("****************** End Remove Validator Test cases ******************");
}

async function addNewNodeAsValidator(newValidator) {

    from = accountAddressList[0];
    transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    from = accountAddressList[1];
    transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    from = accountAddressList[2];
    transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    from = accountAddressList[3];
    transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    from = accountAddressList[4];
    transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);

}

async function addInitialValidators(accountAddressList) {
    // admins are default validators
    // add [2] as validator
    // var from = accountAddressList[0];
    // var newValidator = accountAddressList[2];
    // var transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    // console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);
    // from = accountAddressList[1];
    // transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    // console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

    // // add [1] as validator
    // newValidator = accountAddressList[1];
    // from = accountAddressList[0];
    // transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    // from = accountAddressList[2];
    // transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);


    //  // add [0] as validator
    //  newValidator = accountAddressList[0];
    //  from = accountAddressList[1];
    //  transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
    //  from = accountAddressList[2];
    //  transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);

    // add all remaining nodes as validators to the smart contracts
     // add [3] as validator
     newValidator = accountAddressList[3];
     from = accountAddressList[1];
     transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
     from = accountAddressList[2];
     transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);

      // add [4] as validator
      newValidator = accountAddressList[4];
      from = accountAddressList[0];
      transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
      from = accountAddressList[1];
      transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
      from = accountAddressList[2];
      transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);

       // add [5] as validator
       newValidator = accountAddressList[5];
       from = accountAddressList[0];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
       from = accountAddressList[1];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
       from = accountAddressList[2];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);

       // add [5] as validator
       newValidator = accountAddressList[6];
       from = accountAddressList[0];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
       from = accountAddressList[1];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
       from = accountAddressList[2];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
       from = accountAddressList[3];
       transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
}

async function getAllAdmins(){
    var activeAdminList = [];
    try{
        var noOfActiveAdmin = 0;
        var adminList = [];
        adminList = await adminValidatorSet.getAllAdmins(accountAddressList[0]);
        if (adminList != undefined && adminList.length > 0) {
            for(var index = 0; index < adminList.length; index++ ){
                var flag = await adminValidatorSet.isActiveAdmin(accountAddressList[0],adminList[index]);
                if(flag){
                    noOfActiveAdmin++;
                    activeAdminList.push(adminList[index]);
                    console.log("admin[", noOfActiveAdmin,"] ",adminList[index]);
                }
            }
            console.log("Number of active admins " + noOfActiveAdmin);
        }
    }
    catch (error) {
        console.log("Error in getAllAdmins(): " + error);
    }
    return activeAdminList;
} 

async function addNewAdmin(adminToAdd){
    try{
        var ethAccountToPropose = accountAddressList[0];
        
        var flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "got added as admin ?", flag);
        if(flag)
           return true;

        /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
        * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
        * Sending Proposal means, adding one vote to the proposal
        */
        
        /*We are testing ADD validator functionality here with one proposal FOR adding and one more vote FOR adding,
        * makes more than 3/2 brings this a majority and validator will be added. And proposal will be cleared off!
        * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
        */
        var transactionhash = await adminValidatorSet.proposalToAddAdmin(ethAccountToPropose,adminToAdd,privateKey[ethAccountToPropose]);
        console.log("submitted transactionhash ",transactionhash, "for proposal of adding ", adminToAdd);

        /* Since ADD the validator proposal is raised, checkProposal should return "add"*/
        var whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "checked proposal for the admin ?", whatProposal);
        
        /* Lets see how voting looks at the moment! It should return 1,0*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

        var activeAdminList = await getAllAdmins();
        for(var indexAV = 0; indexAV < activeAdminList.length; indexAV++){
            if(ethAccountToPropose == activeAdminList[indexAV])
                continue;
            let votingFor = activeAdminList[indexAV];
             /*We are now voting FOR removing validator*/
            transactionhash = await adminValidatorSet.voteForAddingAdmin(votingFor,adminToAdd,privateKey[votingFor]);
            console.log("submitted transactionhash ",transactionhash, "for voting for removing", adminToAdd);

            whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose, adminToAdd);
            console.log(adminToAdd, "checked proposal for the validator ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            let votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "checked votes for removing as validator ?", votes[0], votes[1]);

            indexAV++;
            let votingAgainst = activeAdminList[indexAV];
            if(votingAgainst == undefined)
                break;
            /* Lets see how voting looks at the moment! It should return 1,1*/
            transactionhash = await adminValidatorSet.voteAgainstAddingAdmin(votingAgainst, adminToAdd, privateKey[votingAgainst]);
            console.log("submitted transactionhash ",transactionhash, "against voting to add ", adminToAdd);
            
            /* Lets see how voting looks at the moment! It should return 1,1*/
            votes = await adminValidatorSet.checkVotes(ethAccountToPropose, adminToAdd);
            console.log(adminToAdd, "checked votes for removing as validator ?", votes[0], votes[1]);

            whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose, adminToAdd);
            console.log(adminToAdd, "checked proposal for the validator ?", whatProposal);
            
            //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
            //if so, dont need to run the loop and break it now, to run further voting!
            if(whatProposal == "proposal not created")
                break; 
        }
        flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "got added as admin ?", flag);
        return flag;
    }
    catch (error) {
        console.log("Error in addNewAdmin(): " + error);
        return false;
    }
}

async function removeOneAdmin(adminToRemove){
    try{
        var ethAccountToPropose = accountAddressList[0];
        
        /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
        * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
        * Sending Proposal means, adding one vote to the proposal
        */
        /* Lets see whether this is admin or not already, if not, we can ignore else will proceed further*/
        var flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "already an admin ?", flag);
        if(!flag) 
            return true;

        /*We are testing REMOVE validator functionality here with one proposal FOR removing and one more vote FOR removing,
        * makes more than 3/2 brings this a majority and validator will be removed. And proposal will be cleared off!
        * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
        */
        var transactionhash = await adminValidatorSet.proposalToRemoveAdmin(ethAccountToPropose,adminToRemove,privateKey[ethAccountToPropose]);
        console.log("submitted transactionhash ",transactionhash, "for proposal of removing ", adminToRemove);

        /* Since REMOVE the validator proposal is raised, checkProposal should return "remove"*/
        var whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "checked proposal for the admin ?", whatProposal);
        
        /* Lets see how voting looks at the moment! It should return 1,0*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);

        var activeAdminList = await getAllAdmins();
        for(var indexAV = 0; indexAV < activeAdminList.length; indexAV++){
            if(ethAccountToPropose == activeAdminList[indexAV])
                continue;
            let votingFor = activeAdminList[indexAV];
             /*We are now voting FOR removing validator*/
            transactionhash = await adminValidatorSet.voteForRemovingAdmin(votingFor,adminToRemove,privateKey[votingFor]);
            console.log("submitted transactionhash ",transactionhash, "for voting for removing", adminToRemove);

            whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose, adminToRemove);
            console.log(adminToRemove, "checked proposal for the validator ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            let votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "checked votes for removing as validator ?", votes[0], votes[1]);

            indexAV++;
            let votingAgainst = activeAdminList[indexAV];
            if(votingAgainst == undefined)
                break;
            /* Lets see how voting looks at the moment! It should return 1,1*/
            transactionhash = await adminValidatorSet.voteAgainstRemovingAdmin(votingAgainst, adminToRemove, privateKey[votingAgainst]);
            console.log("submitted transactionhash ",transactionhash, "against voting to add ", adminToRemove);
            
            /* Lets see how voting looks at the moment! It should return 1,1*/
            votes = await adminValidatorSet.checkVotes(ethAccountToPropose, adminToRemove);
            console.log(adminToRemove, "checked votes for removing as validator ?", votes[0], votes[1]);

            whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose, adminToRemove);
            console.log(adminToRemove, "checked proposal for the validator ?", whatProposal);
            
            //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
            //if so, dont need to run the loop and break it now, to run further voting!
            if(whatProposal == "proposal not created")
                break; 
        }
        flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "still an admin ?", flag);
        return flag;
    }
    catch (error) {
        console.log("Error in removeOneAdmin(): " + error);
        return false;
    }
}

// async function deployNewAdminSetValidatorContractWithPrivateKey()
// {
//     //ethAccountToUse = accountAddressList[0];
//     //privateKeyOwner = privateKey[ethAccountToUse];
//     var otherAdminsList = [];
//     otherAdminsList.push(accountAddressList[1]);
//     otherAdminsList.push(accountAddressList[2]);
//     //var adminValrSetAddress = await adminValidatorSet.deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,privateKeyOwner,otherAdminsList);
//     return adminValrSetAddress;
// }

async function deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress)
{
    //ethAccountToUse = accountAddressList[0];
    //privateKeyOwner = privateKey[ethAccountToUse];
    var validatorAddressList = [];
    validatorAddressList.push(accountAddressList[1]);
    validatorAddressList.push(accountAddressList[2]);
    //var singleValrSetAddress = await simpleValidatorSet.deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKeyOwner,adminValidatorSetAddress,validatorAddressList);
    return singleValrSetAddress;
}

async function addSimpleSetContractValidatorForAdmin(newValidator){
    try{
        var from = accountAddressList[0];
        var ethAccountToPropose = accountAddressList[0];

        var whatProposal = await simpleValidatorSet.checkProposal(accountAddressList[0],newValidator);
        console.log(newValidator, "checked proposal for the validator ?", whatProposal);

        var votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
        console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

        var transactionhash = await simpleValidatorSet.proposalToAddValidator(from, privateKey[from], newValidator);
        console.log("submitted transactionhash ",transactionhash, "for proposal to add ", newValidator);

        whatProposal = await simpleValidatorSet.checkProposal(accountAddressList[0],newValidator);
        console.log(newValidator, "checked proposal for the validator ?", whatProposal);

        votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
        console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

        var activeValidatorList = await getListOfActiveValidators();
        for(var indexAV = 0; indexAV < activeValidatorList.length;indexAV++){
            if(ethAccountToPropose == activeValidatorList[indexAV])
                continue;
            let  votingFor = activeValidatorList[indexAV];
            transactionhash = await simpleValidatorSet.voteForAddingValidator(votingFor, privateKey[votingFor], newValidator);
            console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

            /* Lets see how voting looks at the moment! It should return 1,1*/
            let votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

            indexAV++;
            let votingAgainst = activeValidatorList[indexAV];
            if(votingAgainst == undefined)
                break;
            /* Lets see how voting looks at the moment! It should return 1,1*/
            transactionhash = await simpleValidatorSet.voteAgainstAddingValidator(votingAgainst, privateKey[votingAgainst], newValidator);
            console.log("submitted transactionhash ",transactionhash, "against voting to add ", newValidator);
            
            /* Lets see how voting looks at the moment! It should return 1,1*/
            votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);
            
            whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked proposal for the validator ?", whatProposal);
            //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
            //if so, dont need to run the loop and break it now, to run further voting!
            if(whatProposal == "proposal not created")
                break; 
        }
        istanbulAddValidator(newValidator);
        return true;
    }
    catch (error) {
        console.log("Error in addSimpleSetContractValidatorForAdmin(): " + error);
        return false;
    }
}

async function removeSimpleSetContractValidatorForAdmin(removeValidator){
    try{
        var ethAccountToPropose = accountAddressList[0];

        /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
        * There are 3 validator in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
        * Sending Proposal means, adding one vote to the proposal
        */
        /* Lets see whether this is validator or not already, if not, we can ignore else will proceed further*/
        var flag = await simpleValidatorSet.isActiveValidator(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "already an validator ?", flag);
        if(!flag) 
            return true;

        /*We are testing REMOVE validator functionality here with one proposal FOR removing and one more vote FOR removing,
        * makes more than 3/2 brings this a majority and validator will be removed. And proposal will be cleared off!
        * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
        */
        var transactionhash = await simpleValidatorSet.proposalToRemoveValidator(ethAccountToPropose, privateKey[ethAccountToPropose], removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for proposal of removing ", removeValidator);

        /* Since REMOVE the validator proposal is raised, checkProposal should return "remove"*/
        var whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
        
        /* Lets see how voting looks at the moment! It should return 1,0*/
        var votes = await simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

        var activeValidatorList = await getListOfActiveValidators();
        for(var indexAV = 0; indexAV < activeValidatorList.length; indexAV++){
            if(ethAccountToPropose == activeValidatorList[indexAV])
                continue;
            let votingFrom = activeValidatorList[indexAV];
            transactionhash = await simpleValidatorSet.voteForRemovingValidator(votingFrom, privateKey[votingFrom], removeValidator);
            console.log("submitted transactionhash ",transactionhash, "for voting to remove ", removeValidator);

            whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, removeValidator);
            console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            let votes = await simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
            console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

            indexAV++;
            let votingAgainst = activeValidatorList[indexAV];
            if(votingAgainst == undefined)
                break;
            /* Lets see how voting looks at the moment! It should return 1,1*/
            transactionhash = await simpleValidatorSet.voteAgainstRemovingValidator(votingAgainst, privateKey[votingAgainst], removeValidator);
            console.log("submitted transactionhash ",transactionhash, "against voting to add ", removeValidator);
            
            /* Lets see how voting looks at the moment! It should return 1,1*/
            votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, removeValidator);
            console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

            whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, removeValidator);
            console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
            
            //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
            //if so, dont need to run the loop and break it now, to run further voting!
            if(whatProposal == "proposal not created")
                break; 
        }
        /* Since the validator is removed, isActiveValidator should be false
        */
        flag = await simpleValidatorSet.isActiveValidator(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "still an validator ?", flag);

        istanbulRemoveValidator(removeValidator);
        return flag;
    }
    catch (error) {
        console.log("Error in removeSimpleSetContractValidatorForAdmin(): " + error);
        return false;
    }
}

async function getListOfActiveValidators()
{
    var activeValidatorList = [];
    try{
        var noOfActiveValidator = 0;
        var validatorList = [];
        validatorList = await simpleValidatorSet.getAllValidatorsAsync(accountAddressList[0]);
        if (validatorList != undefined && validatorList.length > 0) {
            for(var index = 0; index < validatorList.length; index++ ){
                var flag = await simpleValidatorSet.isActiveValidator(accountAddressList[0],validatorList[index]);
                if(flag){
                    noOfActiveValidator++;
                    activeValidatorList.push(validatorList[index]);
                    console.log("validator[", noOfActiveValidator,"] ",validatorList[index]);
                }
            }
            console.log("Number of active validators " + noOfActiveValidator);
        }
    }
    catch (error) {
        console.log("Error in getListOfActiveValidators(): " + error);
    }
    return activeValidatorList;
}

async function generateKeysAndCreateAccounts(){
    try{
        accountAddressList.length = 0;
        
        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        var keyData = {};
        if(fs.existsSync(privateKeyFileName)){
            keyData = fs.readFileSync(privateKeyFileName,"utf8");
            privateKey = JSON.parse(keyData);
            Object.keys(privateKey).forEach(eachElement => {
                accountAddressList.push(eachElement);
                console.log(eachElement);
            });
        }
        else{
            const password = "password";
            for(index = 0; index < 3; index++){
                var newAccount = await web3.eth.accounts.create(password);
                console.log("newAccount Address", newAccount.address);
                console.log("newAccount privateKey", newAccount.privateKey);
                privateKey[newAccount.address] = newAccount.privateKey;
                
                //var key=Buffer.from(newAccount.privateKey,'hex');
                var result = await web3.eth.personal.importRawKey(newAccount.privateKey, password);
                console.log("result ", result);
            }
            data = JSON.stringify(privateKey,null, 2);
            fs.writeFileSync(privateKeyFileName,data);
            console.log("No of private keys", Object.keys(privateKey).length);
        }
    }
    catch (error) {
        console.log("Error in generateKeysAndCreateAccounts: " + error);
    }    
}

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

async function createAccountsAndManageKeys(){
    
    var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
    if(fs.existsSync(privateKeyFileName)){
        var keyData = fs.readFileSync(privateKeyFileName,"utf8");
        privateKey = JSON.parse(keyData);
        accountAddressList = Object.keys(privateKey);
    }    
    else{    
        var prvkey1 = utils.keccak(web3,mnemonic['account1']);
        var prvkey2 = utils.keccak(web3,mnemonic['account2']);
        var prvkey3 = utils.keccak(web3,mnemonic['account3']);
        var prvkey4 = utils.keccak(web3,mnemonic['account4']);

        pubkey1 = utils.generatePublicKey(prvkey1);
        pubkey2 = utils.generatePublicKey(prvkey2);
        pubkey3 = utils.generatePublicKey(prvkey3);
        pubkey4 = utils.generatePublicKey(prvkey4);
        
        accountAddressList.length = 0;
        accountAddressList.push(pubkey1);
        accountAddressList.push(pubkey2);
        accountAddressList.push(pubkey3);
        accountAddressList.push(pubkey4);

        privateKey[pubkey1] = prvkey1.slice(2,66);
        privateKey[pubkey2] = prvkey2.slice(2,66);
        privateKey[pubkey3] = prvkey3.slice(2,66);
        privateKey[pubkey4] = prvkey4.slice(2,66);

        var data = JSON.stringify(privateKey,null, 2);
        fs.writeFileSync(privateKeyFileName,data);
    }
    var noOfPrivateKeys = Object.keys(privateKey).length;
    var noOfAccounts = accountAddressList.length;
    if(noOfAccounts > 0 && noOfPrivateKeys > 0 && (noOfAccounts == noOfPrivateKeys)){
        console.log("There are", accountAddressList.length, "ethereum accounts & private keys in the privatekey file");
    }
    return;
}

async function readWritePrivateKeys(){
    try{
        const password = "password";
        accountAddressList.length = 0;
        accountAddressList = await web3.eth.getAccounts();
        if(accountAddressList.length <= 0)
            return;
        
        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        var keyStorePath = __dirname;
        
        var keyData = {};
        if(fs.existsSync(privateKeyFileName)){
            keyData = fs.readFileSync(privateKeyFileName,"utf8");
            keyData = JSON.parse(keyData);
        }    
        var key;
        console.log("There are", accountAddressList.length, "ethereum accounts & private keys in the privatekey file");
        if(accountAddressList.length > 0){
            var i = 0;
            accountAddressList.forEach(eachElement => {
            console.log(i++,"th account",eachElement);
            
            if(keyData[eachElement] != undefined){
                key = keyData[eachElement];
            }    
            else
            {    
                try{
                    key = utils.getPrivateKeyFromKeyStore(eachElement, keyStorePath, password);
                }
                catch (error) {
                    return;
                }
            }    
            privateKey[eachElement] = key;
            console.log(key);
            });
        }    
        data = JSON.stringify(privateKey,null, 2);
        fs.writeFileSync(privateKeyFileName,data);

        console.log("No of private keys", Object.keys(privateKey).length);
        
        // var newAccount = await web3.eth.personal.newAccount(password);
        // console.log("accountAddressList ", newAccount);

        //var account = web3.eth.accounts.privateKeyToAccount(privateKey[accountAddressList[0]]);
        //console.log("accountaddress ", accountAddressList[0], "recovered account with private key is", privateKey[accountAddressList[0]], account.address);
    }
    catch (error) {
        console.log("Error in readWritePrivateKeys: " + error);
    }
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

async function accessEarlierGreeting(ethAccountToUse){
    var greeting1;

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter.json");
    if(value.length <= 0){
        return;
    }

    _web3 = new Web3(web3);
    var constructorParameters = [];
    //constructorParameters.push("Hi Ledgerium");
    //value[0] = Contract ABI and value[1] =  Contract Bytecode
    var deployedAddressGreeter = "0x0000000000000000000000000000000000000517";//await utils.deployContract(value[0], value[1], ethAccountToUse, constructorParameters, web3);
    //var encodedABI = await utils.getContractEncodeABI(value[0], value[1],_web3,constructorParameters);
    ////var deployedAddressGreeter = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],_web3,0);
    
    //console.log("Greeter deployedAddress ", deployedAddressGreeter.contractAddress);
    console.log("Greeter deployedAddress ", deployedAddressGreeter);
    greeting1 = new _web3.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);

    //var result = await greeting1.methods.getMyNumber().call({from : ethAccountToUse});
    console.log("getMyNumber1", result);
    
    encodedABI = greeting1.methods.setMyNumber(499).encodeABI();
    //var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressGreeter,encodedABI,privateKey[ethAccountToUse],_web3,200000);
    console.log("TransactionLog for Greeter Setvalue -", transactionObject.transactionHash);

    result = await greeting1.methods.getMyNumber().call({from : ethAccountToUse});
    console.log("getMyNumber after", result);
}