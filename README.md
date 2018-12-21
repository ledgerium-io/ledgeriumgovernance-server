# Governance App
Goveranance App contains smart contracts to manage admin and individual validators to come on platform. 

# How the solution will be used?
  - AdminContractSet - This contract facilitates existing admins to allow new admin to get added to the team by voting with in and also, to vote out to remove it from the team
  - SimpleContractSet - This contract facilitates manage the validators life cycle on the platform, let one of the existing admin add validator or remove validator.

## Tech
It uses the private key of ethereum accounts for writing signed transactions on blockchain so need keystore files in the path

It is designed to work along with yml file which is part of the repo. The IBFT test setup will start 7 validators nodes with each having one coinbase account. One of the coinbase account i.e. @http://localhost:8545 is used to deploy adminValidator (admin solidity contract) and simpleValidator (validator solidity contract)

## Getting Started

### Clone the repo and install the project
- git clone https://github.com/ledgerium/governanceApp.git
- cd governanceApp

### Bring up the geth nodes using docker compose
NOTE: If there are existing docker instances (sudo docker ps -a), stop and remove them
```
sudo docker stop $(sudo docker ps -aq)
```

```
sudo docker rm $(sudo docker ps -aq)
```
 
1. Create docker network by running this command
   ```
   docker network create -d bridge --subnet 172.16.239.0/24 --gateway 172.16.239.1 app_net
   docker network create -d bridge --subnet 172.19.240.0/24 --gateway 172.19.240.1 test_net
   ```
2. Run the geth nodes by running
   **docker-compose up -d**

### We are not using truffle framework for any compilation.
- ~~sudo npm install -g truffle~~
- ~~truffle compile~~

``` 
We have used solc compiler to AdminValidatorSet and SimpleValidatorSet contract
- solc --overwrite --gas --bin-runtime --abi --optimize-runs=200 -o ./build/contracts ./contracts/AdminValidatorSet.sol
- solc --overwrite --gas --bin-runtime --abi --optimize-runs=200 -o ./build/contracts ./contracts/SimpleValidatorSet.sol
- npm install
```

### Run the smart contracts - Usages
The governanceApp can be used with different switches

**protocol**
- ws
- http

**hostname**
- localhost
- XXX.XXX.XXX.XXX

**port**
- e.g. 9000 for Websocket
- e.g. 8545 for http

**readkeyconfig**
- if keystore\privatekey.json needs to be used for accounts and respective their private keys

or **privateKeys**
- provide comma-seperated valid private keys like "897c0cee04cadac8df147671bc0868c208c95c750d46be09f2d7b18b4efabdbb"

**runadminvalidator** - for AdminValidatorSet tests 
- runAdminTestCases 
- runRemoveAdminTestCases
- getAllActiveAdmins
- getAllAdmins
- addOneAdmin
- removeOneAdmin
- runClearProposalsAdminTestCases -- provide valid ethereum address with comma e.g.0xc2cb28fad9b82036c9f32cbd6c84343612ee0323

**runsimplevalidator** - for SimpleValidatorSet tests 
- validatorSetup 
- runValidatorTestCases
- runRemoveValidatorTestCases
- getListOfActiveValidators
- addSimpleSetContractValidatorForAdmin -- provide valid ethereum address with comma e.g. "0xc2cb28fad9b82036c9f32cbd6c84343612ee0323"
- removeSimpleSetContractValidatorForAdmin -- provide valid ethereum address with comma e.g. "0xc2cb28fad9b82036c9f32cbd6c84343612ee0323"

**Sample usages**
``` 
node index.js protocol=ws hostname=localhost port=9000 privateKeys=7e0d243242af3a907f7b0675925bf1694d1e586265b4fc9dc4f20e2a1157f4e3
``` 
- Running with events ON - with the ws switch
```
node index.js protocol=ws hostname=localhost port=9000 readkeyconfig=true runsimplevalidator=getListOfActiveValidators,addSimpleSetContractValidatorForAdmin,0xf1cba7514dcf9d1e8b1151bcfa05db467c0dcf1a,removeSimpleSetContractValidatorForAdmin,0xf1cba7514dcf9d1e8b1151bcfa05db467c0dcf1a
```

- Running 'without' events ON - with the http switch
```
node index.js protocol=http hostname=localhost port=8545 readkeyconfig=true runadminvalidator=addOneAdmin,0x3a91fd8517b58470c85fd570913b358c4db916bc,runClearProposalsAdminTestCases,0xc2cb28fad9b82036c9f32cbd6c84343612ee0323,getAllActiveAdmins
```
### Running the smart contracts testcases
- npm test
This will run testcases of the AdminValidatorSet and SimpleValidatorSet contracts on local setup

This will bring up 
- 7 geth node docker instances
- 7 corresponding constellation node docker instances
- 1 quorum-maker front end app docker instance
- 1 eth-stat front end app docker instance

# governanceUI
The Ledgerium governance app UI

The governance UI is a NodeJS application using handlebars. To run it locally (assuming the dev environment setup is done as per https://github.com/ledgerium/LedgeriumWiki) run this after installing the dependencies. The governanceUI also expects the smart contract is up to date with latest bytecode and contract address.

Governance UI is a Dapps that works with [Metamask](https://metamask.io/) for making signed transactions. Metamask has to be installed to use the governance app.

```
node governanceUI.js
```

The GovernanceUI is served default from port `3002`. Access localhost:3002 from your browser.

All transactions have to be signed by the privatekey managed by the metamask plugin on the browser.

It is also important to note that certain actions will be restricted if the account is not an **admin**, admins or not are determined by the smartcontracts deployed initially. EOAs can be only validators without being an admin, they can participate in the voting/consensus rounds to votein/voteout other validators.

![Governance UI](governance_ui.png)

![Validator UI](governance_ui_vals.png)
