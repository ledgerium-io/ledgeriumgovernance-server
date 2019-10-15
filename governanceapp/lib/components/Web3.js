const web3  = require('web3')
const net   = require('net')

class Web3 {
    constructor() {
      this.host     = process.env.WEB3_HTTP || 'http://toorak01.ledgerium.net:8545/'
      this.ipcPath  = '/eth/geth.ipc'
      this.web3Http = new web3(new web3.providers.HttpProvider(this.host));
      this.web3Ipc  = new web3(new web3.providers.IpcProvider(this.ipcPath, net));
    }
}

module.exports = Web3;
