const utils = require('./web3util');

module.exports = class AdminValidatorSet {

    constructor(web3provider) {
        this.web3 = web3provider;

        // Todo: Read ABI from dynamic source.
        var value = utils.readSolidityContractJSON("./build/contracts/AdminValidatorSet.json");
        if(value.length > 0){
            this.adminValidatorSetAbi = value[0];
            this.adminValidatorSetByteCode = value[1];
        }
    }
    
    setOwnersParameters(ownerAccountAddress,privateKey,adminValidatorSetAddress){
        this.ownerAccountAddress = ownerAccountAddress;
        this.privateKey = privateKey;
        this.adminValidatorSetAddress = adminValidatorSetAddress;
        this.contract = new web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),this.adminValidatorSetAddress);
        
        //subscribeForPastEvents();
        //listenForContractObjectEvents(this.contract);  
    }

    async deployNewAdminSetValidatorContract(ethAccountToUse, otherAdminsList) {
        try {
            var validatorSetThis = this.getThis;
            var deployedAddress = await utils.deployContract(this.adminValidatorSetAbi, this.adminValidatorSetByteCode, ethAccountToUse, otherAdminsList);//, function(returnTypeString, result){
            validatorSetThis.adminValidatorSetAddress = deployedAddress;
            return validatorSetThis.adminValidatorSetAddress;
        } catch (error) {
            console.log("Error in AdminValidatorSet.deployNewAdminSetValidatorContract(): " + error);
        }
    }

    async getValidatorsAsync() {
        try {
            console.log("GetValidatorsAsync:this.adminValidatorSetAddress ",this.adminValidatorSetAddress);
            this.contract = new web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),this.adminValidatorSetAddress);
            resultList = await this.contract.methods.getValidators().call().then(function(resultList){
                console.log("GetValidatorsAsync resultList ",resultList.length);
                if (resultList.length > 0) {
                    resultList.forEach(eachElement => {
                        console.log(eachElement, "\n");
                    });
                }
            });
        } catch (error) {
            console.log("Error in AdminValidatorSet.GetValidatorsAsync(): " + error);
        }
    }

    async getAdminValidatorsAsync(adminAddress) {
        try {
            console.log("GetAdminValidatorsAsync:this.adminValidatorSetAddress ",this.adminValidatorSetAddress);
            this.contract.methods.getAdminValidators(adminAddress).call().then(function(resultList){
                console.log("GetAdminValidatorsAsync resultList for ",adminAddress, resultList.length);
                if (resultList.length > 0) {
                    resultList.forEach(eachElement => {
                        console.log(eachElement, "\n");
                    });
                }
            });
        } catch (error) {
            console.log("Error in AdminValidatorSet.GetAdminValidatorsAsync(): " + error);
        }
    }

    async addValidator(adminAccount, newValidatorList, adminAccountToadd, fromContractConstructor) {
        try {
            console.log("AddValidator:this.adminValidatorSetAddress ",this.adminValidatorSetAddress);
            var validatorSetThis = this.getThis;
            var encodedABI = this.contract.methods.addValidators(newValidatorList, adminAccountToadd, fromContractConstructor).encodeABI();
            utils.estimateGasTransaction(adminAccount,this.contract._address, encodedABI,web3,"AdminValidatorSet:AddValidator",function (estimatedGas) {
               console.log("estimatedGas",estimatedGas);
                utils.sendMethodTransaction(adminAccount,validatorSetThis.contract._address,encodedABI,validatorSetThis.privateKey,web3,estimatedGas,"AdminValidatorSet:AddValidator",
                    function(returnTypeString){
                        if (returnTypeString == "success") {
                            validatorSetThis.GetValidatorsAsync();
                        }
                        else {
                            console.log('error', `ERROR:\n${error.message}:${error.stack}`);
                        }
                });
            });    
        } catch (error) {
            console.log("Error in AdminValidatorSet.AddValidator(): " + error);
        }    
    }

    async finaliseChange(adminAccount) {
        try {
            var encodedABI = this.contract.methods.finalizeChange().encodeABI();
            utils.sendMethodTransaction(adminAccount,this.contract._address, encodedABI,this.privateKey,web3,"SimpleSetContract:finaliseChange");
        } catch (error) {
            console.log("Error in AdminValidatorSet.finaliseChange(): " + error);
        }
    }

    async removeValidator(adminAccount, validatorToRemoveList, adminAccountToRemoveFrom) {
        try {
            var validatorSetThis = this.getThis;
            var encodedABI = this.contract.methods.removeValidators(validatorToRemoveList, adminAccountToRemoveFrom).encodeABI();
            utils.estimateGasTransaction(adminAccount,this.contract._address, encodedABI,web3,"AdminValidatorSet:RemoveValidator",function (estimatedGas) {
                    utils.sendMethodTransaction(adminAccount,adminAccountToRemoveFrom,encodedABI,validatorSetThis.privateKey,web3,estimatedGas,"AdminValidatorSet:RemoveValidator",
                    function(returnTypeString){
                        if (returnTypeString == "success") {
                            validatorSetThis.GetValidatorsAsync();
                        }
                        else {
                            console.log('error', `ERROR:\n${error.message}:${error.stack}`);
                        }
                });
            });
            
        } catch (error) {
            console.log("Error in AdminValidatorSet.RemoveValidator(): " + error);
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
                            // console.log("addvalidator:Contract address",eachElement.address);
                            // console.log("addvalidator:Transaction Hash",eachElement.transactionHash);
                            // console.log("addvalidator:Block Hash",eachElement.blockHash);
                            // console.log("addvalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                        else if(eachElement.event == "removevalidator"){
                            console.log("removevalidator:Contract address",eachElement.address);
                            console.log("removevalidator:Transaction Hash",eachElement.transactionHash);
                            console.log("removevalidator:Block Hash",eachElement.blockHash);
                            console.log("removevalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                        else if(eachElement.event == "finalizeEvent"){
                            console.log("finalizeEvent:Contract address",eachElement.returnValues[0]);
                            console.log("finalizeEvent:Transaction Hash",eachElement.transactionHash);
                            console.log("finalizeEvent:Block Hash",eachElement.blockHash);
                            console.log("addvalidator:calleeAdminAccount",eachElement.returnValues[0]);
                        }
                    })
                }
                
            });
     }     
        
     listenForContractObjectEvents(contractObject){
        utils.listen(contractObject,(events)=>{
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
                case "finalizeEvent":
                    console.log("finalizeEvent");
                    break;
                default:
                    break;
            }
        });

        // utils.subscribe("SimpleValidatorSet", (events)=>{
        //     console.log('SimpleValidatorSet Event Received');
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
        //         case "FinalizeCalledEvent":
        //             console.log("FinalizeCalledEvent");
        //             break;
        //         default:			
        //             break;
        //     }
        // });
    }  
    
    get getThis() {
        return this;
    }
}
