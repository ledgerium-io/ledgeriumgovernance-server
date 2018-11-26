class SimpleValidatorSet {

    constructor(web3provider, utils, simpleValidatorSetAddress, abi, Web3) {
        this.web3 = new Web3(web3provider);
        this.utils = utils;
        var value;
        if(!abi) {
            //Read ABI and Bytecode from dynamic source.
            var value = this.utils.readSolidityContractJSON("./build/contracts/SimpleValidatorSet.json");
        }else{
            value = [abi, ""];
        }
        if(value.length > 0){
            this.simpleValidatorSetAbi = value[0];
            this.simpleValidatorSetByteCode = value[1];
            this.simpleValidatorSetAddress = simpleValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(
                JSON.parse(this.simpleValidatorSetAbi), simpleValidatorSetAddress);
        }
    }
    
    async setOwnersParameters(ethAccountToUse,_privateKey,simpleValidatorSetAddress,adminValidatorSetAddress){
        try{
            this.simpleValidatorSetAddress = simpleValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi),this.simpleValidatorSetAddress);

            if(pastEventsSubscriptionFlag){
                this.subscribeForPastEvents();
                this.listenForContractObjectEvents(this.contract);  
            }
            console.log("pastEventsSubscriptionFlag", pastEventsSubscriptionFlag);
            
            let transactionHash = await this.init(ethAccountToUse,_privateKey,adminValidatorSetAddress);
            return transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet:setOwnersParameters(): " + error);
            return "";
        }  
    }
    
    async deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey,adminValidatorSetAddress,otherValidatorList) {
        try {
            var constructorParameters = [];
            //constructorParameters.push(adminValidatorAddress);
            constructorParameters = constructorParameters.concat(otherValidatorList);
            var estimatedGas = 0;
            var encodedABI = await this.utils.getContractEncodeABI(this.simpleValidatorSetAbi, this.simpleValidatorSetByteCode,this.web3,constructorParameters);
            var deployedAddress = await this.utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey,this.web3,estimatedGas);
            return deployedAddress.contractAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:deployNewSimpleSetValidatorContract(): " + error);
            return "";
        }
    }
    
    async init(ethAccountToUse, privateKey,adminValidatorSetAddress){
        try{
            var encodedABI = this.contract.methods.init(adminValidatorSetAddress).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:init(): " + error);
            return false;
        }
    }
    
    async getAllValidatorsAsync(ethAccountToUse) {
        var resultList = [];
        try {
            var encodedABI = this.contract.methods.getAllValidators().encodeABI();
            resultList = await this.utils.getData(ethAccountToUse,this.simpleValidatorSetAddress,encodedABI,this.web3);
            console.log(resultList);
            return this.utils.split(resultList);
        } catch (error) {
            console.log("Error in SimpleValidatorSet:getAllValidatorsAsync(): " + error);
            return resultList;
        }
    }

    async getAdminValidatorsAsync(ethAccountToUse) {
        try {
            this.contract.methods.getValidatorsForAdmin().call({from: ethAccountToUse}).then(function(resultList){
                console.log("GetAdminValidatorsAsync resultList for ",adminAddress, resultList.length);
                if (resultList.length > 0) {
                    resultList.forEach(eachElement => {
                        console.log(eachElement, "\n");
                    });
                }
            });
        } catch (error) {
            console.log("Error in SimpleValidatorSet:getAdminValidatorsAsync(): " + error);
            return "";
        }
    }
    
    async proposalToAddValidator(ethAccountToUse, privateKey, newValidator){
        try{
            var encodedABI = this.contract.methods.proposalToAddValidator(newValidator).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.proposalToAddValidator(): " + error);
            return false;
        }
    }

    async voteForAddingValidator(ethAccountToUse, privateKey, otherValidatorToAdd){
        try{
            var encodedABI = this.contract.methods.voteForAddingValidator(otherValidatorToAdd).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.voteForAddingValidator(): " + error);
            return false;
        }
    }

    async voteAgainstAddingValidator(ethAccountToUse, privateKey, otherValidatorToAdd){
        try{
            var encodedABI = this.contract.methods.voteAgainstAddingValidator(otherValidatorToAdd).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.voteAgainstAddingValidator(): " + error);
            return false;
        }
    }
    
    async proposalToRemoveValidator(ethAccountToUse, privateKey, otherValidatorToRemove){
        try{
            var encodedABI = this.contract.methods.proposalToRemoveValidator(otherValidatorToRemove).encodeABI();
            //var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            //console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,
                this.contract._address,encodedABI,privateKey,this.web3, estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.proposalToRemoveValidator(): " + error);
            return false;
        }
    }

    proposalToRemoveValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn){
        try{
            var encodedABI = this.contract.methods.proposalToRemoveValidator(otherValidatorToRemove).encodeABI();
            //var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            //console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            this.utils.sendMethodTransactionCb(ethAccountToUse,
                this.contract._address,encodedABI,privateKey,this.web3, estimatedGas, fn);
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.proposalToRemoveValidatorCb(): " + error);
            return false;
        }
    }

    ProposeAddValidatorFromChain(sender, validator, fn) {
        fetch('/istanbul_propose', {
            method: 'post',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({
                account: validator,
                sender: sender,
                proposal: true
            })
        }).then(data => {
            console.log(data);
            fn(null, data);
        }).catch(error => { 
            console.error('Error:', error);
            fn(error, null);
        });
        return;
    }

    ProposeRemoveValidatorFromChain(sender, validator, fn) {
        fetch('/istanbul_propose', {
            method: 'post',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({
                account: validator,
                sender: sender,
                proposal: false
            })
        }).then(data => {
            console.log(data);
            fn(null, data);
        }).catch(error => { 
            console.error('Error:', error);
            fn(error, null);
        });
        return;
    }

    voteForRemovingValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn){
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.voteForRemovingValidator(otherValidatorToRemove).encodeABI();

            this.utils.sendMethodTransactionCb(ethAccountToUse,
                this.contract._address,encodedABI,privateKey,this.web3, estimatedGas, fn);
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.voteForRemovingValidatorCb(): " + error);
            return false;
        }
    }

    async voteForRemovingValidator(ethAccountToUse, privateKey, otherValidatorToRemove){
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.voteForRemovingValidator(otherValidatorToRemove).encodeABI();
            
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.voteForRemovingValidator(): " + error);
            return false;
        }
    }
    
    async voteAgainstRemovingValidator(ethAccountToUse, privateKey, otherValidatorToRemove){
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.voteAgainstRemovingValidator(otherValidatorToRemove).encodeABI();
            
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,
                this.contract._address,
                encodedABI,
                privateKey,
                this.web3,
                estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.voteAgainstRemovingValidator(): " + error);
            return false;
        }
    }

    voteAgainstRemovingValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn){
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.voteAgainstRemovingValidator(otherValidatorToRemove).encodeABI();

            this.utils.sendMethodTransactionCb(ethAccountToUse,
                this.contract._address,
                encodedABI,
                privateKey,
                this.web3,
                estimatedGas,
                fn);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.voteAgainstRemovingValidatorCb(): " + error);
            return false;
        }
    }
   
    async isActiveValidator(ethAccountToUse, validatorAddress) {
        try {
            var data = await this.contract.methods.isActiveValidator(validatorAddress).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:isActiveValidator(): " + error);
            return false;
        }
    }

    async checkVotes(ethAccountToUse, validatorAddress){
        try {
            var votes = await this.contract.methods.checkVotes(validatorAddress).call({from : ethAccountToUse});
            return votes;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.checkAdmin(): " + error);
            return false;
        }
    }
    
    async checkProposal(ethAccountToUse, validatorAddress) {
        try {
            var data = await this.contract.methods.checkProposal(validatorAddress).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:hasProposal(): " + error);
            return false;
        }
    }

    subscribeForPastEvents(){
        var options = {
            fromBlock: "latest",
            address: this.simpleValidatorSetAddress
        };
        this.contract.getPastEvents(
            'AllEvents',
            {
              fromBlock: 0,
              toBlock: 'latest'
            },
            (err, events) => {
                if(events.length > 0){
                    events.forEach(eachElement => {
                        if(eachElement.event == "addvalidator"){
                            console.log("addvalidator:Contract address",eachElement.address);
                            console.log("addvalidator:Transaction Hash",eachElement.transactionHash);
                            console.log("addvalidator:Block Hash",eachElement.blockHash);
                            console.log("addvalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                        else if(eachElement.event == "removevalidator"){
                            console.log("removevalidator:Contract address",eachElement.address);
                            console.log("removevalidator:Transaction Hash",eachElement.transactionHash);
                            console.log("removevalidator:Block Hash",eachElement.blockHash);
                            console.log("removevalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                    })
                }
                
            });
     }     
        
     listenForContractObjectEvents(contractObject){
        this.utils.listenAllEventsContract(contractObject,(events)=>{
            console.log('SimpleValidatorSet Event Received');
            switch(events.event){
                case "minValidatorNeeded":
                    console.log("minValidatorNeeded");
                    break;
                case "addValidator":
                    console.log("addValidator");
                    break;
                case "removeValidator":
                    console.log("removeValidator");
                    break;
                case "votedfor":
                    console.log("votedfor");
                    break;
                case "votedagainst":
                    console.log("votedagainst");
                    break;
                case "alreadyProposalForAddingValidator":
                    console.log("alreadyProposalForAddingValidator");
                    break;
                case "alreadyProposalForRemovingValidator":
                    console.log("alreadyProposalForRemovingValidator");
                    break;
                case "noProposalForAddingValidator":
                    console.log("noProposalForAddingValidator");
                    break;
                case "noProposalForRemovingValidator":
                    console.log("noProposalForRemovingValidator");
                    break;
                case "alreadyActiveValidator":
                    console.log("alreadyActiveValidator");
                    break;
                case "alreadyInActiveValidator":
                    console.log("alreadyInActiveValidator");
                    break;
            }
        });

        // this.utils.subscribeForLogs("logs", this.web3, this.simpleValidatorSetAddress, (events)=>{
        //     console.log('SimpleValidatorSet subscribe Event Received');
        //     switch(events.event){
        //         case "minValidatorNeeded":
        //             console.log("minValidatorNeeded");
        //             break;
        //         case "addValidator":
        //             console.log("addValidator");
        //             break;
        //         case "removeValidator":
        //             console.log("removeValidator");
        //             break;
        //         case "votedfor":
        //             console.log("votedfor");
        //             break;
        //         case "votedagainst":
        //             console.log("votedagainst");
        //             break;
        //         case "alreadyProposalForAddingValidator":
        //             console.log("alreadyProposalForAddingValidator");
        //             break;
        //         case "alreadyProposalForRemovingValidator":
        //             console.log("alreadyProposalForRemovingValidator");
        //             break;
        //         case "noProposalForAddingValidator":
        //             console.log("noProposalForAddingValidator");
        //             break;
        //         case "noProposalForRemovingValidator":
        //             console.log("noProposalForRemovingValidator");
        //             break;
        //         case "alreadyActiveValidator":
        //             console.log("alreadyActiveValidator");
        //             break;
        //         case "alreadyInActiveValidator":
        //             console.log("alreadyInActiveValidator");
        //             break;
        //     }
        // });
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = SimpleValidatorSet;
else
    window.SimpleValidatorSet = SimpleValidatorSet;