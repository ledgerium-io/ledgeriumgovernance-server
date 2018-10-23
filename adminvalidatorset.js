const utils = require('./web3util');

module.exports = class AdminValidatorSet {

    constructor(web3provider) {
        this.web3 = web3provider;
        //Read ABI and Bytecode from dynamic source.
        var value = utils.readSolidityContractJSON("./build/contracts/AdminValidatorSet.json");
        if(value.length > 0){
            this.adminValidatorSetAbi = value[0];
            this.adminValidatorSetByteCode = value[1];
        }
    }
    
    setOwnersParameters(ownerAccountAddress,privateKey,adminValidatorSetAddress){
        try{
            this.ownerAccountAddress = ownerAccountAddress;
            this.privateKey = privateKey;
            this.adminValidatorSetAddress = adminValidatorSetAddress;
            this.contract = new this.web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),this.adminValidatorSetAddress);
            
            //this.subscribeForPastEvents();
            //this.listenForContractObjectEvents(this.contract);  
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.setOwnersParameters(): " + error);
            return "";
        }    
    }

    async getAllAdmins(ethAccountToUse) {
        var resultList = [];
        try {
            var encodedABI = this.contract.methods.getAllAdmins().encodeABI();
            resultList = await utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            console.log(resultList);
            return utils.split(resultList);
        } catch (error) {
            console.log("Error in AdminValidatorSet.getAllAdminsAsync(): " + error);
            return resultList;
        }
    }
    
    async proposalToAddAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
        try{
            var encodedABI = this.contract.methods.proposalToAddAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.proposalToAddAdmin(): " + error);
            return false;
        }
    }

    async voteForAddingAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
        try{
            var encodedABI = this.contract.methods.voteForAddingAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteForAddingAdmin(): " + error);
            return false;
        }
    }

    async voteAgainstAddingAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
        try{
            var encodedABI = this.contract.methods.voteAgainstAddingAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteForAddingAdmin(): " + error);
            return false;
        }
    }
    
    async proposalToRemoveAdmin(ethAccountToUse, otherAdminToRemove, privateKey){
        try{
            var encodedABI = this.contract.methods.proposalToRemoveAdmin(otherAdminToRemove).encodeABI();
            //var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            //console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.proposalToRemoveAdmin(): " + error);
            return false;
        }
    }

    async voteForRemovingAdmin(ethAccountToUse, otherAdminToRemove, privateKey){
        try{
            var encodedABI = this.contract.methods.voteForRemovingAdmin(otherAdminToRemove).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteForRemovingAdmin(): " + error);
            return false;
        }
    }
    
    async voteAgainstRemovingAdmin(ethAccountToUse, otherAdminToRemove, privateKey){
        try{
            var encodedABI = this.contract.methods.voteAgainstRemovingAdmin(otherAdminToRemove).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas = 0;
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,privateKey,this.web3,estimatedGas);
            return transactionObject.transactionHash;
        }
        catch (error) {
            console.log("Error in AdminValidatorSet.voteForRemovingAdmin(): " + error);
            return false;
        }
    }
    
    async checkAdmin(ethAccountToUse, otherAdminToCheck){
        try {
            var flag = await this.contract.methods.checkAdmin(otherAdminToCheck).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkAdmin(otherAdminToCheck).encodeABI();
            //var data = await utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return utils.convertToBool(data);
            return flag;
        } catch (error) {
            console.log("Error in AdminValidatorSet.checkAdmin(): " + error);
            return false;
        }
    }

    async checkVotes(ethAccountToUse, otherAdminToCheck){
        try {
            var votes = await this.contract.methods.checkVotes(otherAdminToCheck).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkVotes(otherAdminToCheck).encodeABI();
            //var data = await utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return utils.convertToBool(data);
            return votes;
        } catch (error) {
            console.log("Error in AdminValidatorSet.checkAdmin(): " + error);
            return false;
        }
    }

    async checkProposal(ethAccountToUse, otherAdminToCheck){
        try {
            var whatProposal = await this.contract.methods.checkProposal(otherAdminToCheck).call({from : ethAccountToUse});
            //var encodedABI = this.contract.methods.checkProposal(otherAdminToCheck).encodeABI();
            //var data = await utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,this.web3);
            //return utils.convertToBool(data);
            return whatProposal;
        } catch (error) {
            console.log("Error in AdminValidatorSet.checkAdmin(): " + error);
            return "none";
        }
    }
    
    async deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,_privateKey,adminValidatorAddress) {
        try {
            var estimatedGas = 0;
            var encodedABI = await utils.getContractEncodeABI(this.adminValidatorSetAbi,this.adminValidatorSetByteCode,this.web3,adminValidatorAddress);
            var deployedAddress =  await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,_privateKey,this.web3,estimatedGas);
            this.adminValidatorSetAddress = deployedAddress.contractAddress;
            return this.adminValidatorSetAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.deployNewSimpleSetValidatorContract(): " + error);
            return "";
        }
    }
    
    async deployNewAdminSetValidatorContract(ethAccountToUse, otherAdminsList) {
        try {
            var deployedAddress = await utils.deployContract(this.adminValidatorSetAbi, this.adminValidatorSetByteCode, ethAccountToUse, otherAdminsList,this.web3);
            this.adminValidatorSetAddress = deployedAddress;
            return this.adminValidatorSetAddress;
        } catch (error) {
            console.log("Error in AdminValidatorSet.deployNewAdminSetValidatorContract(): " + error);
            return "";
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
        utils.listen(contractObject, (events)=>{
            console.log('AdminValidatorSet live event Received');
            switch(events.event){
                case "votedfor":
                    console.log("votedfor:Contract address",events.address);
                    console.log("votedfor:admin ",events.returnValues[0]);
                    console.log("votedfor:validator",events.returnValues[1]);
                    break;
                case "votedagainst":
                    console.log("votedagainst");
                    console.log("votedfor:Contract address",events.address);
                    console.log("votedfor:admin ",events.returnValues[0]);
                    console.log("votedfor:validator",events.returnValues[1]);
                    break;
                default:
                    break;
            }
        });

        // utils.subscribe("AdminValidatorSet", this.web3, (events)=>{
        //     console.log('AdminValidatorSet subscribe Event Received');
        //     switch(events.event){
        //         case "votedfor":
        //             console.log("votedfor");
        //             break;
        //         case "votedagainst":
        //             console.log("votedagainst");
        //             break;
        //         default:			
        //             break;
        //     }
        // });
    }  
}
