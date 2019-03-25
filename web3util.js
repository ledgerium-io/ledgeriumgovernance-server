const EthereumTx = require('ethereumjs-tx');
const fs = require('fs');
var keythereum = require('keythereum');
const ethUtil = require('ethereumjs-util');
class Utils  {
    async transaction (from,to,value,data) {
        return {
            from    : from,
            to      : to,
            data    : data,
            value   : value,
            gasPrice: '0x00',
            gas     : 4700000
        }
    }

    async getContractEncodeABI(abi,bytecode,web3,arg) {
        try{
            let contract = new web3.eth.Contract(JSON.parse(abi));
            return await contract.deploy({ data : bytecode, arguments : arg}).encodeABI();
            //return await contract.deploy({ data : bytecode, arguments : arg, "privateFor" : privateFor }).encodeABI();
        } catch (error) {
            console.log("Exception in utils.getContractEncodeABI(): " + error);
        } 
    }
    
    async deployContract(contractAbi, bytecode, deployedAddress, constructorParameters, web3 /*callback*/) {
        console.log("deployContract");
        try{
            let deployedContract = new web3.eth.Contract(JSON.parse(contractAbi));
            deployedAddress = await deployedContract.deploy({
                data : bytecode, 
                arguments: constructorParameters
            })
            .send({
                from : deployedAddress,
                gas : 5500000
                //"privateFor" : privateFor
            });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    }
    
    async sendMethodTransaction (fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas) {//, calleeMethodName,callback) {
        try
        {
            var gasPrice = await web3.eth.getGasPrice();
            console.log("gasPrice ",web3.utils.toHex(gasPrice)); 

            var balance = await web3.eth.getBalance(fromAccountAddress);
            console.log("FromAccount", fromAccountAddress, "has balance of", web3.utils.fromWei(balance, 'ether'), "ether");
            
            let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                //gasPrice: '0x00',
                gasPrice: web3.utils.toHex(gasPrice),//'0x4A817C800', //20Gwei
                gasLimit: '0x47b760',//'0x48A1C0',//web3.utils.toWei(20,'gwei'), //estimatedGas, // Todo, estimate gas
                from: fromAccountAddress,
                to: toContractAddress,
                value: web3.utils.toHex(0),
                data: methodData
                //"privateFor" : privateFor
            }
            const tx = new EthereumTx(txParams);
            const privateKeyBuffer = new Buffer(privateKey, 'hex');
            tx.sign(privateKeyBuffer);
            const serializedTx = tx.serialize();

            let transactionHash = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
            // var receipt;
            // do{
            //     receipt = await web3.eth.getTransactionReceipt(transactionHash);
            // }
            // while(receipt == null)
            if(transactionHash.status)
                return transactionHash;
            else
                return "";
        }
        catch (error) {
            console.log("Error in utils.sendMethodTransaction(): " + error);
            return "";
        }
    }
    
    /** To get estimate of gas consumption for the given transaction prior to actual
     * execution on blockchain! Extremely useful feature however, giving issues on quorum
    */
   async estimateGasTransaction (fromAccountAddress, toContractAddress, methodData, web3) {
        return await web3.eth.estimateGas(
            {
                from    : fromAccountAddress,
                to      : toContractAddress,
                data    : methodData
            });
    }

    /** to get receipt of the event raised from the blockchain
    */ 
    async getReceipt(transactionHash,web3) {
        var receipt = web3.eth.getTransactionReceipt(transactionHash);
        if(!receipt)
            console.log("Transaction",transactionHash,"did not get mined!");
        return receipt;
    }
    
    /** to get receipt of the event raised from the blockchain
    */ 
    readSolidityContractJSON (filename, binFlag) {
        var jsonABi = JSON.parse(fs.readFileSync(filename+".abi", 'utf8'));
        var jsonBytecode = "0x";
        let abi = JSON.stringify(jsonABi);
        if(binFlag)
            jsonBytecode += fs.readFileSync(filename+".bin", 'utf8');
        return [abi, jsonBytecode];
    }

    keccak (web3,text) {
        return web3.utils.keccak256(text);
    }

    async sendTransaction(web3,transaction) {
        return await web3.eth.sendTransaction(transaction);
    }

    generatePublicKey (privateKey) {
        return '0x'+ethUtil.privateToAddress(privateKey).toString('hex');
    }

    getPrivateKeyFromKeyStore (accountAddress, keyStorePath, password) {
        var keyObject = keythereum.importFromFile(accountAddress, keyStorePath);
        var privateKey = keythereum.recover(password, keyObject);
        return privateKey.toString('hex');
    }

    async subscribe (string,web3,callback) {
        web3.eth.subscribe(string,(error,transaction)=> {
            if(error){
                console.log("error",`SUBSCRIBE:\n${error.message}\n${error.stack}`);
            } else{
                callback(transaction);
            }
        });
    }
    
    // to get all events from a submitted transaction to send to node application
    async listenContractAllEvents(contract,callback) {
        contract.events.allEvents({
            fromBlock: 0,
            toBlock  : 'latest'
        }, (err,event) => {
            if(err) {
                console.log('error',`\n${err.message}\n${err.stack}`)
            } else {
                callback(event);
            }
        })
    }

    async getData(fromAccount,toContract,endata,web3) {
        return await web3.eth.call({
            from : fromAccount,
            to: toContract,
            data: endata
        });
    }

    split(array) {
        let temp = [];
        let add = [];
        array = array.slice(2, array.length);
        for(var i = 0; i < array.length; i+=64) {
            temp.push(array.slice(i,i+64));
        }
        for(var j = 0; j < temp.length; j++) {
            add.push("0x"+temp[j].slice(24,64));
        }
        return add.splice(2, add.length);
    }

    convertToBool(inputString) {
        if(inputString == "0x0000000000000000000000000000000000000000000000000000000000000001")
            return true;
        else (inputString == "0x0000000000000000000000000000000000000000000000000000000000000000")
            return false;
    }

    writeContractsINConfig(){
        try{
            var contractFileName = __dirname + "/keystore/" + "contractsConfig.json";
            contractsList["adminValidatorSetAddress"] = adminValidatorSetAddress;
            contractsList["simpleValidatorSetAddress"] = simpleValidatorSetAddress;
            contractsList["networkManagerAddress"] = networkManagerAddress;
        
            var data = JSON.stringify(contractsList,null, 2);
            fs.writeFileSync(contractFileName,data);
        }
        catch (error) {
            console.log("Error in writeContractsINConfig: " + error);
        }
    }
}
module.exports = Utils;