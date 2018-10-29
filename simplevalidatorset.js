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
    
    setOwnersParameters(simpleValidatorSetAddress){
        try{
            this.simpleValidatorSetAddress = simpleValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi),this.simpleValidatorSetAddress);

            //this.subscribeForPastEvents();
            //this.listenForContractObjectEvents(this.contract);
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet.setOwnersParameters(): " + error);
            return "";
        }  
    }    
    
    async deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey,adminValidatorAddress,otherValidatorList) {
        try {
            var constructorParameters = [];
            constructorParameters.push(adminValidatorAddress);
            constructorParameters = constructorParameters.concat(otherValidatorList);
            var estimatedGas = 0;
            var encodedABI = await this.utils.getContractEncodeABI(this.simpleValidatorSetAbi, this.simpleValidatorSetByteCode,this.web3,constructorParameters);
            var deployedAddress =  await this.utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey,this.web3,estimatedGas);
            this.simpleValidatorSetAddress = deployedAddress.contractAddress;    
            return this.simpleValidatorSetAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.deployNewSimpleSetValidatorContract(): " + error);
            return "";
        }
    }
    
    async deployNewSimpleSetValidatorContract(ethAccountToUse, adminValidatorAddress) {
        try {
            var constructorParameters = [];
            constructorParameters.push(adminValidatorAddress);
            var deployedAddress = await this.utils.deployContract(this.simpleValidatorSetAbi, this.simpleValidatorSetByteCode, ethAccountToUse, constructorParameters, this.web3);//, function(returnTypeString, result){
            this.simpleValidatorSetAddress = deployedAddress;    
            return this.simpleValidatorSetAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.deployNewSimpleSetValidatorContract(): " + error);
            return "";
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
            console.log("Error in SimpleValidatorSet.getAllValidatorsAsync(): " + error);
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
            console.log("Error in SimpleValidatorSet.getAdminValidatorsAsync(): " + error);
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
            console.log("Error in AdminValidatorSet.proposalToAddValidator(): " + error);
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
            console.log("Error in AdminValidatorSet.voteForAddingValidator(): " + error);
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
            console.log("Error in AdminValidatorSet.voteAgainstAddingValidator(): " + error);
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
            console.log("Error in AdminValidatorSet.proposalToRemoveValidator(): " + error);
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
            console.log("Error in AdminValidatorSet.proposalToRemoveValidatorCb(): " + error);
            return false;
        }
    }

    ProposeRemoveValidatorFromChain(validator, fn) {
        var message = {
            method: "istanbul_propose",
            params: [validator,false],
            jsonrpc: "2.0",
            id: new Date().getTime()
        };
        
        this.web3.currentProvider.send(message, fn);
        return;
    }

    voteForRemovingValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn){
        try{
            var encodedABI = this.contract.methods.voteForRemovingValidator(otherValidatorToRemove).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            this.utils.sendMethodTransactionCb(ethAccountToUse,
                this.contract._address,encodedABI,privateKey,this.web3, estimatedGas, fn);
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteForRemovingValidatorCb(): " + error);
            return false;
        }
    }

    async voteForRemovingValidator(ethAccountToUse, privateKey, otherValidatorToRemove){
        try{
            var encodedABI = this.contract.methods.voteForRemovingValidator(otherValidatorToRemove).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteForRemovingValidator(): " + error);
            return false;
        }
    }
    
    async voteAgainstRemovingValidator(ethAccountToUse, privateKey, otherValidatorToRemove){
        try{
            var encodedABI = this.contract.methods.voteAgainstRemovingValidator(otherValidatorToRemove).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteAgainstRemovingValidator(): " + error);
            return false;
        }
    }
    
    // async addValidator(ethAccountToUse, privateKey, newValidator) {
    //     try {
    //         var encodedABI = this.contract.methods.addValidator(newValidator).encodeABI();
    //         // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
    //         // console.log("estimatedGas",estimatedGas);
    //         var estimatedGas = 0;
    //         var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
    //         return transactionObject.transactionHash;
    //     } catch (error) {
    //         console.log("Error in SimpleValidatorSet.addValidator(): " + error);
    //         return "";
    //     }    
    // }

    // async removeValidator(ethAccountToUse, privateKey, validatorToRemove) {
    //     try {
    //         var encodedABI = this.contract.methods.removeValidator(validatorToRemove).encodeABI();
    //         // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
    //         // console.log("estimatedGas",estimatedGas);
    //         var estimatedGas = 0;
    //         var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
    //         return transactionObject.transactionHash;        
    //     } catch (error) {
    //         console.log("Error in SimpleValidatorSet.removeValidator(): " + error);
    //         return "";
    //     }
    // }
   
    async isActiveValidator(ethAccountToUse, validatorAddress) {
        try {
            var data = await this.contract.methods.isActiveValidator(validatorAddress).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.isActiveValidator(): " + error);
            return false;
        }
    }

    async checkVotes(ethAccountToUse, validatorAddress){
        try {
            var votes = await this.contract.methods.checkVotes(validatorAddress).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkVotes(validatorAddress).encodeABI();
            //var data = await this.utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return this.utils.convertToBool(data);
            return votes;
        } catch (error) {
            console.log("Error in AdminValidatorSet.checkAdmin(): " + error);
            return false;
        }
    }
    
    async checkProposal(ethAccountToUse, validatorAddress) {
        try {
            var data = await this.contract.methods.checkProposal(validatorAddress).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.hasProposal(): " + error);
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
        this.utils.listen(contractObject,(events)=>{
            console.log('SimpleValidatorSet Event Received');
            switch(events.event){
                case "addvalidator":
                    console.log("addvalidator:Contract address",event.address);
                    console.log("addvalidator:admin ",event.returnValues._admin);
                    console.log("addvalidator:validator",event.returnValues.validator);
                    break;
                case "removevalidator":
                    console.log("removevalidator");
                    break;
                default:
                    break;
            }
        });

        // this.utils.subscribe("SimpleValidatorSet", this.web3, (events)=>{
        //     console.log('SimpleValidatorSet subscribe Event Received');
        //     switch(events.event){
        //         case "InitiateChange":
        //             console.log("InitiateChange");
        //             break;
        //         case "AddValidatorEvent":
        //             console.log("AddValidatorEvent");
        //             break;
        //         case "RemoveValidatorEvent":
        //             console.log("RemoveValidatorEvent");
        //             break;
        //         default:			
        //             break;
        //     }
        // });
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = SimpleValidatorSet;
else
    window.SimpleValidatorSet = SimpleValidatorSet;