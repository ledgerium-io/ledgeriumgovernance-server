const fs = require('fs');
const Web3 = require('web3');
const utils =  require('./web3util');
const async =  require('async');
const SimpleValidatorSet = require('./simplevalidatorset');
const AdminValidatorSet = require('./adminvalidatorset');
// const utils = require('./web3util');

var host = "http://localhost:20100";
//var host = "http://localhost:8545";
var web3 = new Web3(new Web3.providers.HttpProvider(host));

// var host = "ws://localhost:9000";
// web3 = new Web3(new Web3.providers.WebsocketProvider(host));

//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidatorSet,simpleValidatorSet;
var privateKey = {};
var accountAddressList = [];

var main = async function () {

    //await generateKeysAndCreateAccounts(accountAddressList);
    await readWritePrivateKeys(accountAddressList);
    
    result = await web3.eth.net.getId();
    console.log("Network ID", web3.utils.toHex(result));
    
    var ethAccountToUse = accountAddressList[0];
    await accessEarlierGreeting(ethAccountToUse);
    
    adminValidatorSet = new AdminValidatorSet(web3);
    simpleValidatorSet = new SimpleValidatorSet(web3);

    var otherAdminsList = [];
    ethAccountToUse = accountAddressList[0];
    otherAdminsList.push(accountAddressList[1]);
    otherAdminsList.push(accountAddressList[2]);
    const adminValidatorSetAddress = await deployNewAdminSetValidatorContract(ethAccountToUse,otherAdminsList);
    console.log("adminValidatorSetAddress",adminValidatorSetAddress);
    adminValidatorSet.setOwnersParameters(ethAccountToUse,privateKey[ethAccountToUse],adminValidatorSetAddress);
    
    const simpleValidatorSetAddress = await deployNewSingleSetValidatorContract(ethAccountToUse,adminValidatorSetAddress);
    console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
    simpleValidatorSet.setOwnersParameters(ethAccountToUse,privateKey[ethAccountToUse],simpleValidatorSetAddress);

    var flag = await getListOfActiveValidators();

    flag = await addSimpleSetContractValidatorsForAdmin(ethAccountToUse);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators",flag);

    flag = await removeSimpleSetContractValidatorsForAdmin(ethAccountToUse);
    console.log("return flag for removeSimpleSetContractValidatorsForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators ",flag);
}

main();

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
        validatorList = await simpleValidatorSet.getAllValidatorsAsync();
        if (validatorList != undefined && validatorList.length > 0) {
            validatorList.forEach(eachElement => {
                if(simpleValidatorSet.isActiveValidator(eachElement)){
                    noOfActiveValidator++;
                    console.log(eachElement, "\n");
                }    
            });
        }
        console.log("Number of active validators " + noOfActiveValidator);
        return true;
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
        console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
        if(accountAddressList.length <= 0)
            return;
        
        // try{
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[0],password,3000000);
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[1],password,3000000);
        //     result = await web3.eth.personal.unlockAccount(accountAddressList[2],password,3000000);
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

async function accessEarlierGreeting(ethAccountToUse){
    //var abi, bytecode;
    var greeting1, greeting2;

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter.json");
    if(value.length <= 0){
        // this.adminValidatorSetAbi = value[0];
        // this.adminValidatorSetByteCode = value[1];
        return;
    }

    var constructorParameters = [];
    constructorParameters.push("Hi Rahul");
    var deployedAddress = await utils.deployContract(value[0], value[1], ethAccountToUse, constructorParameters, web3);//, function(returnTypeString, result){
    console.log("Greeter deployedAddress ", deployedAddress);
    greeting1 = new web3.eth.Contract(JSON.parse(value[0]),deployedAddress);
    //greeting2 = new web3.eth.Contract(JSON.parse(value[0]),"0x1d794eCe857B3bc8f14b467040bB964DEC2aaf9e");
    
    greeting1.methods.greet().call().then(result => {
        console.log("myvalue", result);
    });

    // greeting2.methods.greet().call().then(result => {
    //     console.log("myvalue", result);
    // });

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