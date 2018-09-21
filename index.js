const fs = require('fs');
const Web3 = require('web3');
const utils =  require('./web3util');
const async =  require('async');
const SimpleValidatorSet = require('./simplevalidatorset');
const AdminValidatorSet = require('./adminvalidatorset');

var host = "http://localhost:20100";
var web3 = new Web3(new Web3.providers.HttpProvider(host));

// var host = "ws://localhost:9000";
// web3 = new Web3(new Web3.providers.WebsocketProvider(host));

//Helper object for SimpleValidator Contract and AdminValdiator Contract! For now, globally declared
var adminValidatorSet,simpleValidatorSet;
var privateKey = {};
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
    readWritePrivateKeys(accountAddress);
    
    result = await web3.eth.net.getId();
    console.log("Network ID", web3.utils.toHex(result));
    
    adminValidatorSet = new AdminValidatorSet(web3);
    simpleValidatorSet = new SimpleValidatorSet(web3);

    var otherAdminsList = [];
    var ethAccountToUse = accountAddress[0];
    otherAdminsList.push(accountAddress[1]);
    otherAdminsList.push(accountAddress[2]);
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

function readWritePrivateKeys(accountAddressList){
    
    try{
        var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
        var keyStorePath = __dirname;
        const password = "password";
        var keyData = {};
        if(fs.existsSync(privateKeyFileName)){
            keyData = fs.readFileSync(privateKeyFileName,"utf8");
            keyData = JSON.parse(keyData);
        }    
        var key;
        console.log("no of ethereum accounts", accountAddressList.length);
        if(accountAddressList.length > 0){
            accountAddressList.forEach(eachElement => {
            if(keyData[eachElement] != undefined)
                key = keyData[eachElement];
            else
            {    
                try{
                    key = utils.getPrivateKeyFromKeyStore(eachElement, keyStorePath, password);
                }
                catch (error) {
                    console.log(error);
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
        // console.log("accountaddress ", newAccount);

        //var account = web3.eth.accounts.privateKeyToAccount(privateKey[accountAddressList[0]]);
        //console.log("accountaddress ", accountAddressList[0], "recovered account with private key is", privateKey[accountAddressList[0]], account.address);
    }
    catch (error) {
        console.log("Error in readWritePrivateKeys: " + error);
    }
}