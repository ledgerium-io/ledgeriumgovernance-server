const execSync    = require('child_process').execSync;
const crypto      = require('crypto');
const fs          = require('fs');
const ethUtil     = require('ethereumjs-util');
const sigUtil     = require('eth-sig-util');
const logger      = require('../logger');
const net         = require('net');

class Instanbul {

  constructor(web3) {
    this.web3                       = web3.web3Http
    this.web3Ipc                    = web3.web3Ipc
    this.currentIp                  = ''
    this.nodes                      = []
    this.validators                 = {}
    this.tokenMap                   = {}
    this.consortiumId               = 2018

    this.gasPrice                   = "0x77359400"
    this.gasLimit                   = "0x47b760"

    this.addresses                  = fs.readFileSync('./lib/keystore/contractsConfig.json', 'utf8')
    this.adminContractABI           = fs.readFileSync('./lib/contracts/build/AdminValidatorSet.abi.json', 'utf8')
    this.networkManagerContractABI  = fs.readFileSync('./lib/contracts/build/NetworkManagerContract.abi.json', 'utf8')
    this.refreshInterval            = 60000
    this.hostURL                    = `http://${process.argv[2] || "localhost"}:${process.argv[3] || 8545}`
    this.enodeString                = 'enode://'

    this.addressContract            = '0x0000000000000000000000000000000000002023'
    // this.init()
    // this.getPayload()
    this.startProposal()
      .then()
      .catch(console.log)
  }

  init() {
    logger.info('Loading state')
    Promise.all([this.setCurrentIp(), this.setValidators(), this.setNodes()])
      .then(()=>{
        logger.info('Loaded state successfully')

      })
      .catch(error => {
        logger.error(`Error loading state: ${error.message || error}`)
      })
  }


  getPayload() {
    return new Promise( (resolve, reject) => {
      let payload = {
        consortiumId: this.consortiumId,
        timestamp: Date.now(),
        refreshInterval: this.refreshInterval,
        nodeCount: 0,
        nodes: [],
        snapshot: {
          validators: []
        }
      }
      Promise.all([this.getNodeList(), this.getSnapshot()])
        .then(data => {
          payload.nodeCount = data[0].length
          payload.nodes     = data[0]
          payload.snapshot  = data[1]
          resolve(payload)
        })
        .catch(reject)
    })
  }

  setValidators() {
    return new Promise((resolve, reject) => {
      this.getSnapshot()
        .then(snapshot => {
          for(let i=0; i<snapshot.validators.length; i++) {
              this.validators[snapshot.validators[i]] = true
          }
          resolve()
        })
        .catch(console.log)
    })
  }

  setNodes() {
    return new Promise( (resolve, reject) => {
      this.getNodeList()
        .then(nodes => {
          this.nodes = nodes
          resolve()
        })
        .catch(console.log)
    })
  }

  getNonce(address) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.web3.eth.txpool.content(),
        this.web3.eth.getTransactionCount(address, 'pending')
      ])
        .then(data => {
          const txpool = data[0]
          let transactionCount = data[1]
          if(txpool.pending) {
            if(txpool.pending[this.publicKey]) {
              const pendingNonces = Object.keys(txpool.pending[address])
              transactionCount = parseInt(pendingNonces[pendingNonces.length-1])+1
            }
          }
          logger.debug(`Nounce: ${transactionCount}`)
          resolve(transactionCount)
        })
        .catch(reject)
    })
  }

  generateToken() {
    return new Promise((resolve, reject) => {
      resolve(crypto.createHash('sha256').update((Math.random().toString())).digest('hex'));
    })
  }

  startProposal(address) {
    return new Promise( (resolve, reject) => {
      Promise.all([this.generateToken(), this.getNonce(address)])
        .then(data => {
          const token = data[0]
          const transaction = {
            nonce: data[1],
            gasPrice: this.gasPrice,
            gasLimit: this.gasLimit,
            from: address,
            to: this.addressContract,
            value: this.web3.eth.utils.toHex(0),
          }
          this.tokenMap[token] = true
          resolve({
            transaction,
            token
          })
        })
        .catch(console.log)
    })
  }

  istanbulPropose(token, transactionHash, signature) {
    return new Promise( (resolve, reject) => {
      if(!tokenMap[token] || !transactionHash) reject('Incomplete request');
      delete tokenMap[token];
      const recovered = sigUtil.recoverPersonalSignature({ data: token, sig:signature});
      this.web3.eth.getCoinbase()
        .then(coinbase => {
          if(coinbase && coinbase.toLowerCase() === recovered.toLowerCase()) {
            if(typeof proposal !== 'boolean' || typeof account !== 'string') reject('Wrong request types')
            this.web3.currentProvider.send({
              jsonrpc: "2.0",
              id: new Date().getTime(),
              method: "istanbul_propose",
              params: [account, proposal]
            }, function (error, result) {
              if(error) {
                reject(error)
              } else {
                resolve(result)
              }
            })
          }
        })
        .catch(reject)
    })
  }




  setCurrentIp() {
    return new Promise( (resolve, reject) => {
      this.currentIp = String(execSync('curl -s https://api.ipify.org'))
      resolve()
    })

  }

  getNodeList() {
    return new Promise( (resolve, reject) => {
      let nodes = []
      Promise.all([this.getNodeInfo(), this.getNodePeers()])
        .then(data => {
          const node = data[0]
          const peers = data[1]

          let nodeId = node.enode.slice(this.enodeString.length, node.enode.indexOf("@"))
          let publicKey = `0x${ethUtil.pubToAddress('0x' + nodeId ).toString('hex')}`
          nodes.push({
            enode: node.id,
            name: node.name.split('/')[1],
            publicKey: publicKey,
            role: this.validators[publicKey] ? "MasterNode" : "PeerNode",
            ip: this.currentIp,
            port: node.ports.listener,
          })

          for(let i=0; i<peers.length; i++) {
            publicKey = `0x${ethUtil.pubToAddress('0x' + peers[i].id ).toString('hex')}`
            nodes.push({
              enode: peers[i].id,
              name: peers[i].name.split('/')[1],
              publicKey: publicKey,
              role: this.validators[publicKey] ? "MasterNode" : "PeerNode",
              ip: peers[i].network.remoteAddress.split(':')[0],
              port: peers[i].network.remoteAddress.split(':')[1],
            })
          }
          resolve(nodes)

        })
        .catch(reject)
    })
  }

  getSnapshot() {
    return new Promise( (resolve, reject) => {
      this.web3.currentProvider.send({
        jsonrpc: '2.0',
        id: new Date().getTime(),
        method: 'istanbul_getSnapshot',
        params: []
      }, function (error, result) {
        if(error) {
          reject(error)
        } else {
          resolve(result.result)
        }
      })
    })
  }

  getNodeInfo() {
    return new Promise( (resolve, reject) => {
      this.web3.currentProvider.send({
        jsonrpc: '2.0',
        id: new Date().getTime(),
        method: 'admin_nodeInfo',
        params: []
      }, function (error, result) {
        if(error) {
          reject(error)
        } else {
          resolve(result.result)
        }
      })
    })
  }

  getNodePeers() {
    return new Promise( (resolve, reject) => {
      this.web3.currentProvider.send({
        jsonrpc: '2.0',
        id: new Date().getTime(),
        method: 'admin_peers',
        params: []
      }, function (error, result) {
        if(error) {
          reject(error)
        } else {
          resolve(result.result)
        }
      })
    })
  }

  getLatestBlock() {
    return new Promise( (resolve, reject) => {
      this.web3.eth.getBlock('latest')
        .then(block => {
          resolve(block)
        })
        .catch(error => {
          reject(error)
        })
    })
  }



}

module.exports = Instanbul;
