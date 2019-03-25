class AdminValidatorSet {

    constructor(web3provider, utils, adminValidatorSetAddress, abi, Web3) { 
        var value;
        this.utils = utils;
        if(!abi) {
            //Read ABI and Bytecode from dynamic source.
            value = this.utils.readSolidityContractJSON("./build/contracts/AdminValidatorSet",false);
        }else{
            value = [abi, ""];
        }
        if(value.length > 0){
            this.web3 = new Web3(web3provider);
            this.adminValidatorSetAbi = value[0];
            this.adminValidatorSetByteCode = value[1];
            this.adminValidatorSetAddress = adminValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),adminValidatorSetAddress);
        }
    }
    
    async deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,_privateKey,adminsList) {
        try {
            var estimatedGas = 0;
            var encodedABI = await this.utils.getContractEncodeABI(this.adminValidatorSetAbi,this.adminValidatorSetByteCode,this.web3,adminsList);
            var deployedAddress =  await this.utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,_privateKey,this.web3,estimatedGas);
            return deployedAddress.contractAddress;
        } catch (error) {
            console.log("Error in AdminValidatorSet:deployNewAdminSetValidatorContractWithPrivateKey(): " + error);
            return "";
        }
    }
    
    async setOwnersParameters(ethAccountToUse,_privateKey,adminsList,adminValidatorSetAddress) {
        try{
            this.adminValidatorSetAddress = adminValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),this.adminValidatorSetAddress);
            
            if(webSocketProtocolFlag){
                if(subscribePastEventsFlag)
                    this.listenContractPastEvents();
                this.listenContractAllEvents(this.contract);  
            }
            let transactionHash = await this.init(ethAccountToUse,_privateKey,adminsList);
            return transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.setOwnersParameters(): " + error);
            return "";
        }    
    }

    async init(ethAccountToUse,_privateKey,adminsList) {
        try{
            if (adminsList.length < 3)
                return "";
            //Solidity does not take dynakic list of input parameters. So had give it seperate parameters. We have deided to give 4 validators as admin for Ledgerium Blockchain
            var encodedABI = this.contract.methods.init(adminsList[0],adminsList[1],adminsList[2]).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,_privateKey,this.web3,estimatedGas);

            var logs = await this.contract.getPastEvents('InitAdminAdded',{fromBlock: 0, toBlock: 'latest'});
            console.log('InitAdminAdded event logs ' + JSON.stringify(logs));

            logs = await this.contract.getPastEvents('TotalNoOfAdmin',{fromBlock: 0, toBlock: 'latest'});
            console.log('TotalNoOfAdmin event logs ' + JSON.stringify(logs))
            
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:init(): " + error);
            return false;
        }
    }
    
    GetAliasForAdmin(admin, fn) {
        fn("alias - " + admin);
    }

    async getAllAdmins2() {
        return await this.contract.methods.getAllAdmins().call({});
        // var encodedABI = this.contract.methods.getAllAdmins().encodeABI();
        // return await web3.eth.call({
        //     data: encodedABI
        // });
    }

    async getAllAdmins(ethAccountToUse) {
        var resultList = [];
        try {
            var encodedABI = this.contract.methods.getAllAdmins().encodeABI();
            resultList = await this.utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            console.log(resultList);
            return this.utils.split(resultList);
        } catch (error) {
            console.log("Error in AdminValidatorSet:getAllAdminsAsync(): " + error);
            return resultList;
        }
    }
    
    async proposalToAddAdmin(ethAccountToUse, otherAdminToAdd, privateKey) {
        try{
            var encodedABI = this.contract.methods.proposalToAddAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:proposalToAddAdmin(): " + error);
            return false;
        }
    }

    async voteForAddingAdmin(ethAccountToUse, otherAdminToAdd, privateKey) {
        try{
            var encodedABI = this.contract.methods.voteForAddingAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:voteForAddingAdmin(): " + error);
            return false;
        }
    }

    async voteAgainstAddingAdmin(ethAccountToUse, otherAdminToAdd, privateKey) {
        try{
            var encodedABI = this.contract.methods.voteAgainstAddingAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:voteAgainstAddingAdmin(): " + error);
            return false;
        }
    }
    
    async proposalToRemoveAdmin(ethAccountToUse, otherAdminToRemove, privateKey) {
        try{
            var encodedABI = this.contract.methods.proposalToRemoveAdmin(otherAdminToRemove).encodeABI();
            //var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            //console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:proposalToRemoveAdmin(): " + error);
            return false;
        }
    }

    async voteForRemovingAdmin(ethAccountToUse, otherAdminToRemove, privateKey) {
        try{
            var encodedABI = this.contract.methods.voteForRemovingAdmin(otherAdminToRemove).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:voteForRemovingAdmin(): " + error);
            return false;
        }
    }
    
    async voteAgainstRemovingAdmin(ethAccountToUse, otherAdminToRemove, privateKey) {
        try{
            var encodedABI = this.contract.methods.voteAgainstRemovingAdmin(otherAdminToRemove).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:voteAgainstRemovingAdmin(): " + error);
            return false;
        }
    }
    
    async isActiveAdmin(ethAccountToUse, otherAdminToCheck) {
        try {
            var flag = await this.contract.methods.isActiveAdmin(otherAdminToCheck).call({from : ethAccountToUse});
            return flag;
        } catch (error) {
            console.log("Error in AdminValidatorSet:isActiveAdmin(): " + error);
            return false;
        }
    }

    async checkVotes(ethAccountToUse, otherAdminToCheck) {
        try {
            var votes = await this.contract.methods.checkVotes(otherAdminToCheck).call({from : ethAccountToUse});
            return votes;
        } catch (error) {
            console.log("Error in AdminValidatorSet:checkVotes(): " + error);
            return false;
        }
    }

    async checkProposal(ethAccountToUse, otherAdminToCheck) {
        try {
            var whatProposal = await this.contract.methods.checkProposal(otherAdminToCheck).call({from : ethAccountToUse});
            return whatProposal;
        } catch (error) {
            console.log("Error in AdminValidatorSet:checkProposal(): " + error);
            return "none";
        }
    }
    
    async clearProposal(ethAccountToUse, otherAdminToCheck, privateKey) {
        try{
            var encodedABI = this.contract.methods.clearProposal(otherAdminToCheck).encodeABI();
            // var estimatedGas = await this.utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet:clearProposal(): " + error);
            return false;
        }
    }
    
    async getProposer(ethAccountToUse, otherAdminToCheck) {
        try {
            var data = await this.contract.methods.getProposer(otherAdminToCheck).call({from : ethAccountToUse});
            return data;
        } catch (error) {
            console.log("Error in AdminValidatorSet:getProposer(): " + error);
            return false;
        }
    }

    listenContractPastEvents() {
        this.contract.getPastEvents('AddAdmin',{fromBlock: 0, toBlock: 'latest'/*,filter: {_admin: "0xf1cba7514dcf9d1e8b1151bcfa05db467c0dcf1a"}*/},
            (error, events) => {
                if(!error && events.length > 0){
                    events.forEach(eachElement => {
                        if(eachElement.event == "AddAdmin") {
                            console.log("listenContractPastEvents for AddAdmin Event");
                            console.log("AddAdmin:Contract address",eachElement.address);
                            console.log("AddAdmin:Transaction Hash",eachElement.transactionHash);
                            console.log("AddAdmin:Block Hash",eachElement.blockHash);
                            console.log("AddAdmin:proposer",eachElement.returnValues[0]);
                            console.log("AddAdmin:admin",eachElement.returnValues[1]);
                        }
                    })
                }
                else
                    console.log("Error in processing AdminValidatorSet:AddAdmin event: " + error);
            });
     }     
        
     listenContractAllEvents(contractObject) {
        this.utils.listenContractAllEvents(contractObject, (events)=> {
            console.log('AdminValidatorSet live event Received');
            switch(events.event) {
                case "VotedForAdd":
                    console.log("VotedForAdd:Contract address",events.address);
                    console.log("VotedForAdd:Voting admin ",events.returnValues.admin);
                    console.log("VotedForAdd:admin",events.returnValues.voted);
                    break;
                case "VotedForRemove":
                    console.log("VotedForRemove:Contract address",events.address);
                    console.log("VotedForRemove:Voting admin ",events.returnValues.admin);
                    console.log("VotedForRemove:admin",events.returnValues.voted);
                    break;
                case "VotedAgainstAdd":
                    console.log("VotedAgainstAdd:Contract address",events.address);
                    console.log("VotedAgainstAdd:Voting admin ",events.returnValues.admin);
                    console.log("VotedAgainstAdd:admin",events.returnValues.voted);
                    break;
                case "VotedAgainstRemove":
                    console.log("VotedAgainstRemove:Contract address",events.address);
                    console.log("VotedAgainstRemove:Voting admin ",events.returnValues.admin);
                    console.log("VotedAgainstRemove:admin",events.returnValues.voted);
                    break;
                case "AddAdmin":
                    console.log("AddAdmin:Contract address",events.address);
                    console.log("AddAdmin:proposer ",events.returnValues.proposer);
                    console.log("AddAdmin:admin",events.returnValues.admin);
                    break;
                case "RemoveAdmin":
                    console.log("RemoveAdmin:Contract address",events.address);
                    console.log("RemoveAdmin:proposer ",events.returnValues.proposer);
                    console.log("RemoveAdmin:admin",events.returnValues.admin);
                    break;
                case "AlreadyProposalForAddingAdmin":
                    console.log("AlreadyProposalForAddingAdmin:Contract address",events.address);
                    console.log("AlreadyProposalForAddingAdmin:Admin",events.returnValues._address);
                    break;
                case "AlreadyProposalForRemovingAdmin":
                    console.log("AlreadyProposalForRemovingAdmin:Contract address",events.address);
                    console.log("AlreadyProposalForRemovingAdmin:Admin",events.returnValues._address);
                    break;
                case "NoProposalForAddingAdmin":
                    console.log("NoProposalForAddingAdmin:Contract address",events.address);
                    console.log("NoProposalForAddingAdmin:Admin",events.returnValues._address);
                    break;
                case "NoProposalForRemovingAdmin":
                    console.log("NoProposalForRemovingAdmin:Contract address",events.address);
                    console.log("NoProposalForRemovingAdmin:Admin",events.returnValues._address);
                    break;
                case "AlreadyActiveAdmin":
                    console.log("AlreadyActiveAdmin:Contract address",events.address);
                    console.log("AlreadyActiveAdmin:Admin",events.returnValues._address);
                    break;
                case "AlreadyInActiveAdmin":
                    console.log("AlreadyInActiveAdmin:Contract address",events.address);
                    console.log("AlreadyInActiveAdmin:Admin",events.returnValues._address);
                    break;
                case "MinAdminNeeded":
                    console.log("MinAdminNeeded:Contract address",events.address);
                    console.log("MinAdminNeeded:min no of admins needed",events.returnValues.minNoOfAdmin);
                    break;
                case "alreadyProposalForAddingAdmin":
                    console.log("alreadyProposalForAddingAdmin");
                    break;
                case "alreadyProposalForRemovingAdmin":
                    console.log("alreadyProposalForRemovingAdmin");
                    break;
                case "noProposalForAddingAdmin":
                    console.log("noProposalForAddingAdmin");
                    break;
                case "noProposalForRemovingAdmin":
                    console.log("noProposalForRemovingAdmin");
                    break;
                case "alreadyActiveAdmin":
                    console.log("alreadyActiveAdmin");
                    break;
                case "alreadyInActiveAdmin":
                    console.log("alreadyInActiveAdmin");
                    break;
                default:			
                    break;
            }
        });
    }  
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    const Web3 = require('web3');
    module.exports = AdminValidatorSet;
}else{
    window.AdminValidatorSet = AdminValidatorSet;
}