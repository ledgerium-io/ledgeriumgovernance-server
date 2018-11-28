'use strict';
const Web3 = require('web3');
const AdminValidatorSet = require('./adminvalidatorset');

class AdminValidator{
    
    constructor(){
        this.adminValidatorSet = new AdminValidatorSet(web3, utils, "", undefined, Web3);
    }

    async setHelperParameters(adminValidatorSetAddress){
        let tranHash = await this.adminValidatorSet.setOwnersParameters(accountAddressList[0],privateKey[accountAddressList[0]],adminValidatorSetAddress);
        return tranHash;
    }
    
    async deployNewAdminSetValidatorContractWithPrivateKey(){
        let ethAccountToUse = accountAddressList[0];
        let privateKeyOwner = privateKey[ethAccountToUse];
        let otherAdminsList = [];
        // otherAdminsList.push(accountAddressList[1]);
        // otherAdminsList.push(accountAddressList[2]);
        var adminValrSetAddress = await this.adminValidatorSet.deployNewAdminSetValidatorContractWithPrivateKey(ethAccountToUse,privateKeyOwner,otherAdminsList);
        return adminValrSetAddress;
    }
    
    async runAdminTestCases(){
        console.log("****************** Running Admin Test cases ******************");
        console.log("****************** Start Admin Test cases ******************");
        var adminToAdd = accountAddressList[3];
        var flag = await this.addOneAdmin(adminToAdd);
        console.log("return flag for proposalToAddAdmin ",flag);

        adminToAdd = accountAddressList[4];
        flag = await this.addOneAdmin(adminToAdd);
        console.log("return flag for proposalToAddAdmin ",flag);

        var activeAdminList;
        activeAdminList = await this.getAllActiveAdmins();
        console.log("return list for getAllActiveAdmins",activeAdminList.length);

        var adminToRemove = accountAddressList[3];
        flag = await this.removeOneAdmin(adminToRemove);
        console.log("return flag for removeOneAdmin ",flag);

        activeAdminList = await this.getAllActiveAdmins();
        console.log("return list for getAllActiveAdmins",activeAdminList.length);
        
        console.log("****************** End Admin Test cases ******************");
        return true;
    }

    async runRemoveAdminTestCases(){
        console.log("****************** Running Remove Admin Test cases ******************");
        var activeAdminList = await this.getAllActiveAdmins();
        for(var indexAV = 1; indexAV < activeAdminList.length; indexAV++){
            let removeAdmin = activeAdminList[indexAV];
            let flag = await this.removeOneAdmin(removeAdmin);
            console.log("return flag for removeOneAdmin",flag);
            let activeAdminCurrentList = await this.getAllActiveAdmins();
            console.log("return list for updated getAllActiveAdmins",activeAdminCurrentList.length);
        }
        console.log("****************** End Remove Admin Test cases ******************");
        return true;
    }

    async getAllActiveAdmins(){
        var activeAdminList = [];
        try{
            var noOfActiveAdmin = 0;
            var adminList = [];
            adminList = await this.adminValidatorSet.getAllAdmins(accountAddressList[0]);
            if (adminList != undefined && adminList.length > 0) {
                for(var index = 0; index < adminList.length; index++ ){
                    var flag = await this.adminValidatorSet.isActiveAdmin(accountAddressList[0],adminList[index]);
                    if(flag){
                        noOfActiveAdmin++;
                        activeAdminList.push(adminList[index]);
                        console.log("admin[", noOfActiveAdmin,"] ",adminList[index]);
                    }
                }
                console.log("Number of active admins " + noOfActiveAdmin);
            }
        }
        catch (error) {
            console.log("Error in AdminValidator:getAllActiveAdmins(): " + error);
        }
        return activeAdminList;
    }

    async getAllAdmins(){
        var adminList = [];
        try{
            adminList = await this.adminValidatorSet.getAllAdmins(accountAddressList[0]);
            if (adminList != undefined && adminList.length > 0) {
                for(var index = 0; index < adminList.length; index++ ){
                    console.log("admin[", index+1,"] ",adminList[index]);
                }
            }
            console.log("Number of admins " + adminList.length);
        }
        catch (error) {
            console.log("Error in AdminValidator:getAllAdmins(): " + error);
        }
        return adminList;
    }
    
    async addOneAdmin(adminToAdd){
        console.log("****************** Running addOneAdmin ******************");
        try{
            var ethAccountToPropose = accountAddressList[0];
            
            var flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "got added as admin ?", flag);
            if(flag)
            return true;

            /* Testing the functionality of adding or removing a admin with votes FOR and votes AGAINST.
            * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
            * Sending Proposal means, adding one vote to the proposal
            */
            
            /*We are testing ADD admin functionality here with one proposal FOR adding and one more vote FOR adding,
            * makes more than 3/2 brings this a majority and admin will be added. And proposal will be cleared off!
            * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
            */
            var transactionhash = await this.adminValidatorSet.proposalToAddAdmin(ethAccountToPropose,adminToAdd,privateKey[ethAccountToPropose]);
            console.log("submitted transactionhash ",transactionhash, "for proposal of adding ", adminToAdd, "by admin", ethAccountToPropose);

            /* Since ADD the admin proposal is raised, checkProposal should return "add"*/
            var whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "checked proposal for the admin ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            var votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

            /* Lets see who proposed this admin for adding*/
            var proposer = await this.adminValidatorSet.getProposer(ethAccountToPropose, adminToAdd);
            console.log(adminToAdd, "checked proposer for the admin ?", proposer);
            
            var activeAdminList = await this.getAllActiveAdmins();
            for(var indexAV = 0; indexAV < activeAdminList.length; indexAV++){
                if(ethAccountToPropose == activeAdminList[indexAV])
                    continue;
                let votingFor = activeAdminList[indexAV];
                /*We are now voting FOR removing admin*/
                transactionhash = await this.adminValidatorSet.voteForAddingAdmin(votingFor,adminToAdd,privateKey[votingFor]);
                console.log("submitted transactionhash ",transactionhash, "for voting for adding", adminToAdd, "by admin", votingFor);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToAdd);
                console.log(adminToAdd, "checked proposal for the admin ?", whatProposal);
                
                /* Lets see how voting looks at the moment! It should return 1,0*/
                let votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
                console.log(adminToAdd, "checked votes for removing as admin ?", votes[0], votes[1]);

                indexAV++;
                let votingAgainst = activeAdminList[indexAV];
                if(votingAgainst == undefined)
                    break;
                /* Lets see how voting looks at the moment! It should return 1,1*/
                transactionhash = await this.adminValidatorSet.voteAgainstAddingAdmin(votingAgainst, adminToAdd, privateKey[votingAgainst]);
                console.log("submitted transactionhash ",transactionhash, "against voting to add ", adminToAdd, "by admin", votingAgainst);
                
                /* Lets see how voting looks at the moment! It should return 1,1*/
                votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose, adminToAdd);
                console.log(adminToAdd, "checked votes for removing as admin ?", votes[0], votes[1]);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToAdd);
                console.log(adminToAdd, "checked proposal for the admin ?", whatProposal);
                
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
            flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "got added as admin ?", flag);
            console.log("****************** Ending addOneAdmin ******************");
            return flag;
        }
        catch (error) {
            console.log("Error in AdminValidator:addOneAdmin(): " + error);
            return false;
        }
    }

    async removeOneAdmin(adminToRemove){
        console.log("****************** Running removeOneAdmin ******************");
        try{
            var ethAccountToPropose = accountAddressList[0];
            
            /* Testing the functionality of adding or removing a admin with votes FOR and votes AGAINST.
            * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
            * Sending Proposal means, adding one vote to the proposal
            */
            /* Lets see whether this is admin or not already, if not, we can ignore else will proceed further*/
            var flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "already an admin ?", flag);
            if(!flag) 
                return true;

            /*We are testing REMOVE admin functionality here with one proposal FOR removing and one more vote FOR removing,
            * makes more than 3/2 brings this a majority and admin will be removed. And proposal will be cleared off!
            * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
            */
            var transactionhash = await this.adminValidatorSet.proposalToRemoveAdmin(ethAccountToPropose,adminToRemove,privateKey[ethAccountToPropose]);
            console.log("submitted transactionhash ",transactionhash, "for proposal of removing ", adminToRemove, "by admin", ethAccountToPropose);

            /* Since REMOVE the admin proposal is raised, checkProposal should return "remove"*/
            var whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "checked proposal for the admin ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            var votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);

            /* Lets see who proposed this admin for removing*/
            var proposer = await this.adminValidatorSet.getProposer(ethAccountToPropose, adminToRemove);
            console.log(adminToRemove, "checked proposer for the admin ?", proposer);
            
            var activeAdminList = await this.getAllActiveAdmins();
            for(var indexAV = 0; indexAV < activeAdminList.length; indexAV++){
                if(ethAccountToPropose == activeAdminList[indexAV])
                    continue;
                let votingFor = activeAdminList[indexAV];
                /*We are now voting FOR removing admin*/
                transactionhash = await this.adminValidatorSet.voteForRemovingAdmin(votingFor,adminToRemove,privateKey[votingFor]);
                console.log("submitted transactionhash ",transactionhash, "for voting for removing", adminToRemove, "by admin", votingFor);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToRemove);
                console.log(adminToRemove, "checked proposal for the admin ?", whatProposal);
                
                /* Lets see how voting looks at the moment! It should return 1,0*/
                let votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
                console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);

                indexAV++;
                let votingAgainst = activeAdminList[indexAV];
                if(votingAgainst == undefined)
                    break;
                /* Lets see how voting looks at the moment! It should return 1,1*/
                transactionhash = await this.adminValidatorSet.voteAgainstRemovingAdmin(votingAgainst, adminToRemove, privateKey[votingAgainst]);
                console.log("submitted transactionhash ",transactionhash, "against voting to remove ", adminToRemove, "by admin", votingAgainst);
                
                /* Lets see how voting looks at the moment! It should return 1,1*/
                votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose, adminToRemove);
                console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToRemove);
                console.log(adminToRemove, "checked proposal for the admin ?", whatProposal);
                
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
            flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "still an admin ?", flag);
            console.log("****************** Ending removeOneAdmin ******************");
            return flag;
        }
        catch (error) {
            console.log("Error in AdminValidator:removeOneAdmin(): " + error);
            return false;
        }
    }

    async runClearProposalsAdminTestCases(){
        console.log("****************** Running Clear Proposal Test cases ******************");
        var adminList = await this.getAllAdmins();
        for(var indexAV = 1; indexAV < adminList.length; indexAV++){
            let admin = adminList[indexAV];
            let flag = await this.adminValidatorSet.clearProposal(accountAddressList[0],admin,privateKey[accountAddressList[0]]);
            console.log("return flag for clearing proposal for", admin,"is", flag);
            let adminCurrentList = await this.getAllAdmins();
            console.log("return list for updated getAllAdmins",adminCurrentList.length);
        }
        console.log("****************** End Clear Proposal Test cases ******************");
        return true;
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = AdminValidator;
}else{
    window.AdminValidator = AdminValidator;
}