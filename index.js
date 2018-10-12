const fs = require('fs');
const Web3 = require('web3');
//const Web3 = require('web3-quorum');
const utils =  require('./web3util');
const async =  require('async');
const mnemonic = require('./mnemonic');
const SimpleValidatorSet = require('./simplevalidatorset');
const AdminValidatorSet = require('./adminvalidatorset');

//var host = "http://localhost:20100";
var host = "http://localhost:8545";
var web3 = new Web3(new Web3.providers.HttpProvider(host));

//var host = "ws://localhost:9000";
//web3 = new Web3(new Web3.providers.WebsocketProvider(host));

//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidatorSet,simpleValidatorSet;
var privateKey = {};
var contractsList = {};
var accountAddressList = [];
var adminValidatorSetAddress = "", simpleValidatorSetAddress = "";

var main = async function () {

    // var privateKeyFileName = "./abcd.txt";
    // var prvkey1 = "quay.io/amis/ethstats:latest";
    // var prvkey2 = "quorumengineering/quorum:latest";
    // privateKey["pubkey1"] = prvkey1;
    // privateKey["pubkey2"] = prvkey2;
    // var data = JSON.stringify(privateKey,null, 2);
    // fs.writeFileSync(privateKeyFileName,data);
    
    // return;
    //await generateKeysAndCreateAccounts(accountAddressList);
    //await readWritePrivateKeys(accountAddressList);
    await createAccountsAndManageKeys();

    // result = await web3.eth.net.getId();
    // console.log("Network ID", web3.utils.toHex(result));

    //istanbulAddValidatorTest();
    //await delay(10000); //wait for 10 seconds!
    //istanbulRemoveValidatorTest();

    var ethAccountToUse = accountAddressList[0];
    //await accessEarlierGreeting(ethAccountToUse);

    adminValidatorSet = new AdminValidatorSet(web3);
    simpleValidatorSet = new SimpleValidatorSet(web3);

    readContractsFromConfig();
    if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == ""){
        var otherAdminsList = [];
        ethAccountToUse = accountAddressList[0];
        otherAdminsList.push(accountAddressList[1]);
        otherAdminsList.push(accountAddressList[2]);
        adminValidatorSetAddress = await deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey[ethAccountToUse],otherAdminsList);
        console.log("adminValidatorSetAddress",adminValidatorSetAddress);
        
        simpleValidatorSetAddress = await deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey[ethAccountToUse],adminValidatorSetAddress);
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
    
    var flag;
    var validatorToAdd = accountAddressList[3];
    flag = await addNewAdmin(validatorToAdd);
    console.log("return flag for proposalToAddAdmin ",flag);

    validatorToAdd = accountAddressList[4];
    flag = await addNewAdmin(validatorToAdd);
    console.log("return flag for proposalToAddAdmin ",flag);

    flag = await getAllAdmins();
    console.log("return flag for getAllAdmins",flag);

    // flag = await removeOneAdmin();
    // console.log("return flag for proposalToRemoveAdmin ",flag);

    // flag = await getAllAdmins();
    // console.log("return flag for getAllAdmins",flag);

    flag = await getListOfActiveValidators();

    var newValidator = accountAddressList[2];
    flag = await addSimpleSetContractValidatorForAdmin(newValidator);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    newValidator = accountAddressList[3];
    flag = await addSimpleSetContractValidatorForAdmin(newValidator);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators",flag);

    var removeValidator = accountAddressList[2];
    flag = await removeSimpleSetContractValidatorForAdmin(removeValidator);
    console.log("return flag for removeSimpleSetContractValidatorForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators ",flag);

    return;
}

main();

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
    try{
        var noOfActiveAdmin = 0;
        var adminList = [];
        adminList = await adminValidatorSet.getAllAdmins(accountAddressList[0]);
        if (adminList != undefined && adminList.length > 0) {
            for(var index = 0; index < adminList.length; index++ ){
                var flag = await adminValidatorSet.checkAdmin(accountAddressList[0],adminList[index]);
                if(flag){
                    noOfActiveAdmin++;
                    console.log("admin[", index,"] ",adminList[index]);
                }
            }
            console.log("Number of active admins " + noOfActiveAdmin);
            return true;
        }
    }
    catch (error) {
        console.log("Error in getAllAdmins(): " + error);
        return false;
    }
} 

async function addNewAdmin(validatorToAdd){
    try{
        var ethAccountToPropose = accountAddressList[0];
        var ethAccountToVote1 = accountAddressList[1];
        var ethAccountToVote2 = accountAddressList[2];
        
        var flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "got added as admin ?", flag);
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
        var transactionhash = await adminValidatorSet.proposalToAddAdmin(ethAccountToPropose,validatorToAdd,privateKey[ethAccountToPropose]);
        console.log("submitted transactionhash ",transactionhash, "for proposal of adding ", validatorToAdd);

        /* Since ADD the validator proposal is raised, checkProposal should return "add"*/
        var whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "checked proposal for the admin ?", whatProposal);
        
        /* Lets see how voting looks at the moment! It should return 1,0*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

        /*We are voting AGANST adding validator*/
        transactionhash = await adminValidatorSet.voteAgainstAddingAdmin(ethAccountToVote1,validatorToAdd,privateKey[ethAccountToVote1]);
        console.log("submitted transactionhash ",transactionhash, "against voting of adding", validatorToAdd);

        /* Lets see how voting looks at the moment! It should be one FOR and one AGAINST so proposal is still not finalised
        and voting is still ON. It should return 1,1*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

        /* One more vote FOR adding validator, and so it makes 2 votes FOR and 1 vote AGAINST
        The 3/2 is achieved FOR adding validator here. The proposal will be finalised here
        */
        transactionhash = await adminValidatorSet.voteForAddingAdmin(ethAccountToVote2,validatorToAdd,privateKey[ethAccountToVote2]);
        console.log("submitted transactionhash ",transactionhash, "for voting of adding ", validatorToAdd);

        /* Lets see how voting looks at the moment! It should return 0,0 */
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

        /* Since the validator is added, var flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "got added as admin ?", flag);
        if(flag)

        */
        flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "got added as admin ?", flag);

        /* Since the validator is already added, checkProposal should return "proposal not created"
        */
        whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "checked proposal for the admin ?", whatProposal);
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
        var validatorToRemove = accountAddressList[3];

        /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
        * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
        * Sending Proposal means, adding one vote to the proposal
        */
        /* Lets see whether this is admin or not already, if not, we can ignore else will proceed further*/
        var flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToAdd);
        console.log(validatorToRemove, "already an admin ?", flag);
        if(!flag) 
            return true;

        /*We are testing REMOVE validator functionality here with one proposal FOR removing and one more vote FOR removing,
        * makes more than 3/2 brings this a majority and validator will be removed. And proposal will be cleared off!
        * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
        */
        var transactionhash = await adminValidatorSet.proposalToRemoveAdmin(ethAccountToPropose,validatorToRemove,privateKey[ethAccountToPropose]);
        console.log("submitted transactionhash ",transactionhash, "for proposal of removing ", validatorToRemove);

        /* Since REMOVE the validator proposal is raised, checkProposal should return "remove"*/
        var whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,validatorToRemove);
        console.log(validatorToRemove, "checked proposal for the admin ?", whatProposal);
        
        /* Lets see how voting looks at the moment! It should return 1,0*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,validatorToRemove);
        console.log(validatorToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);

        /*We are voting AGAINST removing validator now*/
        transactionhash = await adminValidatorSet.voteAgainstRemovingAdmin(ethAccountToVote1,validatorToRemove,privateKey[ethAccountToVote1]);
        console.log("submitted transactionhash ",transactionhash, "against voting  of removing", validatorToRemove);

        /* Lets see how voting looks at the moment! It should return 1,1*/
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,validatorToRemove);
        console.log(validatorToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);
        
        /*We are now voting FOR removing validator*/
        transactionhash = await adminValidatorSet.voteForRemovingAdmin(ethAccountToVote2,validatorToRemove,privateKey[ethAccountToVote2]);
        console.log("submitted transactionhash ",transactionhash, "for voting  of removing", validatorToRemove);

        /* One more vote FOR removing validator, and so it makes 2 votes FOR and 1 vote AGAINST removing
        The > 4/2 is not achieved FOR removing validator here. The proposal will not be finalised here
        */
        var votes = await adminValidatorSet.checkVotes(ethAccountToPropose,validatorToRemove);
        console.log(validatorToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);
        
        /*We are now voting FOR removing validator by 'SELF'
        * The > 4/2 is now achieved FOR removing validator here. The proposal will be finalised here
        */
        transactionhash = await adminValidatorSet.voteForRemovingAdmin(validatorToRemove,validatorToRemove,privateKey[validatorToRemove]);
        console.log("submitted transactionhash ",transactionhash, "for voting  of removing", validatorToRemove);

        /* Since the validator is removed, var flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToAdd);
        console.log(validatorToAdd, "got added as admin ?", flag);
        if(flag)

        */
        var flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToAdd);
        console.log(validatorToRemove, "still an admin ?", flag);

        /* Since the validator is already removed, checkProposal should return "proposal not created"
        */
        whatProposal = await adminValidatorSet.checkProposal(ethAccountToPropose,validatorToRemove);
        console.log(validatorToRemove, "checked proposal for admin ?", whatProposal);
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

async function deployNewSimpleSetValidatorContractWithPrivateKey(ownerAccountAddress, privateKeyOwner, adminValidatorSetAddress)
{
    var singleValidatorSetAddress = await simpleValidatorSet.deployNewSimpleSetValidatorContractWithPrivateKey(ownerAccountAddress,privateKeyOwner,adminValidatorSetAddress);
    return singleValidatorSetAddress;
}

async function addSimpleSetContractValidatorForAdmin(newValidator){
    try{
        var from = accountAddressList[0];
        var transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
        console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

        from = accountAddressList[1];
        transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
        console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

        from = accountAddressList[2];
        var flag = await adminValidatorSet.checkAdmin(accountAddressList[0],from);
        if(flag){
            transactionhash = await simpleValidatorSet.addValidator(from, privateKey[from], newValidator);
            console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);
        }    
        return true;
    }
    catch (error) {
        console.log("Error in addSimpleSetContractValidatorForAdmin(): " + error);
        return false;
    }
}

async function removeSimpleSetContractValidatorForAdmin(removeValidator){
    try{
        var from = accountAddressList[0];
        var transactionhash = await simpleValidatorSet.removeValidator(from,privateKey[from],removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for voting to remove ", removeValidator);

        from = accountAddressList[1];
        transactionhash = await simpleValidatorSet.removeValidator(from,privateKey[from],removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for voting to remove ", removeValidator);

        from = accountAddressList[2];
        transactionhash = await simpleValidatorSet.removeValidator(from,privateKey[from],removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for voting to remove ", removeValidator);

        return true;
    }
    catch (error) {
        console.log("Error in removeSimpleSetContractValidatorForAdmin(): " + error);
        return false;
    }
}

async function getListOfActiveValidators()
{
    try{
        var noOfActiveValidator = 0;
        var validatorList = [];
        validatorList = await simpleValidatorSet.getAllValidatorsAsync(accountAddressList[0]);
        if (validatorList != undefined && validatorList.length > 0) {
            for(var index = 0; index < validatorList.length; index++ ){
                var flag = await simpleValidatorSet.isActiveValidator(accountAddressList[0],validatorList[index]);
                if(flag){
                    noOfActiveValidator++;
                }
            }
            console.log("Number of active validators " + noOfActiveValidator);
            return true;
        }
    }
    catch (error) {
        console.log("Error in getListOfActiveValidators(): " + error);
        return false;
    }
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