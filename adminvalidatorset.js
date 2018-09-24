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
        this.contract = new this.web3.eth.Contract(JSON.parse(this.adminValidatorSetAbi),this.adminValidatorSetAddress);
        
        //subscribeForPastEvents();
        //listenForContractObjectEvents(this.contract);  
    }

    async deployNewAdminSetValidatorContract(ethAccountToUse, otherAdminsList) {
        try {
            var deployedAddress = await utils.deployContract(this.adminValidatorSetAbi, this.adminValidatorSetByteCode, ethAccountToUse, otherAdminsList,this.web3);//, function(returnTypeString, result){
            this.adminValidatorSetAddress = deployedAddress;
            return this.adminValidatorSetAddress;
        } catch (error) {
            console.log("Error in AdminValidatorSet.deployNewAdminSetValidatorContract(): " + error);
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
        utils.listen(contractObject, (events)=>{
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

        // utils.subscribe("SimpleValidatorSet", this.web3, (events)=>{
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
}
