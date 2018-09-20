const utils = require('./web3util');

module.exports = class SimpleValidatorSet {

    constructor(web3provider) {
        this.web3 = web3provider;
        // Todo: Read ABI from dynamic source.
        var value = utils.readSolidityContractJSON("./build/contracts/SimpleValidatorSet.json");
        //var value = utils.readSolidityContractJSON("../refactored/build/contracts/Validator.json");
        if(value.length > 0){
            this.simpleValidatorSetAbi = value[0];
            this.simpleValidatorSetByteCode = value[1];
        }    
    }
    
    setOwnersParameters(ownerAccountAddress,privateKey,simpleValidatorSetAddress){
        //this.simpleValidatorSetAddress = "0x6df0e3c962655797c02a5c6a1844076c1404de63";//'0x1B57bD57411946147D1b5B1a604a48aFfaF570C0';
        this.ownerAccountAddress = ownerAccountAddress;
        this.privateKey = privateKey;
        this.simpleValidatorSetAddress = simpleValidatorSetAddress;
        this.contract = new web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi),this.simpleValidatorSetAddress);

        //subscribeForPastEvents();
        //listenForContractObjectEvents(this.contract);
    }    
    
    async deployNewSimpleSetValidatorContract(ethAccountToUse, adminValidatorAddress) {
        try {
            var constructorParameters = [];
            constructorParameters.push(adminValidatorAddress);
            var deployedAddress = await utils.deployContract(this.simpleValidatorSetAbi, this.simpleValidatorSetByteCode, ethAccountToUse, constructorParameters);//, function(returnTypeString, result){
            this.simpleValidatorSetAddress = deployedAddress;    
            return this.simpleValidatorSetAddress;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.deployNewSimpleSetValidatorContract(): " + error);
        }
    }

    async getAllValidatorsAsync() {
        try {
            var resultList = [];
            this.contract = new web3.eth.Contract(JSON.parse(this.simpleValidatorSetAbi),this.simpleValidatorSetAddress);
            resultList = await this.contract.methods.getAllValidators().call();
            return resultList;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.getAllValidatorsAsync(): " + error);
        }
    }

    async getAdminValidatorsAsync(adminAddress) {
        try {
            this.contract.methods.getValidatorsForAdmin().call().then(function(resultList){
                console.log("GetAdminValidatorsAsync resultList for ",adminAddress, resultList.length);
                if (resultList.length > 0) {
                    resultList.forEach(eachElement => {
                        console.log(eachElement, "\n");
                    });
                }
            });
        } catch (error) {
            console.log("Error in SimpleValidatorSet.getAdminValidatorsAsync(): " + error);
        }
    }

    async addValidator(ethAccountToUse, newValidator) {
        try {
            var encodedABI = this.contract.methods.addValidator(newValidator).encodeABI();
            var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,web3);
            console.log("estimatedGas",estimatedGas);
            
            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,this.privateKey,web3,estimatedGas);
            return transactionObject.transactionHash;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.addValidator(): " + error);
        }    
    }

    async finaliseChange(ethAccountToUse, newValidator) {
        try {
            var encodedABI = this.contract.methods.finalize(newValidator).encodeABI();
            var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,web3);
            console.log("estimatedGas",estimatedGas);

            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address, encodedABI,this.privateKey,web3,estimatedGas);
            return transactionObject.transactionHash;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.finaliseChange(): " + error);
        }
    }

    async removeValidator(ethAccountToUse, validatorToRemove) {
        try {
            var encodedABI = this.contract.methods.removeValidator(validatorToRemove).encodeABI();
            var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,this.contract._address, encodedABI,web3);
            console.log("estimatedGas",estimatedGas);

            var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,this.contract._address,encodedABI,this.privateKey,web3,estimatedGas);
            return transactionObject.transactionHash;        
        } catch (error) {
            console.log("Error in SimpleValidatorSet.removeValidator(): " + error);
        }
    }
   
    async isActiveValidator(validatorAddress) {
        try {
            //console.log("isActiveValidator:this.simpleValidatorSetAddress ",this.simpleValidatorSetAddress);
            var flag = await this.contract.methods.isValidator(validatorAddress).call();
            return flag;
        } catch (error) {
            console.log("Error in SimpleValidatorSet.isActiveValidator(): " + error);
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
