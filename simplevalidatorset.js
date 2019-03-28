class SimpleValidatorSet {

    constructor(web3provider, utils, simpleValidatorSetAddress, abi, Web3) {
        this.web3 = new Web3(web3provider);
        this.utils = utils;
        var value;
        if(!abi) {
            //Read ABI and Bytecode from dynamic source.
            var value = this.utils.readSolidityContractJSON("./build/contracts/SimpleValidatorSet",false);
        }else{
            value = [abi, ""];
        }
        if(value.length > 0){
            this.simpleValidatorSetAbi = value[0];
            this.simpleValidatorSetByteCode = value[1];
            this.simpleValidatorSetAddress = simpleValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi), simpleValidatorSetAddress);
        }
    }
    
    async setOwnersParameters(ethAccountToUse,_privateKey, validtorsList, simpleValidatorSetAddress,adminValidatorSetAddress) {
        try{
            this.simpleValidatorSetAddress = simpleValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi),this.simpleValidatorSetAddress);

            if(webSocketProtocolFlag){
                if(subscribePastEventsFlag)
                    this.listenContractPastEvents();
                this.listenContractAllEvents(this.contract);  
            }
            let transactionHash = await this.init(ethAccountToUse,_privateKey,validtorsList);
            return transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet:setOwnersParameters(): " + error);
            return "";
        }  
    }
    
    async deployNewSimpleSetValidatorContractWithPrivateKey(ethAccountToUse,privateKey,otherValidatorList) {
        try {
            var estimatedGas = 0;
            var encodedABI = await this.utils.getContractEncodeABI(this.simpleValidatorSetAbi, this.simpleValidatorSetByteCode,this.web3,otherValidatorList);
            var deployedAddress = await this.utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey,this.web3,estimatedGas);
            return deployedAddress.contractAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:deployNewSimpleSetValidatorContract(): " + error);
            return "";
        }
    }
    
    async init(ethAccountToUse,_privateKey,validtorsList) {
        try{
            if (validtorsList.length < 3)
                return "";
            //Solidity does not take dynakic list of input parameters. So had give it seperate parameters. We have deided to give 4 validators as admin for Ledgerium Blockchain
            var encodedABI = this.contract.methods.init(validtorsList[0],validtorsList[1],validtorsList[2]).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,_privateKey,this.web3,estimatedGas);
            
            var logs = await this.contract.getPastEvents('InitValidatorAdded',{fromBlock: 0, toBlock: 'latest'});
            console.log('InitValidatorAdded event logs ' + JSON.stringify(logs));

            logs = await this.contract.getPastEvents('TotalNoOfValidator',{fromBlock: 0, toBlock: 'latest'});
            console.log('TotalNoOfValidator event logs ' + JSON.stringify(logs))
            
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet:init(): " + error);
            return "";
        }
    }
    
    async getAllValidatorsAsync2() {
        var resultList = [];
        try {
            resultList = await this.contract.methods.getAllValidators().call({});
            console.log(resultList);
            return resultList;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:getAllValidatorsAsync2(): " + error);
            return resultList;
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
    
    async proposalToAddValidator(ethAccountToUse, privateKey, newValidator) {
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
            return "";
        }
    }

    async voteForAddingValidator(ethAccountToUse, privateKey, otherValidatorToAdd) {
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
            return "";
        }
    }

    async voteAgainstAddingValidator(ethAccountToUse, privateKey, otherValidatorToAdd) {
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
            return "";
        }
    }
    
    async proposalToRemoveValidator(ethAccountToUse, privateKey, otherValidatorToRemove) {
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
            return "";
        }
    }

    proposalToRemoveValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn) {
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
            return "";
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

    voteForRemovingValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn) {
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.voteForRemovingValidator(otherValidatorToRemove).encodeABI();

            this.utils.sendMethodTransactionCb(ethAccountToUse,
                this.contract._address,encodedABI,privateKey,this.web3, estimatedGas, fn);
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet:voteForRemovingValidatorCb(): " + error);
            return "";
        }
    }

    async voteForRemovingValidator(ethAccountToUse, privateKey, otherValidatorToRemove) {
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.voteForRemovingValidator(otherValidatorToRemove).encodeABI();
            
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet:voteForRemovingValidator(): " + error);
            return "";
        }
    }
    
    async voteAgainstRemovingValidator(ethAccountToUse, privateKey, otherValidatorToRemove) {
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
            console.log("Error in SimpleValidatorSet:voteAgainstRemovingValidator(): " + error);
            return "";
        }
    }

    voteAgainstRemovingValidatorCb(ethAccountToUse, privateKey, otherValidatorToRemove, fn) {
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
            console.log("Error in SimpleValidatorSet:voteAgainstRemovingValidatorCb(): " + error);
            return "";
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

    async checkVotes(ethAccountToUse, validatorAddress) {
        try {
            var votes = await this.contract.methods.checkVotes(validatorAddress).call({from : ethAccountToUse});
            return votes;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.checkVotes(): " + error);
            return [0,0];
        }
    }
    
    async checkProposal(ethAccountToUse, validatorAddress) {
        try {
            var data = await this.contract.methods.checkProposal(validatorAddress).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:checkProposal(): " + error);
            return false;
        }
    }

    async clearProposal(ethAccountToUse, validatorAddress) {
        try{
            var estimatedGas = 0;
            var encodedABI = this.contract.methods.clearProposal(validatorAddress).encodeABI();
            
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,
                this.contract._address,
                encodedABI,
                privateKey,
                this.web3,
                estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in SimpleValidatorSet:clearProposal(): " + error);
            return "";
        }
    }

    async getProposer(ethAccountToUse, validatorAddress) {
        try {
            var data = await this.contract.methods.getProposer(validatorAddress).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in SimpleValidatorSet:getProposer(): " + error);
            return false;
        }
    }

    listenContractPastEvents() {
       this.contract.getPastEvents('AddValidator',{fromBlock: 0, toBlock: 'latest',filter: {validator: "0xf1cba7514dcf9d1e8b1151bcfa05db467c0dcf1a"}},
            (err, events) => {
                if(events.length > 0) {
                    events.forEach(eachElement => {
                        if(eachElement.event == "AddValidator") {
                            console.log("AddValidator:Contract address",eachElement.address);
                            console.log("AddValidator:Transaction Hash",eachElement.transactionHash);
                            console.log("AddValidator:Block Hash",eachElement.blockHash);
                            console.log("AddValidator:proposer",eachElement.returnValues[0]);
                            console.log("AddValidator:validator",eachElement.returnValues[1]);
                        }
                    })
                }
            });
     }     
        
     listenContractAllEvents(contractObject) {
        this.utils.listenContractAllEvents(contractObject,(events)=> {
            console.log('SimpleValidatorSet live Event Received');
            switch(events.event) {
                case "VotedForAdd":
                    console.log("VotedForAdd:Contract address",events.address);
                    console.log("VotedForAdd:voting admin ",events.returnValues.admin);
                    console.log("VotedForAdd:validator",events.returnValues.voted);
                    break;
                case "VotedForRemove":
                    console.log("VotedForRemove:Contract address",events.address);
                    console.log("VotedForRemove:voting admin ",events.returnValues.admin);
                    console.log("VotedForRemove:validator",events.returnValues.voted);
                    break;
                case "VotedAgainstAdd":
                    console.log("VotedAgainstAdd:Contract address",events.address);
                    console.log("VotedAgainstAdd:voting admin ",events.returnValues.admin);
                    console.log("VotedAgainstAdd:validator",events.returnValues.voted);
                    break;
                case "VotedAgainstRemove":
                    console.log("VotedAgainstRemove:Contract address",events.address);
                    console.log("VotedAgainstRemove:voting admin ",events.returnValues.admin);
                    console.log("VotedAgainstRemove:validator",events.returnValues.voted);
                    break;
                case "AddValidator":
                    console.log("AddValidator:Contract address",events.address);
                    console.log("AddValidator:proposer ",events.returnValues.proposer);
                    console.log("AddValidator:validator",events.returnValues.validator);
                    break;
                case "RemoveValidator":
                    console.log("RemoveValidator:Contract address",events.address);
                    console.log("RemoveValidator:proposer ",events.returnValues.proposer);
                    console.log("RemoveValidator:validator",events.returnValues.validator);
                    break;
                case "AlreadyProposalForAddingValidator":
                    console.log("AlreadyProposalForAddingValidator:Contract address",events.address);
                    console.log("AlreadyProposalForAddingValidator:Validator",events.returnValues._address);
                    break;
                case "AlreadyProposalForRemovingValidator":
                    console.log("AlreadyProposalForRemovingValidator:Contract address",events.address);
                    console.log("AlreadyProposalForRemovingValidator:Validator",events.returnValues._address);
                    break;
                case "NoProposalForAddingValidator":
                    console.log("NoProposalForAddingValidator:Contract address",events.address);
                    console.log("NoProposalForAddingValidator:Validator",events.returnValues._address);
                    break;
                case "NoProposalForRemovingValidator":
                    console.log("NoProposalForRemovingValidator:Contract address",events.address);
                    console.log("NoProposalForRemovingValidator:Validator",events.returnValues._address);
                    break;
                case "AlreadyActiveValidator":
                    console.log("AlreadyActiveValidator:Contract address",events.address);
                    console.log("AlreadyActiveValidator:Validator",events.returnValues._address);
                    break;
                case "AlreadyInActiveValidator":
                    console.log("AlreadyInActiveValidator:Contract address",events.address);
                    console.log("AlreadyInActiveValidator:Validator",events.returnValues._address);
                    break;
                case "MinValidatorNeeded":
                    console.log("MinValidatorNeeded:Contract address",events.address);
                    console.log("MinValidatorNeeded:min no of validators needed",events.returnValues.minNoOfValidator);
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
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = SimpleValidatorSet;
else
    window.SimpleValidatorSet = SimpleValidatorSet;