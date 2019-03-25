var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-bignumber')())
chai.should();

setTimeout(() => {

    describe('Simple Validator', () => {
        this.web3 = web3;
        this.utils = utils;
        this.simpleValidatorSetAddress = simpleValidatorSetAddress;
        const ethAccountToUse = accountAddressList[0];
        const validatorToRemove = accountAddressList[3];
        before(async () => {
          var abiFileName = __dirname + "/../build/contracts/SimpleValidatorSet.abi";
          var value = utils.readSolidityContractJSON(abiFileName);
          var simpleValidatorContract = new web3.eth.Contract(JSON.parse(value[0]),simpleValidatorSetAddress);
          global.simpleValidatorContract = simpleValidatorContract;
          this.contract = simpleValidatorContract;
        });

        describe('All Active Validators', () => {
            it('returns all active validators', async () => {
                var encodedABI = await this.contract.methods.getAllValidators().encodeABI();
                var resultList = await this.utils.getData(ethAccountToUse, this.simpleValidatorSetAddress, encodedABI, this.web3);
                var validatorList = this.utils.split(resultList);
                for (var index = 0; index < validatorList.length; index++) {
                    console.log('Address ' + index + ' ' + validatorList[index])
                    var flag = await this.contract.methods.isActiveValidator(validatorList[index]).call({ from: ethAccountToUse });
                    expect(flag).to.be.true;
                }
            })
        })

        describe('Add Validator for Admin', () => {
            let validatorToAdd = accountAddressList[3];
            it('returns validator is inactive before adding as validator', async () => {
                var flag = await this.contract.methods.isActiveValidator(validatorToAdd).call();
                expect(flag).to.be.false;
            })
            describe('Proposal to Add Validator', () => {
              it('returns proposal not created before add validator proposal', async () => {
                  var whatProposal = await this.contract.methods.checkProposal(validatorToAdd).call({from : ethAccountToUse});
                  whatProposal.should.be.equal('proposal not created');
              })

              it('returns votes as [ 0, 0 ] before add validator proposal', async () => {
                  var votes = await this.contract.methods.checkVotes(validatorToAdd).call({from : ethAccountToUse});
                  expect(votes).to.deep.equal(['0', '0']);
              })

              it('returns proposalToAddValidator transaction as true', async () => {
                  var encodedABI = this.contract.methods.proposalToAddValidator(validatorToAdd).encodeABI();
                  var estimatedGas = 0;
                  var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.simpleValidatorSetAddress,encodedABI,privateKey[ethAccountToUse],this.web3,estimatedGas);
                  expect(transactionObject.status).to.be.true;
              })

              it('returns proposal as add after add validator proposal', async () => {
                  var whatProposal = await this.contract.methods.checkProposal(validatorToAdd).call({from : ethAccountToUse});
                  whatProposal.should.be.equal('add');
              })
          
              it('returns votes as [ 1, 0 ] after add validator proposal', async () => {
                  var votes = await this.contract.methods.checkVotes(validatorToAdd).call({from : ethAccountToUse});
                  expect(votes).to.deep.equal(['1', '0']);
              })
            })

            describe('Vote against Add Validator', () => {
                it('returns voteAgainstAddingValidator transaction status as true', async () => {
                  var votingAgainst = accountAddressList[2];
                  var estimatedGas = 0;
                  var encodedABI = this.contract.methods.voteAgainstAddingValidator(validatorToAdd).encodeABI();
                  var transactionObject = await this.utils.sendMethodTransaction(votingAgainst,this.simpleValidatorSetAddress, encodedABI ,privateKey[votingAgainst],this.web3,estimatedGas);
                  expect(transactionObject.status).to.be.true;
                })

                it('returns proposal as add after voting against add validator proposal', async () => {
                  var whatProposal = await this.contract.methods.checkProposal(validatorToAdd).call({from : ethAccountToUse});
                  whatProposal.should.be.equal('add');
                })

                it('returns votes as [ 1, 1 ] after voting against add validator proposal', async () => {
                  var votes = await this.contract.methods.checkVotes(validatorToAdd).call({from : ethAccountToUse});
                  console.log('Votes ' + votes);
                  expect(votes).to.deep.equal(['1', '1']);
                })
              })

            describe('Voting for Add Validator', () => {
                it('returns voting for', async () => {
                    var votingFor = accountAddressList[1];
                    var estimatedGas = 0;
                    var encodedABI = this.contract.methods.voteForAddingValidator(validatorToAdd).encodeABI();
                    var transactionObject = await this.utils.sendMethodTransaction(votingFor,this.simpleValidatorSetAddress, encodedABI ,privateKey[votingFor],this.web3,estimatedGas);

                    expect(transactionObject.status).to.be.true;

                    // var logs = await this.contract.getPastEvents('NoProposalForAddingAdmin',{fromBlock: 0, toBlock: 'latest'});
                    // console.log('NoProposalForAddingAdmin event logs ' + JSON.stringify(logs))

                    // var logs = await this.contract.getPastEvents('AddAdmin',{fromBlock: 0, toBlock: 'latest'});
                    // console.log('AddAdmin event logs ' + JSON.stringify(logs))
                })

                it('returns proposal not created after voting for add validator proposal', async () => {
                  var whatProposal = await this.contract.methods.checkProposal(validatorToAdd).call({from : ethAccountToUse});
                  whatProposal.should.be.equal('proposal not created');
                })

                it('returns votes as [ 0, 0 ] after voting for add validator proposal', async () => {
                  var votes = await this.contract.methods.checkVotes(validatorToAdd).call({from : ethAccountToUse});
                  expect(votes).to.deep.equal(['0', '0']);
                })
            })

            describe('After validator is added', () => {
                it('returns validator added', async () => {
                    var flag = await this.contract.methods.isActiveValidator(validatorToAdd).call();
                    expect(flag).to.be.true;
                })

              it('returns validator count', async () => {
                  var count = await this.contract.methods.getValidatorsCount().call({from : ethAccountToUse});
                  count.should.be.bignumber.equal(4);
              })

              it('returns active validator count', async () => {
                  var count = await this.contract.methods.getActiveValidatorsCount().call({from : ethAccountToUse});
                  count.should.be.bignumber.equal(4);
              })
            })
        })

        describe('Remove Validator', () => {
            //const validatorToRemove = accountAddressList[3];
            it('returns validator is active before remove validator', async () => {
                var flag = await this.contract.methods.isActiveValidator(validatorToRemove).call();
                expect(flag).to.be.true;
            })

            describe('Proposal to remove validator', () => {
                it('returns proposal not created before remove validator proposal', async () => {
                    var whatProposal = await this.contract.methods.checkProposal(validatorToRemove).call({ from: ethAccountToUse });
                    whatProposal.should.be.equal('proposal not created');
                })

                it('returns votes as [ 0, 0 ] before remove validator proposal', async () => {
                    var votes = await this.contract.methods.checkVotes(validatorToRemove).call({ from: ethAccountToUse });
                    expect(votes).to.deep.equal(['0', '0']);
                })

                it('returns proposalToRemoveValidator transaction status as true', async () => {
                    var encodedABI = this.contract.methods.proposalToRemoveValidator(validatorToRemove).encodeABI();
                    var estimatedGas = 0;
                    var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse, this.simpleValidatorSetAddress, encodedABI, privateKey[ethAccountToUse], this.web3, estimatedGas);

                    expect(transactionObject.status).to.be.true;
                })

                it('returns proposal as remove after remove validator proposal', async () => {
                    var whatProposal = await this.contract.methods.checkProposal(validatorToRemove).call({ from: ethAccountToUse });
                    whatProposal.should.be.equal('remove');
                })

                it('returns votes as [ 1, 0 ] after remove validator proposal', async () => {
                    var votes = await this.contract.methods.checkVotes(validatorToRemove).call({ from: ethAccountToUse });
                    expect(votes).to.deep.equal(['1', '0']);
                })

                describe('Vote against Remove Validator', () => {
                    it('returns voteAgainstRemovingValidator transaction status as true', async () => {
                        var votingAgainst = accountAddressList[2];
                        var estimatedGas = 0;
                        var encodedABI = this.contract.methods.voteAgainstRemovingValidator(validatorToRemove).encodeABI();
                        var transactionObject = await this.utils.sendMethodTransaction(votingAgainst, this.simpleValidatorSetAddress, encodedABI, privateKey[votingAgainst], this.web3, estimatedGas);
                        expect(transactionObject.status).to.be.true;
                    })

                    it('returns proposal as remove after voting against remove validator proposal', async () => {
                        var whatProposal = await this.contract.methods.checkProposal(validatorToRemove).call({ from: ethAccountToUse });
                        whatProposal.should.be.equal('remove');
                    })

                    it('returns votes as [ 1, 1 ] after voting against remove validator proposal', async () => {
                        var votes = await this.contract.methods.checkVotes(validatorToRemove).call({ from: ethAccountToUse });
                        expect(votes).to.deep.equal(['1', '1']);
                    })
                })

                describe('Voting for Remove Validator', () => {
                    it('returns voting for', async () => {

                        var votingFor = accountAddressList[1];
                        var estimatedGas = 0;
                        var encodedABI = await this.contract.methods.voteForRemovingValidator(validatorToRemove).encodeABI();
                        var transactionObject = await this.utils.sendMethodTransaction(votingFor, this.simpleValidatorSetAddress, encodedABI, privateKey[votingFor], this.web3, estimatedGas);
                        expect(transactionObject.status).to.be.true;

                        votingFor = accountAddressList[3];
                        estimatedGas = 0;
                        encodedABI = await this.contract.methods.voteForRemovingValidator(validatorToRemove).encodeABI();
                        transactionObject = await this.utils.sendMethodTransaction(votingFor, this.simpleValidatorSetAddress, encodedABI, privateKey[votingFor], this.web3, estimatedGas);
                        expect(transactionObject.status).to.be.true;

                    })

                    it('returns proposal not created after voting for remove validator proposal', async () => {
                        var whatProposal = await this.contract.methods.checkProposal(validatorToRemove).call({ from: ethAccountToUse });
                        
                        whatProposal.should.be.equal('proposal not created');
                    })

                    it('returns votes as [ 0, 0 ] after voting for remove validator proposal', async () => {
                        var votes = await this.contract.methods.checkVotes(validatorToRemove).call({ from: ethAccountToUse });
                        
                        expect(votes).to.deep.equal(['0', '0']);
                    })
                })
            })

            describe('After Validator is removed', () => {
                it('returns validator removed', async () => {
                    var flag = await this.contract.methods.isActiveValidator(validatorToRemove).call();
                    expect(flag).to.be.false;
                })

                it('returns validator count', async () => {
                    var count = await this.contract.methods.getValidatorsCount().call({ from: ethAccountToUse });
                    count.should.be.bignumber.equal(4);
                })

                it('returns active validator count', async () => {
                    var count = await this.contract.methods.getActiveValidatorsCount().call({ from: ethAccountToUse });
                    count.should.be.bignumber.equal(3);
                })
            })
        })

        describe('Clear Proposal', () => {
            
            const otherValidator = accountAddressList[4];

            describe('Check proposal and check votes before clearProposal', () => {
                it('returns proposal not created', async () => {
                    var whatProposal = await this.contract.methods.checkProposal(otherValidator).call({from : ethAccountToUse});
                    whatProposal.should.be.equal('proposal not created');
                })

                it('returns votes as [ 0, 0 ]', async () => {
                    var votes = await this.contract.methods.checkVotes(otherValidator).call({from : ethAccountToUse});
                    expect(votes).to.deep.equal(['0', '0']);
                })
            })

            describe('Add Validator Proposal', () => {
                it('returns add validator proposal', async () => {
                    var estimatedGas = 0;
                    var encodedABI = this.contract.methods.proposalToAddValidator(otherValidator).encodeABI();
                    var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.simpleValidatorSetAddress,encodedABI,privateKey[ethAccountToUse],this.web3,estimatedGas);
                    expect(transactionObject.status).to.be.true;
                })

                it('returns proposal as add after add validator proposal', async () => {
                    var whatProposal = await this.contract.methods.checkProposal(otherValidator).call({from : ethAccountToUse});
                    whatProposal.should.be.equal('add');
                })

                it('returns votes as [ 1, 0 ] after add validator proposal', async () => {
                    var votes = await this.contract.methods.checkVotes(otherValidator).call({from : ethAccountToUse});
                    expect(votes).to.deep.equal(['1', '0']);
                })
            })

            describe('Clear Add Validator Proposal', () => {
                it('returns clear proposal', async () => {
                    var estimatedGas = 0;
                    var encodedABI = this.contract.methods.clearProposal(otherValidator).encodeABI();
                    var transactionObject = await this.utils.sendMethodTransaction(ethAccountToUse,this.simpleValidatorSetAddress,encodedABI,privateKey[ethAccountToUse],this.web3,estimatedGas);
                    expect(transactionObject.status).to.be.true;
                })

                it('returns proposal not created after clear proposal', async () => {
                    var whatProposal = await this.contract.methods.checkProposal(otherValidator).call({from : ethAccountToUse});
                    whatProposal.should.be.equal('proposal not created');
                })

                it('returns votes as [ 0, 0 ] after clear proposal', async () => {
                    var votes = await this.contract.methods.checkVotes(otherValidator).call({from : ethAccountToUse});
                    expect(votes).to.deep.equal(['0', '0']);
                })
            })
        })

        describe('All Active Validators again', () => {
            it('returns 3 active validators and 1 non active validator', async () => {
                var encodedABI = await this.contract.methods.getAllValidators().encodeABI();
                var resultList = await this.utils.getData(ethAccountToUse, this.simpleValidatorSetAddress, encodedABI, this.web3);
                var validatorList = this.utils.split(resultList);
                for (var index = 0; index < validatorList.length; index++) {
                    console.log('Address ' + index + ' ' + validatorList[index]);
                    var flag = await this.contract.methods.isActiveValidator(validatorList[index]).call({ from: ethAccountToUse });
                    if(validatorList[index] != validatorToRemove){
                    expect(flag).to.be.true;
                    }
                    else{
                    expect(flag).to.be.false;
                    }
                }
            })
        })
    })

    run();
}, 1800000)