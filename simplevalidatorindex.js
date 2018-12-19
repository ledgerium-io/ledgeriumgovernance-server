'use strict';
const Web3 = require('web3');
const SimpleValidatorSet = require('./simplevalidatorset');

class SimpleValidator{
    
    constructor(){
        this.simpleValidatorSet = new SimpleValidatorSet(web3, utils, "", undefined, Web3);
    }

    async setHelperParameters(simpleValidatorSetAddress,adminValidatorSetAddress){
        let tranHash = await this.simpleValidatorSet.setOwnersParameters(accountAddressList[0],accountAddressList[1],accountAddressList[2],privateKey[accountAddressList[0]],simpleValidatorSetAddress,adminValidatorSetAddress);
        return tranHash;
    }

    async deployNewSimpleSetValidatorContractWithPrivateKey(adminValidatorSetAddress)
    {
        let ethAccountToUse = accountAddressList[0];
        let privateKeyOwner = privateKey[ethAccountToUse];
        let validatorAddressList = [];
        // validatorAddressList.push(accountAddressList[1]);
        // validatorAddressList.push(accountAddressList[2]);
        let singleValrSetAddress = await this.simpleValidatorSet.deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKeyOwner,adminValidatorSetAddress,validatorAddressList);
        return singleValrSetAddress;
    }

    /** This will add all the istanbul existing validator nodes as validator in SimpleValidatorSet SmartContract! Both list will come 
    /in sync.
    */
    async validatorSetup(){
        console.log("****************** Setup Validators list ******************");
        console.log("****************** Start ******************");
        try{
            var activeValidatorList;
            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for getListOfActiveValidators",activeValidatorList.length);

            var noOfAccounts = Object.keys(privateKey).length;
            //Let the first account, as existing validator propose to add new validators!
            var ethAccountToPropose = accountAddressList[0];
            console.log("No of accounts to setup as validators ", noOfAccounts);
            
            //We will start with 4th element as first 3 are as
            for(var index = 3; index < noOfAccounts; index++ ){
                let newValidator = accountAddressList[index]; //New validator to be added
                
                var transactionhash = await this.simpleValidatorSet.proposalToAddValidator(ethAccountToPropose, privateKey[ethAccountToPropose], newValidator);
                console.log("submitted transactionhash ",transactionhash, "for proposal to add ", newValidator);

                var whatProposal = await this.simpleValidatorSet.checkProposal(ethAccountToPropose,newValidator);
                console.log(newValidator, "checked proposal for the validator ?", whatProposal);

                var newValidatorList = await this.getListOfActiveValidators();
                for(var indexAV = 0; indexAV < newValidatorList.length; indexAV++){
                    if(ethAccountToPropose == newValidatorList[indexAV])
                        continue;
                    console.log("****************** New Voting Loop Start ******************");
                    var votingFrom = newValidatorList[indexAV];
                    transactionhash = await this.simpleValidatorSet.voteForAddingValidator(votingFrom, privateKey[votingFrom], newValidator);
                    console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator);

                    whatProposal = await this.simpleValidatorSet.checkProposal(ethAccountToPropose, newValidator);
                    console.log(newValidator, "checked proposal for the validator ?", whatProposal);
                    //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                    //if so, dont need to run the loop and break it now, to run further voting!
                    if(whatProposal == "proposal not created")
                        break; 
                    console.log("****************** New Voting Loop End ******************");    
                }
            }
            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for SimpleValidator:getListOfActiveValidators",activeValidatorList.length);
            console.log("****************** End validatorSetup ******************");
            return true;
        }
        catch (error) {
            console.log("Error in SimpleValidator:validatorSetup(): " + error);
            return false;
        }
    }

    async runValidatorTestCases(){
        console.log("****************** Running Validator Test cases ******************");
        console.log("****************** Start Validator Test cases ******************");
        try{
            var activeValidatorList;
            //Default 3 validators in the list, we will add 4 more from the list first. 
            var newValidator = accountAddressList[3];
            var flag = await this.addSimpleSetContractValidatorForAdmin(newValidator);
            console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for getListOfActiveValidators",activeValidatorList.length);
            
            newValidator = accountAddressList[4];
            flag = await this.addSimpleSetContractValidatorForAdmin(newValidator);
            console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for getListOfActiveValidators",activeValidatorList.length);

            newValidator = accountAddressList[5];
            flag = await this.addSimpleSetContractValidatorForAdmin(newValidator);
            console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for getListOfActiveValidators",activeValidatorList.length);

            newValidator = accountAddressList[6];
            flag = await this.addSimpleSetContractValidatorForAdmin(newValidator);
            console.log("return flag for addSimpleSetContractValidatorsForAdmin",flag);

            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for getListOfActiveValidators",activeValidatorList.length);

            //Now, total no of validators are not 7! Now, run the remove validator testcase!
            var removeValidator = accountAddressList[6];
            flag = await this.removeSimpleSetContractValidatorForAdmin(removeValidator);
            console.log("return flag for removeSimpleSetContractValidatorForAdmin",flag);

            activeValidatorList = await this.getListOfActiveValidators();
            console.log("return list for getListOfActiveValidators",activeValidatorList.length);

            console.log("****************** End Validator Test cases ******************");
            return true;
        }
        catch (error) {
            console.log("Error in SimpleValidator:runValidatorTestCases(): " + error);
            return false;
        }
    }

    async runRemoveValidatorTestCases(){
        console.log("****************** Running Remove Validator Test cases ******************");
        try{
            var activeValidatorList;
            activeValidatorList = await this.getListOfActiveValidators();
            for(var indexAV = 1; indexAV < activeValidatorList.length; indexAV++){
                let removeValidator = activeValidatorList[indexAV];
                let flag = await this.removeSimpleSetContractValidatorForAdmin(removeValidator);
                console.log("return flag for removeSimpleSetContractValidatorForAdmin",flag);
                let activeValidatorCurrentList = await this.getListOfActiveValidators();
                console.log("return list for updated getListOfActiveValidators",activeValidatorCurrentList.length);
            }
            console.log("****************** End Remove Validator Test cases ******************");
            return true;
        }
        catch (error) {
            console.log("Error in SimpleValidator:runRemoveValidatorTestCases(): " + error);
            return false;
        }
    }

    async addSimpleSetContractValidatorForAdmin(newValidator){
        console.log("****************** Running addSimpleSetContractValidatorForAdmin ******************");
        try{
            var from = accountAddressList[0];
            var ethAccountToPropose = accountAddressList[0];

            var whatProposal = await this.simpleValidatorSet.checkProposal(accountAddressList[0],newValidator);
            console.log(newValidator, "checked proposal for the validator ?", whatProposal);

            var votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

            var transactionhash = await this.simpleValidatorSet.proposalToAddValidator(from, privateKey[from], newValidator);
            console.log("submitted transactionhash ",transactionhash, "for proposal to add ", newValidator, "by admin", from);

            whatProposal = await this.simpleValidatorSet.checkProposal(accountAddressList[0],newValidator);
            console.log(newValidator, "checked proposal for the validator ?", whatProposal);

            votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

            /* Lets see who proposed this validator for add*/
            var proposer = await this.simpleValidatorSet.getProposer(ethAccountToPropose, newValidator);
            console.log(newValidator, "checked proposer for the validator ?", proposer);

            var activeValidatorList = await this.getListOfActiveValidators();
            for(var indexAV = 0; indexAV < activeValidatorList.length;indexAV++){
                if(ethAccountToPropose == activeValidatorList[indexAV])
                    continue;
                let votingFor = activeValidatorList[indexAV];
                transactionhash = await this.simpleValidatorSet.voteForAddingValidator(votingFor, privateKey[votingFor], newValidator);
                console.log("submitted transactionhash ",transactionhash, "for voting to add ", newValidator, "by validator", votingFor);

                /* Lets see how voting looks at the moment! It should return 1,1*/
                let votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
                console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);

                indexAV++;
                let votingAgainst = activeValidatorList[indexAV];
                if(votingAgainst == undefined)
                    break;
                /* Lets see how voting looks at the moment! It should return 1,1*/
                transactionhash = await this.simpleValidatorSet.voteAgainstAddingValidator(votingAgainst, privateKey[votingAgainst], newValidator);
                console.log("submitted transactionhash ",transactionhash, "against voting to add ", newValidator, "by validator", votingAgainst);
                
                /* Lets see how voting looks at the moment! It should return 1,1*/
                votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose, newValidator);
                console.log(newValidator, "checked votes for adding as validator ?", votes[0], votes[1]);
                
                whatProposal = await this.simpleValidatorSet.checkProposal(ethAccountToPropose, newValidator);
                console.log(newValidator, "checked proposal for the validator ?", whatProposal);
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
            this.istanbulAddValidator(newValidator);
            console.log("****************** Ending addSimpleSetContractValidatorForAdmin ******************");
            return true;
        }
        catch (error) {
            console.log("Error in SimpleValidator:addSimpleSetContractValidatorForAdmin(): " + error);
            return false;
        }
    }

    async removeSimpleSetContractValidatorForAdmin(removeValidator){
        console.log("****************** Running removeSimpleSetContractValidatorForAdmin ******************");
        try{
            var ethAccountToPropose = accountAddressList[0];

            /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
            * There are 3 validator in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
            * Sending Proposal means, adding one vote to the proposal
            */
            /* Lets see whether this is validator or not already, if not, we can ignore else will proceed further*/
            var flag = await this.simpleValidatorSet.isActiveValidator(ethAccountToPropose,removeValidator);
            console.log(removeValidator, "already an validator ?", flag);
            if(!flag) 
               return true;

            /*We are testing REMOVE validator functionality here with one proposal FOR removing and one more vote FOR removing,
            * makes more than 3/2 brings this a majority and validator will be removed. And proposal will be cleared off!
            * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
            */
            var transactionhash = await this.simpleValidatorSet.proposalToRemoveValidator(ethAccountToPropose, privateKey[ethAccountToPropose], removeValidator);
            console.log("submitted transactionhash ",transactionhash, "for proposal of removing ", removeValidator, "by admin", ethAccountToPropose);

            /* Since REMOVE the validator proposal is raised, checkProposal should return "remove"*/
            var whatProposal = await this.simpleValidatorSet.checkProposal(ethAccountToPropose,removeValidator);
            console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            var votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
            console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

            /* Lets see who proposed this validator for removal*/
            var proposer = await this.simpleValidatorSet.getProposer(ethAccountToPropose, removeValidator);
            console.log(removeValidator, "checked proposer for the validator ?", proposer);

            var activeValidatorList = await this.getListOfActiveValidators();
            for(var indexAV = 0; indexAV < activeValidatorList.length; indexAV++){
                if(ethAccountToPropose == activeValidatorList[indexAV])
                    continue;
                let votingFor = activeValidatorList[indexAV];
                transactionhash = await this.simpleValidatorSet.voteForRemovingValidator(votingFor, privateKey[votingFor], removeValidator);
                console.log("submitted transactionhash ",transactionhash, "for voting to remove ", removeValidator, "by validator", votingFor);

                whatProposal = await this.simpleValidatorSet.checkProposal(ethAccountToPropose, removeValidator);
                console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
                
                /* Lets see how voting looks at the moment! It should return 1,0*/
                let votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose,removeValidator);
                console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

                indexAV++;
                let votingAgainst = activeValidatorList[indexAV];
                if(votingAgainst == undefined)
                    break;
                /* Lets see how voting looks at the moment! It should return 1,1*/
                transactionhash = await this.simpleValidatorSet.voteAgainstRemovingValidator(votingAgainst, privateKey[votingAgainst], removeValidator);
                console.log("submitted transactionhash ",transactionhash, "against voting to add ", removeValidator, "by validator", votingAgainst);
                
                /* Lets see how voting looks at the moment! It should return 1,1*/
                votes = await this.simpleValidatorSet.checkVotes(ethAccountToPropose, removeValidator);
                console.log(removeValidator, "checked votes for removing as validator ?", votes[0], votes[1]);

                whatProposal = await this.simpleValidatorSet.checkProposal(ethAccountToPropose, removeValidator);
                console.log(removeValidator, "checked proposal for the validator ?", whatProposal);
                
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
            /* Since the validator is removed, isActiveValidator should be false
            */
            var flag = await this.simpleValidatorSet.isActiveValidator(ethAccountToPropose,removeValidator);
            console.log(removeValidator, "still an validator ?", flag);

            this.istanbulRemoveValidator(removeValidator);
            console.log("****************** Ending removeSimpleSetContractValidatorForAdmin ******************");
            return flag;
        }
        catch (error) {
            console.log("Error in SimpleValidator:removeSimpleSetContractValidatorForAdmin(): " + error);
            return false;
        }
    }

    async getListOfActiveValidators()
    {
        var activeValidatorList = [];
        try{
            var noOfActiveValidator = 0;
            var validatorList = [];
            validatorList = await this.simpleValidatorSet.getAllValidatorsAsync(accountAddressList[0]);
            if (validatorList != undefined && validatorList.length > 0) {
                for(var index = 0; index < validatorList.length; index++ ){
                    var flag = await this.simpleValidatorSet.isActiveValidator(accountAddressList[0],validatorList[index]);
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
            console.log("Error in SimpleValidator:getListOfActiveValidators(): " + error);
        }
        return activeValidatorList;
    }

    async istanbulAddValidator(validatorAddress)
    {
        //await this.listIstanbulValidator();
        
        await this.addIstanbulValidator(8545,validatorAddress);
        await this.addIstanbulValidator(8546,validatorAddress);
        await this.addIstanbulValidator(8547,validatorAddress);
        await this.addIstanbulValidator(8548,validatorAddress);
        await this.addIstanbulValidator(8549,validatorAddress);
        await this.addIstanbulValidator(8550,validatorAddress);

        await this.delay(10000); //wait for 10 seconds!
        //await this.listIstanbulValidator();
        return;
    }

    async istanbulRemoveValidator(validatorAddress){
        //await this.listIstanbulValidator();

        await this.removeIstanbulValidator(8545,validatorAddress);
        await this.removeIstanbulValidator(8546,validatorAddress);
        await this.removeIstanbulValidator(8547,validatorAddress);
        await this.removeIstanbulValidator(8548,validatorAddress);
        await this.removeIstanbulValidator(8549,validatorAddress);
        await this.removeIstanbulValidator(8550,validatorAddress);

        await this.delay(10000); //wait for 10 seconds!
        //await this.listIstanbulValidator();
        return;
    }

    async addIstanbulValidator(_port,validator)
    {
        let URL = "http://" + host + ":" + _port;
        console.log("addIstanbulValidator pointing to", URL);
        var web3 = new Web3(new Web3.providers.HttpProvider(URL));
        var coinbase = await web3.eth.getCoinbase();
        console.log("coinbase of host", URL, "is", coinbase);
        var message = {
            method: "istanbul_propose",
            params: [validator,true],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        ///!!!!!!!!we can not call await here as httpprovider only supports callback!!!!!!
        //var err,result = await web3.currentProvider.send(message);//,(err,result)=>{
        web3.currentProvider.send(message,(err,result)=>{
        console.log("received results:addIstanbulValidator");
            if(!err){
                if(result != undefined && result.result != undefined)
                    console.log("results", result.result);
            }
            else
                console.log("Error in SimpleValidator:addIstanbulValidator", err);
        });
        return;
    }

    async removeIstanbulValidator(_port,validator)
    {
        let URL = "http://" + host + ":" + _port;
        console.log("removeIstanbulValidator pointing to", URL);
        var web3 = new Web3(new Web3.providers.HttpProvider(URL));
        var coinbase = await web3.eth.getCoinbase();
        console.log("coinbase of host", URL, "is", coinbase);
        var message = {
            method: "istanbul_propose",
            params: [validator,false],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        ///!!!!!!!!we can not call await here as httpprovider only supports callback!!!!!!
        //var err,result = await web3.currentProvider.send(message);//,(err,result)=>{
        web3.currentProvider.send(message,(err,result)=>{
            console.log("received results:removeIstanbulValidator");
            if(!err){
                if(result != undefined && result.result != undefined)
                    console.log("results", result.result);
            }
            else
                console.log("Error in SimpleValidator:removeIstanbulValidator", err);
        });
        return;
    }

    async listIstanbulValidator()
    {
        let URL = "http://" + host + ":" + port;
        console.log("listIstanbulValidator pointing to", URL);
        var web3 = new Web3(new Web3.providers.HttpProvider(URL));
        var message = {
            method: "istanbul_getValidators",
            params: [],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        ///!!!!!!!!we can not call await here as httpprovider only supports callback!!!!!!
        web3.currentProvider.send(message,(err,result)=>{
            console.log("received results:listIstanbulValidator");
            if(!err){
                if(result != undefined && result.result != undefined)
                    console.log("results", result.result);
            }
            else
                console.log("Error in SimpleValidator:listIstanbulValidator", err);
        });
        return;
    }

    delay(ms){
        new Promise(function(res) {
                setTimeout(res, ms); 
            }
        );
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = SimpleValidator;
}else{
    window.SimpleValidator = SimpleValidator;
}
