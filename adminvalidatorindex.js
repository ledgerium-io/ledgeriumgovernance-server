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
        var flag = await this.addNewAdmin(adminToAdd);
        console.log("return flag for proposalToAddAdmin ",flag);

        adminToAdd = accountAddressList[4];
        flag = await this.addNewAdmin(adminToAdd);
        console.log("return flag for proposalToAddAdmin ",flag);

        var activeAdminList;
        activeAdminList = await this.getAllAdmins();
        console.log("return list for getAllAdmins",activeAdminList.length);

        var adminToRemove = accountAddressList[3];
        flag = await this.removeOneAdmin(adminToRemove);
        console.log("return flag for removeOneAdmin ",flag);

        activeAdminList = await this.getAllAdmins();
        console.log("return list for getAllAdmins",activeAdminList.length);
        
        console.log("****************** End Admin Test cases ******************");
    }

    async runRemoveAdminTestCases(){
        console.log("****************** Running Remove Admin Test cases ******************");
        var activeAdminList = await this.getAllAdmins();
        for(var indexAV = 1; indexAV < activeAdminList.length; indexAV++){
            let removeAdmin = activeAdminList[indexAV];
            let flag = await this.removeOneAdmin(removeAdmin);
            console.log("return flag for removeOneAdmin",flag);
            let activeAdminCurrentList = await this.getAllAdmins();
            console.log("return list for updated getAllAdmins",activeAdminCurrentList.length);
        }
        console.log("****************** End Remove Admin Test cases ******************");
    }

    async getAllAdmins(){
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
            console.log("Error in AdminValidator:getAllAdmins(): " + error);
        }
        return activeAdminList;
    }

    async addNewAdmin(adminToAdd){
        try{
            var ethAccountToPropose = accountAddressList[0];
            
            var flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "got added as admin ?", flag);
            if(flag)
            return true;

            /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
            * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
            * Sending Proposal means, adding one vote to the proposal
            */
            
            /*We are testing ADD validator functionality here with one proposal FOR adding and one more vote FOR adding,
            * makes more than 3/2 brings this a majority and validator will be added. And proposal will be cleared off!
            * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
            */
            var transactionhash = await this.adminValidatorSet.proposalToAddAdmin(ethAccountToPropose,adminToAdd,privateKey[ethAccountToPropose]);
            console.log("submitted transactionhash ",transactionhash, "for proposal of adding ", adminToAdd);

            /* Since ADD the validator proposal is raised, checkProposal should return "add"*/
            var whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "checked proposal for the admin ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            var votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "checked votes for adding as admin ?", votes[0], votes[1]);

            var activeAdminList = await this.getAllAdmins();
            for(var indexAV = 0; indexAV < activeAdminList.length; indexAV++){
                if(ethAccountToPropose == activeAdminList[indexAV])
                    continue;
                let votingFor = activeAdminList[indexAV];
                /*We are now voting FOR removing validator*/
                transactionhash = await this.adminValidatorSet.voteForAddingAdmin(votingFor,adminToAdd,privateKey[votingFor]);
                console.log("submitted transactionhash ",transactionhash, "for voting for removing", adminToAdd);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToAdd);
                console.log(adminToAdd, "checked proposal for the validator ?", whatProposal);
                
                /* Lets see how voting looks at the moment! It should return 1,0*/
                let votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToAdd);
                console.log(adminToAdd, "checked votes for removing as validator ?", votes[0], votes[1]);

                indexAV++;
                let votingAgainst = activeAdminList[indexAV];
                if(votingAgainst == undefined)
                    break;
                /* Lets see how voting looks at the moment! It should return 1,1*/
                transactionhash = await this.adminValidatorSet.voteAgainstAddingAdmin(votingAgainst, adminToAdd, privateKey[votingAgainst]);
                console.log("submitted transactionhash ",transactionhash, "against voting to add ", adminToAdd);
                
                /* Lets see how voting looks at the moment! It should return 1,1*/
                votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose, adminToAdd);
                console.log(adminToAdd, "checked votes for removing as validator ?", votes[0], votes[1]);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToAdd);
                console.log(adminToAdd, "checked proposal for the validator ?", whatProposal);
                
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
            flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToAdd);
            console.log(adminToAdd, "got added as admin ?", flag);
            return flag;
        }
        catch (error) {
            console.log("Error in AdminValidator:addNewAdmin(): " + error);
            return false;
        }
    }

    async removeOneAdmin(adminToRemove){
        try{
            var ethAccountToPropose = accountAddressList[0];
            
            /* Testing the functionality of adding or removing a validator with votes FOR and votes AGAINST.
            * There are 3 admin in the beginning. More than 3/2 votes are needed to make any decision (FOR or AGINST)
            * Sending Proposal means, adding one vote to the proposal
            */
            /* Lets see whether this is admin or not already, if not, we can ignore else will proceed further*/
            var flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "already an admin ?", flag);
            if(!flag) 
                return true;

            /*We are testing REMOVE validator functionality here with one proposal FOR removing and one more vote FOR removing,
            * makes more than 3/2 brings this a majority and validator will be removed. And proposal will be cleared off!
            * voting AGAINST proposal will add the AGAINST number. FOR/AGAINST vote should get majority to do any final action
            */
            var transactionhash = await this.adminValidatorSet.proposalToRemoveAdmin(ethAccountToPropose,adminToRemove,privateKey[ethAccountToPropose]);
            console.log("submitted transactionhash ",transactionhash, "for proposal of removing ", adminToRemove);

            /* Since REMOVE the validator proposal is raised, checkProposal should return "remove"*/
            var whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "checked proposal for the admin ?", whatProposal);
            
            /* Lets see how voting looks at the moment! It should return 1,0*/
            var votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "checked votes for removing as admin ?", votes[0], votes[1]);

            var activeAdminList = await this.getAllAdmins();
            for(var indexAV = 0; indexAV < activeAdminList.length; indexAV++){
                if(ethAccountToPropose == activeAdminList[indexAV])
                    continue;
                let votingFor = activeAdminList[indexAV];
                /*We are now voting FOR removing validator*/
                transactionhash = await this.adminValidatorSet.voteForRemovingAdmin(votingFor,adminToRemove,privateKey[votingFor]);
                console.log("submitted transactionhash ",transactionhash, "for voting for removing", adminToRemove);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToRemove);
                console.log(adminToRemove, "checked proposal for the validator ?", whatProposal);
                
                /* Lets see how voting looks at the moment! It should return 1,0*/
                let votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose,adminToRemove);
                console.log(adminToRemove, "checked votes for removing as validator ?", votes[0], votes[1]);

                indexAV++;
                let votingAgainst = activeAdminList[indexAV];
                if(votingAgainst == undefined)
                    break;
                /* Lets see how voting looks at the moment! It should return 1,1*/
                transactionhash = await this.adminValidatorSet.voteAgainstRemovingAdmin(votingAgainst, adminToRemove, privateKey[votingAgainst]);
                console.log("submitted transactionhash ",transactionhash, "against voting to add ", adminToRemove);
                
                /* Lets see how voting looks at the moment! It should return 1,1*/
                votes = await this.adminValidatorSet.checkVotes(ethAccountToPropose, adminToRemove);
                console.log(adminToRemove, "checked votes for removing as validator ?", votes[0], votes[1]);

                whatProposal = await this.adminValidatorSet.checkProposal(ethAccountToPropose, adminToRemove);
                console.log(adminToRemove, "checked proposal for the validator ?", whatProposal);
                
                //Check if no of required votes (N/2+1) is already achieved, if so, the running proposal will be cleared off
                //if so, dont need to run the loop and break it now, to run further voting!
                if(whatProposal == "proposal not created")
                    break; 
            }
            flag = await this.adminValidatorSet.isActiveAdmin(ethAccountToPropose,adminToRemove);
            console.log(adminToRemove, "still an admin ?", flag);
            return flag;
        }
        catch (error) {
            console.log("Error in AdminValidator:removeOneAdmin(): " + error);
            return false;
        }
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = AdminValidator;
}else{
    window.AdminValidator = AdminValidator;
}