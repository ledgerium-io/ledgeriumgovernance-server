# Governance App
Goveranance App contains smart contracts to manage admin and individual validators to come on platform. 

# How the solution will be used?
  - AdminContractSet - This contract facilitates existing admins to allow new admin to get added to the team by voting with in and also, to vote out to remove it from the team
  - SimpleContractSet - This contract facilitates manage the validators life cycle on the platform, let one of the existing admin add validator or remove validator.

### Tech
It uses the private key of ethereum accounts for writing signed transactions on blockchain so need keystore files in the path

It is designed to work along with yml file which is part of the repo. The IBFT test setup will start 7 validators nodes with each having one coinbase account. One of the coinbase account i.e. @http://localhost:8545 is used to deploy adminValidator (admin solidity contract) and simpleValidator (validator solidity contract)

### Getting Started

## Clone the repo and install the project
- git clone https://github.com/golashr/governanceApp.git
- cd governanceApp
- npm install

## Clone the repo and install the project
Run the geth nodes by running
- docker-compose up -d

This will bring up 
- 7 geth node docker instances
- 7 correspnding constellation node docker instances
- 1 quorum-maker front end app docker instance
- 1 eth-stat front end app docker instance
