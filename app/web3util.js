
class Utils {
    constructor(web3provider, utils) {
    }

    async transaction (from,to,value,data){
        return {
            from    : from,
            to      : to,
            data    : data,
            value   : value,
            gasPrice: '0x00',
            gas     : 4700000
        }
    }

    async getContractEncodeABI(abi,bytecode,web3,arg){
        try{
            let contract = new web3.eth.Contract(JSON.parse(abi));
            return await contract.deploy({ data : bytecode, arguments : arg }).encodeABI();
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
            });
            // .on('error', function(error){ 
            //     if(!error)
            //         console.log("error", error);
            // })
            // .on('receipt', receipt => {
            //     deployedAddress = receipt.contractAddress;
            //     // implement it on asysn await.
            //     return deployedAddress;
            // })
            // .on('transactionHash', function(transactionHash){
            //     console.log('transactionHash', transactionHash);
            //     //web3.eth.getTransaction(transactionHash);
            //     callback("transactionHash", transactionHash);
            // })
            // .then(transaction => {
            //     console.log("transaction",transaction);
            // });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    }

    async sendMethodTransaction (fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas){//, calleeMethodName,callback) {
        let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
        console.log("nonceToUse ",nonceToUse);
        const txParams = {
            nonce: nonceToUse,
            gasPrice: '0x00',
            gasLimit: 4700000, //estimatedGas, //20000000, // Todo, estimate gas
            from: fromAccountAddress,
            to: toContractAddress,
            value: '0x00',
            data: methodData
            //"privateFor" : privateFor
        }
        
        let receipt = await web3.eth.sendTransaction(txParams);
        return receipt;
    }
    
    sendMethodTransactionCb (fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas, fn)
    {//, calleeMethodName,callback) {
        web3.eth.getTransactionCount(fromAccountAddress, 'pending', function(err,  nonceToUse) {
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                gasPrice: '0x00',
                gasLimit: 4700000, //estimatedGas, //20000000, // Todo, estimate gas
                from: fromAccountAddress,
                to: toContractAddress,
                value: '0x00',
                data: methodData
            }
            const tx = new ethereumjs.Tx(txParams)
            //const privateKeyBuffer = new ethereumjs.Buffer.Buffer.from(privateKey, 'hex');
            //tx.sign(privateKeyBuffer);
            const serializedTx = tx.serialize();

            //web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            web3.eth.sendTransaction(txParams, (err, txHash) => {
                fn(err, txHash);
            });
            // .on('receipt', function(r, e) {
            //     fn(null, r);
            // })
            // .on('error', function(e, r) {
            //     fn(e, null);
            // })
        });
   }
    
    /** To get estimate of gas consumptio for the given transaction prior to actual
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
    async getReceipt(transactionHash,web3){
        var receipt = web3.eth.getTransactionReceipt(transactionHash);
        if(!receipt)
            console.log("Transaction",transactionHash,"did not get mined!");
        return receipt;
    }
    
    // readSolidityContractJSON (filename) {
    //     var json = JSON.parse(fs.readFileSync(filename, 'utf8'));
    //     let abi = JSON.stringify(json.abi);
    //     return [abi, json.bytecode];
    // },

    getABIBytecodeAdmin(filename,contractName) {
        // let source = fs.readFileSync(filename, 'utf8');
        // let compiledContract = solc.compile(source, 1);
        // let abi = compiledContract.contracts[":"+contractName].interface;
        // let bytecode = compiledContract.contracts[":"+contractName].bytecode;

        let abi = [{"inputs":[{"name":"owner1","type":"address"},{"name":"owner2","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"by","type":"address"},{"indexed":false,"name":"vfor","type":"address"}],"name":"votedfor","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"by","type":"address"},{"indexed":false,"name":"vfor","type":"address"}],"name":"votedagainst","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_address","type":"address"}],"name":"ownerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_address","type":"address"}],"name":"ownerRemoved","type":"event"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"proposalToRemoveAdmin","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"proposalToAddAdmin","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"voteForAddingAdmin","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"voteForRemovingAdmin","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"voteAgainstAddingAdmin","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"voteAgainstRemovingAdmin","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"changeVote","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"checkAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getAllAdmins","outputs":[{"name":"res","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"checkVotes","outputs":[{"name":"res","type":"uint32[2]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"checkProposal","outputs":[{"name":"res","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getVoted","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTotalCount","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"}];
        let bytecode = "0x60806029";
        

        return [abi, bytecode];
    }

    getABIBytecodeSimple(filename,contractName) {
        
        let abi = [{"inputs":[{"name":"_address","type":"address"},{"name":"_validator1","type":"address"},{"name":"_validator2","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"validator","type":"address"},{"indexed":false,"name":"_admin","type":"address"}],"name":"addvalidator","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"validator","type":"address"},{"indexed":false,"name":"_admin","type":"address"}],"name":"removevalidator","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"validator","type":"address"},{"indexed":false,"name":"_admin","type":"address"},{"indexed":false,"name":"_event","type":"string"}],"name":"finalizeEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"by","type":"address"},{"indexed":false,"name":"vfor","type":"address"}],"name":"votedfor","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"by","type":"address"},{"indexed":false,"name":"vfor","type":"address"}],"name":"votedagainst","type":"event"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"addValidator","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"}],"name":"removeValidator","outputs":[{"name":"res","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"checkProposal","outputs":[{"name":"res","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidatorsForAdmin","outputs":[{"name":"a","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"isValidator","outputs":[{"name":"a","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getAllValidators","outputs":[{"name":"a","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"}];
        let bytecode = "0x608f0029";

        return [abi, bytecode];
    }

    keccak (web3,text){
        return web3.utils.keccak256(text);
    }

    async sendTransaction(web3,transaction){
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
        web3.eth.subscribe(string,(error,transaction)=>{
            if(error){
                console.log("error",`SUBSCRIBE:\n${error.message}\n${error.stack}`);
            }else{
                callback(transaction);
            }
        });
    }
    
    // to get all events from a submitted transaction to send to node application
    async listen(contract,callback){
        contract.events.allEvents({
            fromBlock: 0,
            toBlock  : 'latest'
        },(err,event)=>{
            if(err){
                console.log('error',`\n${err.message}\n${err.stack}`)
            }else{
                console.log('info',`:\n${event}`);
                callback(event);
            }
        });
    }

    async getData(fromAccount,toContract,endata,web3){
        return await web3.eth.call({
            from : fromAccount,
            to: toContract,
            data: endata
        });
    }

    split(array){
        var temp = [];
        var add = [];
        array = array.slice(2,array.length);
        for(var i=0;i<array.length;i+=64){
            temp.push(array.slice(i,i+64));
        }
        for(var j=0;j<temp.length;j++){
            add.push("0x"+temp[j].slice(24,64));
        }
        return add.splice(2, add.length);
    }

    convertToBool(inputString){
        if(inputString == "0x0000000000000000000000000000000000000000000000000000000000000001")
            return true;
        else (inputString == "0x0000000000000000000000000000000000000000000000000000000000000000")
            return false;
    }
}