const fs = require('fs');
const Web3 = require('web3');
//const Web3 = require('web3-quorum');
const utils =  require('./web3util');
const async =  require('async');
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

    //await generateKeysAndCreateAccounts(accountAddressList);
    await readWritePrivateKeys(accountAddressList);
    
    // result = await web3.eth.net.getId();
    // console.log("Network ID", web3.utils.toHex(result));
    
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
        adminValidatorSetAddress = await deployNewAdminSetValidatorContract(ethAccountToUse,otherAdminsList);
        console.log("adminValidatorSetAddress",adminValidatorSetAddress);
        
        simpleValidatorSetAddress = await deployNewSingleSetValidatorContract(ethAccountToUse,adminValidatorSetAddress);
        console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
        
        writeContractsINConfig();
    }
    //If we dont have contracts to operate, abort!!
    if(simpleValidatorSetAddress == "" || adminValidatorSetAddress == ""){
        return;
    }
    adminValidatorSet.setOwnersParameters(ethAccountToUse,privateKey[ethAccountToUse],adminValidatorSetAddress); 
    simpleValidatorSet.setOwnersParameters(ethAccountToUse,privateKey[ethAccountToUse],simpleValidatorSetAddress);
    
    var flag;
    flag = await getListOfActiveValidators();

    flag = await addSimpleSetContractValidatorsForAdmin(ethAccountToUse);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators",flag);

    flag = await removeSimpleSetContractValidatorsForAdmin(ethAccountToUse);
    console.log("return flag for removeSimpleSetContractValidatorsForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators ",flag);

    flag = await addNewAdmin();
    console.log("return flag for proposalToAddAdmin ",flag);

    flag = await removeOneAdmin();
    console.log("return flag for proposalToRemoveAdmin ",flag);

    return;
}

main();

async function addNewAdmin(){
    try{
        var ethAccountToPropose = accountAddressList[0];
        var ethAccountToVote1 = accountAddressList[1];
        var ethAccountToVote2 = accountAddressList[2];
        var validatorToAdd = accountAddressList[3];

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

        /* Since the validator is added, checkAdmin against the validator should return "true"
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
        var flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToRemove);
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

        /* Since the validator is removed, checkAdmin against the validator should return "false"
        */
        flag = await adminValidatorSet.checkAdmin(ethAccountToPropose,validatorToRemove);
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

async function deployNewSingleSetValidatorContract(ownerAccountAddress, adminValidatorSetAddress)
{
    var singleValidatorSetAddress = await simpleValidatorSet.deployNewSimpleSetValidatorContract(ownerAccountAddress, adminValidatorSetAddress);
    return singleValidatorSetAddress;
}

async function addSimpleSetContractValidatorsForAdmin(ethAccountToUse){
    try{
        var newValidator = "0x71f7e738fd932ec2f577adb34b45444a0dcca7a2";
        var transactionhash = await simpleValidatorSet.addValidator(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for adding ", newValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", newValidator);

        newValidator = "0xeb4df8096836a9a93462c2057b07bddaea1964b1";
        transactionhash = await simpleValidatorSet.addValidator(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for adding ", newValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", newValidator);

        newValidator = "0x56a2288dec7538345484c18414d6f8bd3e9a530e";
        transactionhash = await simpleValidatorSet.addValidator(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for adding ", newValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", newValidator);

        newValidator = "0x92dc52c980c7c93bd33e94a2d001fb02ef552ab7";
        transactionhash = await simpleValidatorSet.addValidator(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for adding ", newValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", newValidator);

        newValidator = "0x629d1e30bc3b81024941e20c648895d6dc2e858d";
        transactionhash = await simpleValidatorSet.addValidator(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for adding ", newValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,newValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", newValidator);
        return true;
    }
    catch (error) {
        console.log("Error in removeSimpleSetContractValidatorsForAdmin(): " + error);
        return false;
    }
}

async function removeSimpleSetContractValidatorsForAdmin(ethAccountToUse){
    try{
        var removeValidator = "0x71f7e738fd932ec2f577adb34b45444a0dcca7a2";
        var transactionhash = await simpleValidatorSet.removeValidator(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for removing ", removeValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", removeValidator);

        removeValidator = "0xeb4df8096836a9a93462c2057b07bddaea1964b1";
        transactionhash = await simpleValidatorSet.removeValidator(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for removing ", removeValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", removeValidator);

        removeValidator = "0x56a2288dec7538345484c18414d6f8bd3e9a530e";
        transactionhash = await simpleValidatorSet.removeValidator(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for removing ", removeValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", removeValidator);

        removeValidator = "0x92dc52c980c7c93bd33e94a2d001fb02ef552ab7";
        transactionhash = await simpleValidatorSet.removeValidator(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for removing ", removeValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", removeValidator);

        removeValidator = "0x629d1e30bc3b81024941e20c648895d6dc2e858d";
        transactionhash = await simpleValidatorSet.removeValidator(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for removing ", removeValidator);
        transactionhash = await simpleValidatorSet.finaliseChange(ethAccountToUse,removeValidator);
        console.log("submitted transactionhash ",transactionhash, "for finalising ", removeValidator);
        return true;
    }
    catch (error) {
        console.log("Error in removeSimpleSetContractValidatorsForAdmin(): " + error);
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
                var flag = await simpleValidatorSet.isActiveValidator(validatorList[index]);
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

async function readWritePrivateKeys(){
    try{
        const password = "password";
        accountAddressList.length = 0;
        accountAddressList = await web3.eth.getAccounts();
        if(accountAddressList.length <= 0)
            return;
        
        // try{
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[0],password,3000000);
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[1],password,3000000);
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[2],password,3000000);
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[3],password,3000000);
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[4],password,3000000);
        // }
        // catch(error)
        // {
        //     console.log("error", error);
        // }
        
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

            adminValidatorSetAddress = contractsList["adminValidatorSetAddress"];
            simpleValidatorSetAddress= contractsList["simpleValidatorSetAddress"];
        }
    }
    catch (error) {
        console.log("Error in readWritePrivateKeys: " + error);
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
        console.log("Error in readWritePrivateKeys: " + error);
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
    var deployedAddress = await utils.deployContract(value[0], value[1], ethAccountToUse, constructorParameters, web3);
    
    console.log("Greeter deployedAddress ", deployedAddress);
    greeting1 = new web3.eth.Contract(JSON.parse(value[0]),deployedAddress);
    greeting1.methods.greet().call().then(result => {
        console.log("myvalue", result);
    });

    greeting1.methods.getOwner().call().then(result => {
        console.log("getOwner", result);
    });

    greeting1.methods.getMyNumber().call().then(result => {
        console.log("getMyNumber", result);
    });
    
    let encodedABI = greeting1.methods.setMyNumber(299).encodeABI();
    var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,deployedAddress, encodedABI,web3);
    console.log("estimatedGas",estimatedGas);
    
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddress,encodedABI,privateKey[ethAccountToUse],web3,200000);
    console.log("TransactionLog for Greeter Setvalue -", transactionObject.transactionHash);

    greeting1.methods.getMyNumber().call().then(result => {
        console.log("getMyNumber", result);
    });
}