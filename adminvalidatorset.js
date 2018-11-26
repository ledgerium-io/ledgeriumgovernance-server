class AdminValidatorSet {

    constructor(web3provider, utils, adminValidatorSetAddress, abi, Web3) { 
        var value;
        this.utils = utils;
        if(!abi) {
            //Read ABI and Bytecode from dynamic source.
            value = this.utils.readSolidityContractJSON("./build/contracts/AdminValidatorSet.json");
        }else{
            value = [abi, ""];
        }
        if(value.length > 0){
            this.web3 = new Web3(web3provider);
            this.adminValidatorSetAbi = value[0];
            this.adminValidatorSetByteCode = value[1];
            this.adminValidatorSetAddress = adminValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),
                adminValidatorSetAddress);
        }
    }
    
    async setOwnersParameters(ethAccountToUse,_privateKey,adminValidatorSetAddress){
        try{
            this.adminValidatorSetAddress = adminValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),this.adminValidatorSetAddress);
            
            if(pastEventsSubscriptionFlag){
                this.subscribeForPastEvents();
                this.listenForContractObjectEvents(this.contract);  
            }
            console.log("pastEventsSubscriptionFlag", pastEventsSubscriptionFlag);

            let transactionHash = await this.init(ethAccountToUse,_privateKey);
            return transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.setOwnersParameters(): " + error);
            return "";
        }    
    }
    
    async deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,_privateKey,otherAdminsList) {
        try {
            var estimatedGas = 0;
            var encodedABI = await this.utils.getContractEncodeABI(this.adminValidatorSetAbi,this.adminValidatorSetByteCode,this.web3,otherAdminsList);
            var deployedAddress =  await this.utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,_privateKey,this.web3,estimatedGas);
            return deployedAddress.contractAddress;
        } catch (error) {
            console.log("Error in AdminValidatorSet:deployNewAdminSetValidatorContractWithPrivateKey(): " + error);
            return "";
        }
    }

    async init(ethAccountToUse, privateKey){
        try{
            var encodedABI = this.contract.methods.init().encodeABI();
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
    
    GetAliasForAdmin(admin, fn) {
        fn("alias - " + admin);
    }

    async getAllAdmins2(){
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
    
    async proposalToAddAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
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

    async voteForAddingAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
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

    async voteAgainstAddingAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
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
    
    async proposalToRemoveAdmin(ethAccountToUse, otherAdminToRemove, privateKey){
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

    async voteForRemovingAdmin(ethAccountToUse, otherAdminToRemove, privateKey){
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
    
    async voteAgainstRemovingAdmin(ethAccountToUse, otherAdminToRemove, privateKey){
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
    
    async isActiveAdmin(ethAccountToUse, otherAdminToCheck){
        try {
            var flag = await this.contract.methods.isActiveAdmin(otherAdminToCheck).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkActiveAdmin(otherAdminToCheck).encodeABI();
            //var data = await utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return utils.convertToBool(data);
            return flag;
        } catch (error) {
            console.log("Error in AdminValidatorSet:isActiveAdmin(): " + error);
            return false;
        }
    }

    async checkVotes(ethAccountToUse, otherAdminToCheck){
        try {
            var votes = await this.contract.methods.checkVotes(otherAdminToCheck).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkVotes(otherAdminToCheck).encodeABI();
            //var data = await this.utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return this.utils.convertToBool(data);
            return votes;
        } catch (error) {
            console.log("Error in AdminValidatorSet:checkAdmin(): " + error);
            return false;
        }
    }

    async checkProposal(ethAccountToUse, otherAdminToCheck){
        try {
            var whatProposal = await this.contract.methods.checkProposal(otherAdminToCheck).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkProposal(otherAdminToCheck).encodeABI();
            //var data = await this.utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return this.utils.convertToBool(data);
            return whatProposal;
        } catch (error) {
            console.log("Error in AdminValidatorSet:checkAdmin(): " + error);
            return "none";
        }
    }
    
    subscribeForPastEvents(){
        var options = {
            fromBlock: "latest",
            address: this.adminValidatorSetAddress
        };
        this.contract.getPastEvents(
            'AllEvents',
            {
              fromBlock: 0,
              toBlock: 'latest'
            },
            (err, events) => {
                if(events.length > 0){
                    console.log('AdminValidatorSet past event Received');
                    events.forEach(eachElement => {
                        if(eachElement.event == "votedfor"){
                            console.log("votedfor:Contract address",eachElement.address);
                            console.log("votedfor:admin ",eachElement.returnValues[0]);
                            console.log("votedfor:validator",eachElement.returnValues[1]);
                        }
                        else if(eachElement.event == "votedagainst"){
                            console.log("votedagainst:Contract address",eachElement.address);
                            console.log("votedagainst:Transaction Hash",eachElement.transactionHash);
                            console.log("votedagainst:Block Hash",eachElement.blockHash);
                            console.log("votedagainst:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                    })
                }
            });
     }     
        
     listenForContractObjectEvents(contractObject){
        this.utils.listenAllEventsContract(contractObject, (events)=>{
            console.log('AdminValidatorSet live event Received');
            switch(events.event){
                case "minAdminNeeded":
                    console.log("minAdminNeeded");
                    break;
                case "addAdmin":
                    console.log("addAdmin");
                    break;
                case "removeAdmin":
                    console.log("removeAdmin");
                    break;
                case "votedfor":
                    console.log("votedfor");
                    break;
                case "votedagainst":
                    console.log("votedagainst");
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

        // this.utils.subscribeForLogs('logs', this.web3, this.adminValidatorSetAddress, (events)=>{
        //     console.log('AdminValidatorSet subscribeForLogs Received');
        //     switch(events.event){
        //         case "minAdminNeeded":
        //             console.log("minAdminNeeded");
        //             break;
        //         case "addAdmin":
        //             console.log("addAdmin");
        //             break;
        //         case "removeAdmin":
        //             console.log("removeAdmin");
        //             break;
        //         case "votedfor":
        //             console.log("votedfor");
        //             break;
        //         case "votedagainst":
        //             console.log("votedagainst");
        //             break;
        //         case "alreadyProposalForAddingAdmin":
        //             console.log("alreadyProposalForAddingAdmin");
        //             break;
        //         case "alreadyProposalForRemovingAdmin":
        //             console.log("alreadyProposalForRemovingAdmin");
        //             break;
        //         case "noProposalForAddingAdmin":
        //             console.log("noProposalForAddingAdmin");
        //             break;
        //         case "noProposalForRemovingAdmin":
        //             console.log("noProposalForRemovingAdmin");
        //             break;
        //         case "alreadyActiveAdmin":
        //             console.log("alreadyActiveAdmin");
        //             break;
        //         case "alreadyInActiveAdmin":
        //             console.log("alreadyInActiveAdmin");
        //             break;
        //         default:			
        //             break;
        //     }
        // });
    }  
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    const Web3 = require('web3');
    module.exports = AdminValidatorSet;
}else{
    window.AdminValidatorSet = AdminValidatorSet;
}