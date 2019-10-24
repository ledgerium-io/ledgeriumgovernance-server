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
    this.challengeMap               = {}
    this.challengeExpiry            = 600000
    this.consortiumId               = 2018

    this.gasPrice                   = "0x77359400"
    this.gasLimit                   = "0x47b760"

    this.coinbase                   = ""
    this.refreshInterval            = 60000
    this.hostURL                    = `http://${process.argv[2] || "localhost"}:${process.argv[3] || 8545}`
    this.enodeString                = 'enode://'

    this.init()
    this.getPayload()
  }

  init() {
    logger.info('Loading state')
    Promise.all([this.setCurrentIp(), this.setValidators(), this.setNodes(), this.setCoinbase()])
      .then(()=>{
        logger.info('Loaded state successfully')
        logger.info(`Coinbase account: ${this.coinbase}`)

      })
      .catch(error => {
        logger.error(`Error loading state: ${error.message || error}`)
      })
  }

  setCoinbase() {
    return new Promise( (resolve, reject) => {
      this.web3.eth.getCoinbase()
        .then(coinbase => {
          this.coinbase = coinbase
          resolve(true)
        })
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
          resolve(true)
        })
        .catch(console.log)
    })
  }

  setNodes() {
    return new Promise( (resolve, reject) => {
      this.getNodeList()
        .then(nodes => {
          this.nodes = nodes
          resolve(true)
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
            if(txpool.pending[address]) {
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

  generateChallenge() {
    return new Promise((resolve, reject) => {
      resolve(crypto.createHash('sha256').update((Math.random().toString())).digest('hex'));
    })
  }

  setExpiry(challenge) {
    setTimeout(()=>{
      if(this.challengeMap[challenge]) {
        delete this.challengeMap[challenge]
      }
    }, this.challengeExpiry)
  }

  startProposal(address) {
    return new Promise( (resolve, reject) => {
      this.web3.eth.getCoinbase()
        .then(coinbase => {
          if(coinbase && coinbase.toLowerCase() === address.toLowerCase()) {
            this.generateChallenge()
              .then(challenge => {
                this.challengeMap[challenge] = true
                this.setExpiry(challenge)
                resolve({
                  challenge
                })
              })
              .catch(error => {
                logger.error(error.message);
                reject('Something went wrong, please try again')
              })
          } else {
            reject(`Unauthorized. The address provided '${address}' does not match the nodes coinbase address`)
          }
        })
        .catch(error => {
          logger.error(error.message);
          reject('Something went wrong, please try again')
        })
    })
  }

  propose(challenge, signature, votee, proposal) {
    return new Promise( (resolve, reject) => {
      if(!this.challengeMap[challenge]) reject('Challenge invalid or expired.');
      delete this.challengeMap[challenge];
      const recovered = sigUtil.recoverPersonalSignature({ data: challenge, sig: signature});
      this.web3.eth.getCoinbase()
        .then(coinbase => {
          if(coinbase && coinbase.toLowerCase() === recovered.toLowerCase()) {
            this.web3Ipc.currentProvider.send({
              jsonrpc: "2.0",
              id: new Date().getTime(),
              method: "istanbul_propose",
              params: [votee, proposal]
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
      resolve(true)
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
        .then(resolve)
        .catch(reject)
    })
  }



}

module.exports = Instanbul;
