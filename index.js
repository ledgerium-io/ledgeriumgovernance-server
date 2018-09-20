const Web3 = require('web3');
const utils =  require('./web3util');
const async =  require('async');
const SimpleValidatorSet = require('./simplevalidatorset');
const AdminValidatorSet = require('./adminvalidatorset');

var privateKey = ['ad354fec0c128d11fff746a2f464ecabb7a5a03f8934540ac71ca2350d707a6d',
                  'f392eaad836eea3f6b8a59d0b84d4ca349976b35ab05ded71115de567c2034e1',
                  '4fd0dadcba3f9e9ecea32d362a31bca2e3733aa05c26b880e7a477df53c9a501'];

//var keyStorePath = __dirname;
//const password = "password";

// privateKey[0] = utils.getPrivateKeyFromKeyStore(accountAddress[0], keyStorePath, password);
// console.log(privateKey[0]);

// privateKey[1] = utils.getPrivateKeyFromKeyStore(accountAddress[1], keyStorePath, password);
// console.log(privateKey[1]);

// privateKey[2] = utils.getPrivateKeyFromKeyStore(accountAddress[2], keyStorePath, password);
// console.log(privateKey[2]);

// privateKey[3] = utils.getPrivateKeyFromKeyStore(accountAddress[3], keyStorePath, password);
// console.log(privateKey[3]);

var host = "http://localhost:20100";
web3 = new Web3(new Web3.providers.HttpProvider(host));

// var host = "ws://localhost:9000";
// web3 = new Web3(new Web3.providers.WebsocketProvider(host));

//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidatorSet,simpleValidatorSet;
var main = async function () {
    var accountAddress = [];
    accountAddress = await web3.eth.getAccounts();
    console.log("There are accounts in the blockchain ", accountAddress.length);
    if(accountAddress.length <= 0)
        return;
    var i = 0;
    accountAddress.forEach(eachElement => {
        console.log(i++,"th account", eachElement);
    });
    result = await web3.eth.net.getId();
    console.log("Network ID", web3.utils.toHex(result));
    
    adminValidatorSet = new AdminValidatorSet(web3);
    simpleValidatorSet = new SimpleValidatorSet(web3);

    var otherAdminsList = [];
    otherAdminsList.push(accountAddress[1]);
    otherAdminsList.push(accountAddress[2]);
    const adminValidatorSetAddress = await deployNewAdminSetValidatorContract(accountAddress[0],otherAdminsList);
    console.log("adminValidatorSetAddress",adminValidatorSetAddress);
    adminValidatorSet.setOwnersParameters(accountAddress[0],privateKey[0],adminValidatorSetAddress);
    
    const simpleValidatorSetAddress = await deployNewSingleSetValidatorContract(accountAddress[0],adminValidatorSetAddress);
    console.log("simpleValidatorSetAddress",simpleValidatorSetAddress);
    simpleValidatorSet.setOwnersParameters(accountAddress[0],privateKey[0],simpleValidatorSetAddress);

    var flag = await getListOfActiveValidators();

    flag = await addSimpleSetContractValidatorsForAdmin(accountAddress[0]);
    console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

    flag = await getListOfActiveValidators();
    console.log("return flag for getListOfActiveValidators",flag);

    flag = await removeSimpleSetContractValidatorsForAdmin(accountAddress[0]);
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
        if (validatorList.length > 0) {
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
        console.log("Error in removeSimpleSetContractValidatorsForAdmin(): " + error);
        return false;
    }
}