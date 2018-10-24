async function onload() {
    var isLoaded = false;
    var localWeb3 = new Web3(web3.currentProvider);
    //var localWeb3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    var contractAbi = '{{{json this.contractAbi}}}';
    var nodeInfo = {{{json this.nodes}}};
    var adminAddress = {{{json this.nodes.adminContractAddress}}};
    var simpleAddress = {{{json this.nodes.simpleContractAddress}}};
    var utils = new Utils();
    var helper = new AdminValidatorSet(web3.currentProvider, utils, adminAddress, {{{this.nodes.adminContractAbi}}})
    var simpleHelper = new SimpleValidatorSet(web3.currentProvider, utils, simpleAddress, {{{this.nodes.simpleContractAbi}}})
    var validatorCapacity = 0;
    var userIsAdmin = false;
    var consortiumValidatorAddresses = [];
    var request = new XMLHttpRequest();
    var currentAccount = "0x";

    window.addEventListener('load', function () {
      // Checking if Web3 has been injected by the browser (Mist/MetaMask)
      if (typeof web3 !== 'undefined') {
        // Use the browser's ethereum provider

        var networkInfoRequest = new XMLHttpRequest();
        networkInfoRequest.open('GET', '/networkinfo', true);
        networkInfoRequest.onload = function () {
          console.log(`NetworkInfo returned: ${networkInfoRequest.response}`);
          var baseNetworkInfo = JSON.parse(networkInfoRequest.response);
          var paritySpec = JSON.parse(baseNetworkInfo.paritySpec);

          localWeb3.eth.getAccounts((error, accounts) => {
            console.log(accounts[0]);
            currentAccount = accounts[0];//.toLowerCase();
            // refresh the page in the case that web3 account changes
            var accountInterval = setInterval(function () {
              helper.checkAdmin(currentAccount, currentAccount, (f) => {
                if(!f) {
                  location.reload();
                }
              })
              {{!-- if (web3.eth.accounts[0] !== currentAccount) {
                location.reload();
              } --}}
            }, 60000);
            //if (`${accounts[0]}` == "undefined") {
              //showError("Please install and unlock <a href='https://metamask.io/'>MetaMask</a>");
            //}
            //else {
              document.getElementById('currentMetaMaskAccount').innerHTML = `Current Ethereum Account: ${accounts[0]}`;
            //}
          })

          // Print the Metamask providers network Id
          localWeb3.eth.net.getId((error, networkId) => {
            var webServerNetworkId = parseInt(paritySpec.params.networkID);
            console.log(`Web server ethererum networkId: ${webServerNetworkId}`);
            console.log(`Local Web3 NetworkId: ${networkId}`);
            if (webServerNetworkId != networkId) {              
              errorMessage(`The web server is connected to a network with an ID of: ${webServerNetworkId}, and Metamask is connected to a network with an ID of: ${networkId}`);
            }            
          })

          // Make sure the local and remote networks match by comparing a recent block hash
          localWeb3.eth.getBlock(baseNetworkInfo.recentBlock.number, function (error, result) {
            console.log(`Web server recent block#: ${baseNetworkInfo.recentBlock.number} - hash: ${baseNetworkInfo.recentBlock.hash}`);
            console.log(`Local web3 hash: ${result.hash}`);
            if (baseNetworkInfo.recentBlock.hash != result.hash) {
              errorMessage(`The web server and Metamask block hashes do not match. You may not be connected to the same ethereum network in Metamask`);
            }
          });

          //var validatorCapacityHtml = `Each administrator is allowed ${inWords(2)} nodes`;
          document.getElementById('validatorsHeader').innerHTML = "List of validators on network";

          {{!-- helper.GetValidatorCapacityAsync(function (result) {
            validatorCapacity = result;
            var validatorCapacityHtml = `Each administrator is allowed ${inWords(result)} nodes`;
            document.getElementById('validatorsHeader').innerHTML = validatorCapacityHtml;
          }); --}}

          let resulty = await helper.getAllAdmins2();

          helper.GetAdminsAsync((result) => {
            // Add rows to the adminTable
            var table = document.getElementById("adminTable");

            // Is current user an admin?
            result.forEach(eachAdmin => {
              if (currentAccount == eachAdmin) {
                userIsAdmin = true;
              }
            });
            result.forEach(eachAdmin => {
              // Create an empty <tr> element and add it to the last position of the table:
              var adminRow = table.insertRow(-1);
              // Add the admin account number
              var cell1 = adminRow.insertCell(0);
              cell1.innerHTML = eachAdmin;

              // Add the admin's alias
              var cell2 = adminRow.insertCell(1);
              cell2.id = `AliasCell-${eachAdmin}`
              cell2.innerHTML = "Loading";

              helper.GetAliasForAdmin(eachAdmin, (aliasResult) => {
                var aliasCell = document.getElementById(`AliasCell-${eachAdmin}`);
                if (aliasResult == "") {
                  aliasResult = "Anon"
                }
                if (currentAccount == eachAdmin) {
                  document.getElementById("aliasDisplay").innerHTML = aliasResult;
                  document.getElementById("aliasEditorText").placeholder = aliasResult;
                  aliasResult += " (You)";
                }
                aliasCell.innerHTML = aliasResult;
              });

              // Add Vote Against Button if is existing admin
              if (userIsAdmin && (eachAdmin != currentAccount)) {
                var cell3 = adminRow.insertCell(2);
                cell3.id = `VoteAgainst-${eachAdmin}`;
                
                helper.checkAdmin("", eachAdmin, (isAdmin, err) => {
                  if(isAdmin) {
                    helper.checkProposal(currentAccount, eachAdmin, (err, res) => {
                    if(res.toLowerCase() == "proposal not created") {
                      cell3.innerHTML = `<button class="button-primary" onclick="proposeToVoteOutButtonClicked('${eachAdmin}')">Propose to vote out</button>`;
                    }else {
                      cell3.innerHTML = `<div> Current proposal - ${res} </div>`
                      cell3.innerHTML += `<button class="button-primary" onclick="voteForAdminButtonClicked('${eachAdmin}', '${res}')">Yes</button>`;
                      cell3.innerHTML += `<button class="button-primary" onclick="voteAgainstAdminButtonClicked('${eachAdmin}', '${res}')">No</button>`;
                    }
                   })
                  }else{
                    cell3.innerHTML += `<button class="button-disabled">Removed</button>`;
                  }
                });
              }
            });

            if (!userIsAdmin) {
              //document.getElementById("validatorTab").style.display = "none";
              document.getElementById("aliasContainer").style.display = "none";
            }

            // Add a list of this accounts validators
            if (result.includes(currentAccount)) {
              var addAdminRow = table.insertRow(-1);

              var addAdminAccountCell = addAdminRow.insertCell(0);
              addAdminAccountCell.innerHTML = `<input id="addAdminAccountInput" class="u-full-width" type="text" placeholder="Ex: 0x17Bf5e7b3CE6779DBaeDEB907010601A8c1e3118">`;

              var addAdminAliasCell = addAdminRow.insertCell(1);
              addAdminAliasCell.innerHTML = `<input id="addAdminAliasInput" class="u-full-width" type="text" placeholder="Ex: Admin 2">`;

              var addAdminButtonCell = addAdminRow.insertCell(2);
              addAdminButtonCell.innerHTML = `<button class="button-primary" onclick="addAdminButtonClicked()">Propose to add</button>`;
            }
              // Add validators for this account 
              simpleHelper.GetValidatorsForAdmin(currentAccount, (validatorsResult) => {
                var validatorsTable = document.getElementById("validatorsTable");
                validatorsResult.forEach(eachValidator => {
                  if(eachValidator.toLowerCase() === currentAccount.toLowerCase()) return;

                  var newRow = validatorsTable.insertRow(-1);
                  var accountCell = newRow.insertCell(0);
                  accountCell.innerHTML = eachValidator;
                  var accountActionCell = newRow.insertCell(1);
                  simpleHelper.isActiveValidator(currentAccount, eachValidator, (err, data) => {
                    if(data) {
                      simpleHelper.hasProposal(currentAccount, eachValidator, (err, res) => {
                        if(res.toLowerCase() == "remove") {
                          accountActionCell.innerHTML = `<div> Current proposal - ${res} </div>`;
                          accountActionCell.innerHTML += `<button class="button-primary" onclick="removeValidatorClicked('${eachValidator}')">Accept proposal</button>`;
                        }else{
                          accountActionCell.innerHTML = `<button class="button-primary" onclick="removeValidatorClicked('${eachValidator}')">Propose to remove</button>`;
                        }
                      })
                    }else{
                      accountActionCell.innerHTML = `<button class="button-disabled" onclick="addValidatorClicked('${accountCell.innerHTML}')">Propose to add</button>`;
                    }
                  });                  
                });

                // If there are less validators than max, then add the "addvalidator" form
                if (!validatorsResult || validatorsResult.length < validatorCapacity) {
                  var addValidatorRow = validatorsTable.insertRow(-1);

                  var addValidatorAccountCell = addValidatorRow.insertCell(0);
                  addValidatorAccountCell.innerHTML = `<input id="addValidatorAccountInput" class="u-full-width" type="text" placeholder="Ex: 0x17Bf5e7b3CE6779DBaeDEB907010601A8c1e3118">`;

                  var addValidatorButtonCell = addValidatorRow.insertCell(1);
                  addValidatorButtonCell.innerHTML = `<button class="button-primary" onclick="addValidatorClicked()">Add Validator</button>`;

                  if ('addressList' in baseNetworkInfo) {
                    consortiumValidatorAddresses = baseNetworkInfo.addressList.addresses
                    consortiumValidatorAddresses.forEach(function (eachAddress) {
                      if (!validatorsResult.includes(eachAddress)) {

                        console.log(`Potential Address: ${eachAddress}`);

                        addValidatorRow = validatorsTable.insertRow(-1);
                        var addPotentialValidatorAccountCell = addValidatorRow.insertCell(0);
                        addPotentialValidatorAccountCell.innerHTML = `${eachAddress}`;

                        var addPotentialValidatorButtonCell = addValidatorRow.insertCell(1);
                        addPotentialValidatorButtonCell.innerHTML = `<button class="button-primary" onclick="addValidatorClicked('${eachAddress}')">Add Validator</button>`;
                      }
                    });
                  }

                }
              });
            

            helper.GetProposedAdminsAsync((result) => {
              // Add rows to the adminTable
              var table = document.getElementById("proposedAdminTable");

              if (!result || result.length < 1) {
                document.getElementById("proposeAdminTable").style.display = "none";
              }
              else {
                result.forEach(eachAdmin => {
                  // Create an empty <tr> element and add it to the last position of the table:
                  var adminRow = table.insertRow(-1);
                  // Add the admin account number
                  var cell1 = adminRow.insertCell(0);
                  cell1.innerHTML = eachAdmin;

                  // Add the admin's alias
                  var cell2 = adminRow.insertCell(1);
                  cell2.id = `AliasCell-${eachAdmin}`
                  cell2.innerHTML = "Loading";
                  helper.GetAliasForAdmin(eachAdmin, (aliasResult) => {
                    var aliasCell = document.getElementById(`AliasCell-${eachAdmin}`);
                    aliasCell.innerHTML = aliasResult;
                  });

                  // Add Vote Against Button if not the current account and is existing admin
                  if (userIsAdmin && currentAccount != eachAdmin) {
                    var cell3 = adminRow.insertCell(2);
                    cell3.id = `VoteFor-${eachAdmin}`;
                    cell3.innerHTML = `<button class="button-primary" onclick="voteForProposedAdminButtonClicked('${eachAdmin}')">Vote For</button>`;
                  }
                });
              }

              isLoaded = true;
            });
          });
        };
        networkInfoRequest.send(null);

      } else {
        console.log('No web3? You should consider trying MetaMask!')
      }
    })

    function addAdminButtonClicked() {
      submittingTransaction();
      var adminAccount = document.getElementById("addAdminAccountInput").value;
      var adminAlias = document.getElementById("addAdminAliasInput").value;
      document.getElementById("addAdminAccountInput").value = "";
      document.getElementById("addAdminAliasInput").value = "";
      console.log(`Proposing to add ${adminAccount} as a new administrator`);

      helper.proposalToAddAdmin(currentAccount, adminAccount, "", function (err, result) {
        if (err) {
          showError("Transaction cancelled");
          return;
        }
        console.log(`Proposed Admin Transaction #: ${result}`);
        submittedTransaction(result.transactionHash);
      });
    }

    function proposeToVoteOutButtonClicked(adminAccount) {
      submittingTransaction();
      console.log(`Proposal to vote out ${adminAccount}`);

      helper.proposalToRemoveAdmin(currentAccount, adminAccount, "", (err, result) => {
          if (err != null) {
          showError("Transaction cancelled");
          return;
        }
        console.log(`Proposal to vote out, Transaction #: ${result}`);
        submittedTransaction(result.transactionHash);
      })
    }

    function voteForAdminButtonClicked(adminAccount, action) {
      submittingTransaction();
      console.log(`Voting for ${adminAccount} for ${action}`);

      if(action == "remove") {
        helper.voteForRemovingAdmin(currentAccount, adminAccount, pk, function (error, result) {
          if (error) {
            showError("Transaction cancelled");
            return;
          }
          console.log(`Voted For ${action}, Transaction #: ${result}`);
          submittedTransaction(result);
        });

      }else if(action == "add") {
        helper.voteForAddingAdmin(currentAccount, adminAccount, pk, function (error, result) {
          if (error) {
            showError("Transaction cancelled");
            return;
          }
          console.log(`Voted For ${action}, Transaction #: ${result}`);
          submittedTransaction(result);
        });
      }
    }

    function voteAgainstAdminButtonClicked(adminAccount, action) {
      submittingTransaction();
      console.log(`Voting against ${adminAccount} for ${action}`);

      if(action == "remove") {
        helper.voteAgainstRemovingAdmin(currentAccount, adminAccount, "", function (error, result) {
          if (error) {
            showError("Transaction cancelled");
            return;
          }
          console.log(`Voted Against ${action}, Transaction #: ${result}`);
          submittedTransaction(result);
        });
      }
      else if(action == "add") {
          helper.voteAgainstAddingAdmin(currentAccount, adminAccount, "", function (error, result) {
          if (error) {
            showError("Transaction cancelled");
            return;
          }
          console.log(`Voted Against ${action}, Transaction #: ${result}`);
          submittedTransaction(result);
        });
      }
    }

    function voteForProposedAdminButtonClicked(adminAccount) {
      submittingTransaction();
      console.log(`Voting for ${adminAccount}`);
      helper.VoteForProposedAdminAsync(adminAccount, function (error, result) {
        if (error) {
          showError("Transaction cancelled");
          return;
        }
        console.log(`Voted for transaction #: ${result}`);
        submittedTransaction(result);
      });
    }

    function addValidatorClicked(validatorAccount) {
      simpleHelper.GetValidatorsForAdmin(currentAccount, validators => {
        if (!validatorAccount) {
          validatorAccount = document.getElementById("addValidatorAccountInput").value;
        }
        console.log(`User wishes to add: ${validatorAccount} as a new validator`);

        submittingTransaction();
        {{!-- fetch('/pk?acc='+currentAccount)
        .then(data => {
          data.text().then(function(pk){ --}}

             simpleHelper.addValidator(currentAccount, validatorAccount, "", function (error, result) {
              if (error) {
                showError("Transaction cancelled");
                return;
              }
              console.log(`Added validator at transaction #: ${result}`);
              submittedTransaction(result.transactionHash);
            });

          {{!-- });
        });     --}}
      })
    }

    function removeValidatorClicked(validatorAccount) {
      submittingTransaction();
      console.log(`User wants to remove validator: ${validatorAccount}`);
      simpleHelper.RemoveValidator(currentAccount, validatorAccount, "", function (error, result) {
        if (error) {
          showError("Transaction cancelled");
          return;
        }
        console.log(`Remove validator vote against Transaction #: ${result}`);
        simpleHelper.ProposeRemoveValidatorFromChain(validatorAccount, (err, chain_result)=>{
          console.log("received results:removeIstanbulValidator");
          if(chain_result) {
            console.log("results", chain_result.result);
            submittedTransaction(result.transactionHash);
          }
          else if(err) {
            console.log("print result", err);
            showError("Transaction cancelled");
          }
        });
      });
    }

    function updateAliasClicked() {
      submittingTransaction();
      var newAlias = document.getElementById('aliasEditorText').value;
      console.log(`User wants to update alias: ${newAlias}`);
      helper.UpdateAliasAsync(newAlias, function (result, error) {
        if (typeof error != "undefined") {
          showError("Transaction cancelled");
          return;
        }
        console.log(`Alias updated: ${result}`);
        submittedTransaction(result);
      });
    }

    function submittingTransaction() {
      document.getElementById("failureStatus").style.display = "none";
      document.getElementById("transactionStatus").style.display = "block";
      document.getElementById("statusMessage").innerHTML = "Submitting transaction";
    }

    function submittedTransaction(txHash) {
      document.getElementById("failureStatus").style.display = "none";
      document.getElementById("transactionStatus").style.display = "block";
      document.getElementById("statusMessage").innerHTML = "Transaction submitted: " + txHash;
    }

    function showError(errorMessage) {
      document.getElementById("transactionStatus").style.display = "none";
      document.getElementById("failureStatus").style.display = "block";
      document.getElementById("errorMessage").innerHTML = errorMessage;
    }

    function showAdminTab() {
      document.getElementById('validatorContent').style.display = "none";
      document.getElementById('nodeStatusContent').style.display = "none";
      document.getElementById('adminContent').style.display = "block";
      document.getElementById('adminTab').classList.add("tabSelected");
      document.getElementById('validatorTab').classList.remove("tabSelected");
      document.getElementById('nodeStatusTab').classList.remove("tabSelected");
    }

    function showValidatorTab() {
      document.getElementById('adminContent').style.display = "none";
      document.getElementById('nodeStatusContent').style.display = "none";
      document.getElementById('validatorContent').style.display = "block";
      document.getElementById('adminTab').classList.remove("tabSelected");
      document.getElementById('validatorTab').classList.add("tabSelected");
      document.getElementById('nodeStatusTab').classList.remove("tabSelected");
    }

    function showNodeStatusTab() {
      document.getElementById('adminContent').style.display = "none";
      document.getElementById('validatorContent').style.display = "none";
      document.getElementById('nodeStatusContent').style.display = "block";
      document.getElementById('nodeStatusTab').classList.add("tabSelected");
      document.getElementById('adminTab').classList.remove("tabSelected");
      document.getElementById('validatorTab').classList.remove("tabSelected");
    }

    function showAliasEditor() {
      document.getElementById('aliasContainer').style.display = "none";
      document.getElementById('aliasEditor').style.display = "block";
      document.getElementById('aliasEditorText').focus();
    }

    function hideAliasEditor() {
      document.getElementById('aliasContainer').style.display = "block";
      document.getElementById('aliasEditor').style.display = "none";
    }

    function errorMessage(message) {
      document.getElementById("transactionStatus").style.display = "none";
      document.getElementById("failureStatus").style.display = "block";
      document.getElementById("errorMessage").innerHTML = message;
    }

    // Allows for spelling out of numerics
    var a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    var b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function inWords(num) {
      if ((num = num.toString()).length > 9) return 'overflow';
      n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return; var str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str;
    }

}