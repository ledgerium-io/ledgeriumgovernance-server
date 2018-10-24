const fs = require('fs');
const Web3 = require('web3');
//const Web3 = require('web3-quorum');
const Utils =  require('./web3util');
const async =  require('async');
const mnemonic = require('./mnemonic');
const SimpleValidatorSet = require('./simplevalidatorset');
const AdminValidatorSet = require('./adminvalidatorset');

//var host = "http://localhost:20100";
var host = "http://localhost:8545";
var web3 = new Web3.providers.HttpProvider(host);
const utils = new Utils();

//var host = "ws://localhost:9000";
//web3 = new Web3(new Web3.providers.WebsocketProvider(host));

//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidatorSet,simpleValidatorSet;
var privateKey = {};
var contractsList = {};
var accountAddressList = [];
var adminValidatorSetAddress = "", simpleValidatorSetAddress = "";

var main = async function () {

    //await generateKeysAndCreateAccounts(accountAddressList);
    //await readWritePrivateKeys(accountAddressList);
    await createAccountsAndManageKeys();

    //We need minimum 3 accounts and private keys set to continue from here!
    if((accountAddressList.length <3) || (Object.keys(privateKey).length < 3))
        return;

    // result = await web3.eth.net.getId();
    // console.log("Network ID", web3.utils.toHex(result));

    //istanbulAddValidatorTest();
    //await delay(10000); //wait for 10 seconds!
    //istanbulRemoveValidatorTest();

    var ethAccountToUse = accountAddressList[0];
    //await accessEarlierGreeting(ethAccountToUse);

    adminValidatorSet = new AdminValidatorSet(web3, utils, "", "", Web3);
    simpleValidatorSet = new SimpleValidatorSet(web3, utils, "", "", Web3);

    readContractsFromConfig();
    if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == ""){
        var otherAddressList = [];
        ethAccountToUse = accountAddressList[0];
        otherAddressList.push(accountAddressList[1]);
        otherAddressList.push(accountAddressList[2]);
        adminValidatorSetAddress = await deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey[ethAccountToUse],otherAddressList);
        console.log("adminValidatorSetAddress",adminValidatorSetAddress);
        
        simpleValidatorSetAddress = await deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey[ethAccountToUse],adminValidatorSetAddress,otherAddressList);
        console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
        
        writeContractsINConfig();
    }
    //If we dont have contracts to operate, abort!!
    if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == "" 
    || simpleValidatorSetAddress == undefined || adminValidatorSetAddress == undefined){
        return;
    }
    adminValidatorSet.setOwnersParameters(ethAccountToUse,privateKey[ethAccountToUse],adminValidatorSetAddress); 
    simpleValidatorSet.setOwnersParameters(simpleValidatorSetAddress);

    //flag = await runAdminTestCases();
    flag = await validatorSetup();
    //flag = await runValidatorTestCases();
    var flag;

    //return;
    //await addInitialValidators(accountAddressList);
    // await addIstanbulValidator("8545", accountAddressList[2]);
    // await addIstanbulValidator("8546", accountAddressList[2]);
    // await addIstanbulValidator("8548", accountAddressList[2]);
    // await addIstanbulValidator("8549", accountAddressList[2]);
    // await addIstanbulValidator("8550", accountAddressList[2]);
    //removeIstanbulValidator("8551", accountAddressList[2]);
    // return;
    //await addNewNodeAsValidator("0xfbef52b4f9d99a197a3ec14ddbdc235af22e1ca8");
    flag = await getListOfActiveValidators();
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
                var votingFrom = activeValidatorList[indexAV];
                transactionhash = await simpleValidatorSet.voteForAddingValidator(votingFrom, privateKey[votingFrom], newValidator);
                console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

                whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, newValidator);
                console.log(newValidator, "checked proposal for the validator ?", whatProposal);
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
        }
        activeValidatorList = await getListOfActiveValidators();
        console.log("return list for getListOfActiveValidators",activeValidatorList.length);
        console.log("****************** End ******************");
    }
    catch (error) {
        console.log("Error in getAllAdmins(): " + error);
        return false;
    }
}

async function runValidatorTestCases(){
    
    console.log("****************** Running Validator Test cases ******************");
    console.log("****************** Start Validator Test cases ******************");

    var activeValidatorList;
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

    var removeValidator = accountAddressList[4];
    flag = await removeSimpleSetContractValidatorForAdmin(removeValidator);
    console.log("return flag for removeSimpleSetContractValidatorForAdmin",flag);

    activeValidatorList = await getListOfActiveValidators();
    console.log("return list for getListOfActiveValidators",activeValidatorList.length);

    console.log("****************** End Validator Test cases ******************");
}

async function runAdminTestCases(){
    
    console.log("****************** Running Admin Test cases ******************");
    console.log("****************** Start Admin Test cases ******************");
    var adminToAdd = accountAddressList[3];
    flag = await addNewAdmin(adminToAdd);
    console.log("return flag for proposalToAddAdmin ",flag);

    adminToAdd = accountAddressList[4];
    flag = await addNewAdmin(adminToAdd);
    console.log("return flag for proposalToAddAdmin ",flag);

    var activeAdminList;
    activeAdminList = await getAllAdmins();
    console.log("return list for getAllAdmins",activeAdminList.length);

    flag = await removeOneAdmin();
    console.log("return flag for removeOneAdmin ",flag);

    activeAdminList = await getAllAdmins();
    console.log("return list for getAllAdmins",activeAdminList.length);
    
    console.log("****************** End Admin Test cases ******************");
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

async function istanbulAddValidatorTest()
{
    listIstanbulValidator();
    
    addIstanbulValidator(8545,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    addIstanbulValidator(8546,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    addIstanbulValidator(8547,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    addIstanbulValidator(8548,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    addIstanbulValidator(8549,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    addIstanbulValidator(8550,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");

    await delay(10000); //wait for 10 seconds!
    listIstanbulValidator();
    return;
}    

async function istanbulRemoveValidatorTest(){
    listIstanbulValidator();

    removeIstanbulValidator(8545,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    removeIstanbulValidator(8546,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    removeIstanbulValidator(8547,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    removeIstanbulValidator(8548,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");
    removeIstanbulValidator(8549,"0xd3208045d77781ebb2acdc7a79ec4791ec99eb7a");

    await delay(10000); //wait for 10 seconds!
    listIstanbulValidator();
    return;
}

async function removeIstanbulValidator(port,validator)
{
    var host = "http://localhost:" + port;
    console.log("removeIstanbulValidator pointing to", host);
    var web3 = new Web3(new Web3.providers.HttpProvider(host));
    var coinbase = await web3.eth.getCoinbase();
    console.log(coinbase);
    var message = {
        method: "istanbul_propose",
        params: [validator,false],
        jsonrpc: "2.0",
        id: new Date().getTime()
        };
    
    web3.currentProvider.send(message,(err,result)=>{
        console.log("received results:removeIstanbulValidator");
        if(result)
            console.log("results", result.result);
        else if(err)
        console.log("print result", err);
    });
    return;
}

async function addIstanbulValidator(port,validator)
{
    var host = "http://localhost:" + port;
    console.log("addIstanbulValidator pointing to", host);
    var web3 = new Web3(new Web3.providers.HttpProvider(host));
    var coinbase = await web3.eth.getCoinbase();
    console.log(coinbase);
    var message = {
        method: "istanbul_propose",
        params: [validator,true],
        jsonrpc: "2.0",
        id: new Date().getTime()
        };
    
    web3.currentProvider.send(message,(err,result)=>{
        console.log("received results:addIstanbulValidator");
        if(result)
            console.log("results", result.result);
        else if(err)
        console.log("print result", err);
    });
    return;
}

const delay = ms => new Promise(res => {console.log(new Date().getTime()); setTimeout(res, ms); console.log(new Date().getTime());});

async function listIstanbulValidator()
{
    var host = "http://localhost:" + "8545";
    console.log("listIstanbulValidator pointing to", host);
    var web3 = new Web3(new Web3.providers.HttpProvider(host));
    var message = {
        method: "istanbul_getValidators",
        params: [],
        jsonrpc: "2.0",
        id: new Date().getTime()
        };
    
    web3.currentProvider.send(message,(err,result)=>{
        console.log("received results:listIstanbulValidator");
        if(result)
            console.log("results", result.result);
        else if(err)
        console.log("print result", err);
    });
    return;
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
        var ethAccountToVote1 = accountAddressList[1];
        var ethAccountToVote2 = accountAddressList[2];
        
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

        /*We are voting AGANST adding validator*/
        transactionhash = await adminValidatorSet.voteAgainstAddingAdmin(ethAccountToVote1,adminToAdd,privateKey[ethAccountToVote1]);
        console.log("submitted transactionhash ",transactionhash, "against voting of adding", adminToAdd);

        /* Lets see how voting looks at the moment! It should be one FOR and one AGAINST so proposal is still not finalised
        and voting is still ON. It should return 1,1*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

        /* One more vote FOR adding validator, and so it makes 2 votes FOR and 1 vote AGAINST
        The 3/2 is achieved FOR adding validator here. The proposal will be finalised here
        */
        transactionhash = await adminValidatorSet.voteForAddingAdmin(ethAccountToVote2,adminToAdd,privateKey[ethAccountToVote2]);
        console.log("submitted transactionhash ",transactionhash, "for voting of adding ", adminToAdd);

        /* Lets see how voting looks at the moment! It should return 0,0 */
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

        /* Since the validator is added, var flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "got added as admin ?", flag);
        if(flag)

        */
        flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "got added as admin ?", flag);

        /* Since the validator is already added, checkProposal should return "proposal not created"
        */
        whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,adminToAdd);
        console.log(adminToAdd, "checked proposal for the admin ?", whatProposal);
        return flag;
    }
    catch (error) {
        console.log("Error in addNewAdmin(): " + error);
        return false;
    }
}

async function removeOneAdmin(){
    try{
        var ethAccountToPropose = accountAddressList[0];
        var ethAccountToVote1 = accountAddressList[1];
        var ethAccountToVote2 = accountAddressList[2];
        var adminToRemove = accountAddressList[3];

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

        /*We are voting AGAINST removing validator now*/
        transactionhash = await adminValidatorSet.voteAgainstRemovingAdmin(ethAccountToVote1,adminToRemove,privateKey[ethAccountToVote1]);
        console.log("submitted transactionhash ",transactionhash, "against voting  of removing", adminToRemove);

        /* Lets see how voting looks at the moment! It should return 1,1*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);
        
        /*We are now voting FOR removing validator*/
        transactionhash = await adminValidatorSet.voteForRemovingAdmin(ethAccountToVote2,adminToRemove,privateKey[ethAccountToVote2]);
        console.log("submitted transactionhash ",transactionhash, "for voting  of removing", adminToRemove);

        /* One more vote FOR removing validator, and so it makes 2 votes FOR and 1 vote AGAINST removing
        The > 4/2 is not achieved FOR removing validator here. The proposal will not be finalised here
        */
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);
        
        /*We are now voting FOR removing validator by 'SELF'
        * The > 4/2 is now achieved FOR removing validator here. The proposal will be finalised here
        */
        transactionhash = await adminValidatorSet.voteForRemovingAdmin(adminToRemove,adminToRemove,privateKey[adminToRemove]);
        console.log("submitted transactionhash ",transactionhash, "for voting  of removing", adminToRemove);

        /* Since the validator is removed, var flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "got added as admin ?", flag);
        if(flag)

        */
        var flag = await adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "still an admin ?", flag);

        /* Since the validator is already removed, checkProposal should return "proposal not created"
        */
        whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,adminToRemove);
        console.log(adminToRemove, "checked proposal for admin ?", whatProposal);
        return flag;
    }
    catch (error) {
        console.log("Error in removeOneAdmin(): " + error);
        return false;
    }
}

async function deployNewAdminSetValidatorContract(ownerAccountAddress,otherAdminsList)
{
    var adminValidatorSetAddress = await adminValidatorSet.deployNewAdminSetValidatorContract(ownerAccountAddress,otherAdminsList);
    return adminValidatorSetAddress;
}

async function deployNewAdminSetValidatorContractWithPrivateKey(ownerAccountAddress,privateKeyOwner,otherAdminsList)
{
    var adminValidatorSetAddress = await adminValidatorSet.deployNewAdminSetValidatorContractWithPrivateKey(ownerAccountAddress,privateKeyOwner,otherAdminsList);
    return adminValidatorSetAddress;
}

async function deployNewSimpleSetValidatorContract(ownerAccountAddress, adminValidatorSetAddress)
{
    var singleValidatorSetAddress = await simpleValidatorSet.deployNewSimpleSetValidatorContract(ownerAccountAddress, adminValidatorSetAddress);
    return singleValidatorSetAddress;
}

async function deployNewSimpleSetValidatorContractWithPrivateKey(ownerAccountAddress, privateKeyOwner, adminValidatorSetAddress,otherValidatorList)
{
    var singleValidatorSetAddress = await simpleValidatorSet.deployNewSimpleSetValidatorContractWithPrivateKey(ownerAccountAddress,privateKeyOwner,adminValidatorSetAddress,otherValidatorList);
    return singleValidatorSetAddress;
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

        var activeValidatorList = await getListOfActiveValidators();
        for(var indexAV = 0; indexAV < activeValidatorList.length; indexAV++){
            if(ethAccountToPropose == activeValidatorList[indexAV])
                continue;
            var votingFrom = activeValidatorList[indexAV];
            transactionhash = await simpleValidatorSet.voteForRemovingValidator(votingFrom, privateKey[votingFrom], newValidator);
            console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

            /* Lets see how voting looks at the moment! It should return 1,1*/
            var votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

            whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked proposal for the validator ?", whatProposal);
            //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
            //if so, dont need to run the loop and break it now, to run further voting!
            if(whatProposal == "proposal not created")
                break; 
        }
        
        // from = accountAddressList[1];
        // transactionhash = await simpleValidatorSet.voteAgainstAddingValidator(from, privateKey[from], newValidator);
        // console.log("submitted transactionhash ",transactionhash, "against voting to add ", newValidator);

        // /* Lets see how voting looks at the moment! It should return 1,1*/
        // var votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
        // console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

        // from = accountAddressList[2];
        // transactionhash = await simpleValidatorSet.voteForAddingValidator(from, privateKey[from], newValidator);
        // console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

        // whatProposal = await simpleValidatorSet.checkProposal(accountAddressList[0], newValidator);
        // console.log(newValidator, "checked proposal for the validator ?", whatProposal);

        // votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
        // console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

        // var from = accountAddressList[3];
        // transactionhash = await simpleValidatorSet.voteForAddingValidator(from, privateKey[from], newValidator);
        // console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

        // whatProposal = await simpleValidatorSet.checkProposal(accountAddressList[0], newValidator);
        // console.log(newValidator, "checked proposal for the validator ?", whatProposal);

        // votes = await simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
        // console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

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
            var votingFrom = activeValidatorList[indexAV];
            transactionhash = await simpleValidatorSet.voteForRemovingValidator(votingFrom, privateKey[votingFrom], removeValidator);
            console.log("submitted transactionhash ",transactionhash, "for voting to remove ", removeValidator);

            whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose, removeValidator);
            console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
            //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
            //if so, dont need to run the loop and break it now, to run further voting!
            if(whatProposal == "proposal not created")
                break; 
        }

        // /*We are voting AGAINST removing validator now*/
        // transactionhash = await simpleValidatorSet.voteAgainstRemovingValidator(ethAccountToVote1, privateKey[ethAccountToVote1], removeValidator);
        // console.log("submitted transactionhash ", transactionhash, "against voting  of removing", removeValidator);

        /* Lets see how voting looks at the moment! It should return 1,1*/
        // var votes = await simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
        // console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);
        
        // /*We are now voting FOR removing validator*/
        // transactionhash = await simpleValidatorSet.voteForRemovingValidator(ethAccountToVote2, privateKey[ethAccountToVote2], removeValidator);
        // console.log("submitted transactionhash ", transactionhash, "for voting  of removing", removeValidator);

        // /* One more vote FOR removing validator, and so it makes 2 votes FOR and 1 vote AGAINST removing
        // The > 4/2 is not achieved FOR removing validator here. The proposal will not be finalised here
        // */
        // var votes = await simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
        // console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);
        
        // /*We are now voting FOR removing validator by 'SELF'
        // * The > 4/2 is now achieved FOR removing validator here. The proposal will be finalised here
        // */
        // transactionhash = await simpleValidatorSet.voteForRemovingValidator(removeValidator, privateKey[removeValidator], removeValidator);
        // console.log("submitted transactionhash ", transactionhash, "for voting  of removing", removeValidator);

        // votes = await simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
        // console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

        /* Since the validator is removed, var flag = await simpleValidatorSet.checkValidator(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "got added as validator ?", flag);
        */
        var flag = await simpleValidatorSet.isActiveValidator(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "still an validator ?", flag);

        /* Since the validator is already removed, checkProposal should return "proposal not created"
        */
        whatProposal = await simpleValidatorSet.checkProposal(ethAccountToPropose,removeValidator);
        console.log(removeValidator, "checked proposal for validator ?", whatProposal);
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
        
        var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
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

async function createAccountsAndManageKeys(){
    
    var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
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
        console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
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
        
        var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
        var keyStorePath = __dirname;
        
        var keyData = {};
        if(fs.existsSync(privateKeyFileName)){
            keyData = fs.readFileSync(privateKeyFileName,"utf8");
            keyData = JSON.parse(keyData);
        }    
        var key;
        console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
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
        var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
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
        var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
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

    var constructorParameters = [];
    constructorParameters.push("Hi Rahul");
    //value[0] = Contract ABI and value[1] =  Contract Bytecode
    var deployedAddressGreeter = await utils.deployContract(value[0], value[1], ethAccountToUse, constructorParameters, web3);
    
    console.log("Greeter deployedAddress ", deployedAddressGreeter);
    greeting1 = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);

    ///////////////////////////////////////////////////////////////
    // Todo: Read ABI from dynamic source.
    var value1 = utils.readSolidityContractJSON("./build/contracts/TestGreeter.json");
    if(value1.length <= 0){
        return;
    }

    constructorParameters = [];
    constructorParameters.push(deployedAddressGreeter);
    //value1[0] = Contract ABI and value1[1] =  Contract Bytecode
    var deployedAddressTesterGreeter = await utils.deployContract(value1[0], value1[1], ethAccountToUse, constructorParameters, web3);
    
    console.log("TestGreeter deployedAddress ", deployedAddressTesterGreeter);
    testGreeting = new web3.eth.Contract(JSON.parse(value1[0]),deployedAddressTesterGreeter);

    let encodedABI = testGreeting.methods.add(23,54).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressTesterGreeter,encodedABI,privateKey[ethAccountToUse],web3,200000);
    console.log("TransactionLog for TestGreeter Setvalue -", transactionObject.transactionHash);

    greeting1.methods.getMyNumber().call().then(result => {
        console.log("getMyNumber", result);
    });

    testGreeting.methods.result().call().then(result => {
        console.log("result", result);
    });

    // greeting1.methods.greet().call().then(result => {
    //     console.log("myvalue", result);
    // });

    // greeting1.methods.getOwner().call().then(result => {
    //     console.log("getOwner", result);
    // });

    // greeting1.methods.getMyNumber().call().then(result => {
    //     console.log("getMyNumber", result);
    // });
    
    // let encodedABI = greeting1.methods.setMyNumber(299).encodeABI();
    // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,deployedAddress, encodedABI,web3);
    // console.log("estimatedGas",estimatedGas);
    
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddress,encodedABI,privateKey[ethAccountToUse],web3,200000);
    // console.log("TransactionLog for Greeter Setvalue -", transactionObject.transactionHash);

    // greeting1.methods.getMyNumber().call().then(result => {
    //     console.log("getMyNumber", result);
    // });
}