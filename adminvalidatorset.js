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

    async proposalToAddAdmin(ethAccountToUse, otherAdminToAdd, privateKey){
        try{
            var encodedABI = this.contract.methods.proposalToAddAdmin(otherAdminToAdd).encodeABI();
            // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            // console.log("estimatedGas",estimatedGas);
            var estimatedGas;
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
            var estimatedGas;
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
            var encodedABI = this.contract.methods.proposalToAddAdmin(otherAdminToRemove).encodeABI();
            //var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,this.web3);
            //console.log("estimatedGas",estimatedGas);
            var estimatedGas;
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
            var estimatedGas;
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
            //var flag = await this.contract.methods.checkAdmin(otherAdminToCheck).call();
            var encodedABI = this.contract.methods.checkAdmin(otherAdminToCheck).encodeABI();
            var data = await utils.getData(ethAccountToUse,this.adminValidatorSetAddress,encodedABI,web3);
            return utils.convertToBool(data);
        } catch (error) {
            console.log("Error in AdminValidatorSet.checkAdmin(): " + error);
            return false;
        }
    }
    
    async deployNewAdminSetValidatorContract(ethAccountToUse, otherAdminsList) {
        try {
            var deployedAddress = await utils.deployContract(this.adminValidatorSetAbi, this.adminValidatorSetByteCode, ethAccountToUse, otherAdminsList,this.web3);//, function(returnTypeString, result){
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
