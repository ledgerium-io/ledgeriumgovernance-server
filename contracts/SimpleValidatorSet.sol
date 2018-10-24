pragma solidity ^0.4.24;
import "./AdminValidatorSet.sol";
import "./Voteable.sol";

/**
 * The ValidatorSet contract maintains the set of validators and Allows
 * admins to add and remove members from the validator set
 */
contract SimpleValidatorSet is Voteable{

	enum Status {
		INACTIVE,
		PENDING,
		ACTIVE
	}

	struct Validator {
		bool isValidator;
		Status status;
	}

	AdminValidatorSet adminSet;

	mapping (address => Validator) activeValidators;
	mapping (address => address[]) adminValidatorsMap;
	address[] validators;
	mapping (address => bool) exists;
	
	uint32 totalCount;
	uint32 totalActiveCount;

	constructor (address _address, address _validator1, address _validator2)public {
		adminSet = AdminValidatorSet(_address);

		//Adding msg.sender as first validator
		exists[msg.sender] = true;
		adminValidatorsMap[msg.sender].push(msg.sender);
		activeValidators[msg.sender].isValidator = true;
		activeValidators[msg.sender].status = Status.ACTIVE;
		validators.push(msg.sender);

		//To add _validator1 as validator
		exists[_validator1] = true;
		adminValidatorsMap[_validator1].push(_validator1);
		activeValidators[_validator1].isValidator = true;
		activeValidators[_validator1].status = Status.ACTIVE;
		validators.push(_validator1);

		//To add _validator2 as validator
		exists[_validator2] = true;
		adminValidatorsMap[_validator2].push(_validator2);
		activeValidators[_validator2].isValidator = true;
		activeValidators[_validator2].status = Status.ACTIVE;
		validators.push(_validator2);

		totalCount = 3;
		totalActiveCount = 3;
	}

	modifier isAdmin() {
		require (adminSet.isActiveAdmin(msg.sender));
		_;
	}

	modifier isValidator() {
		require (activeValidators[msg.sender].isValidator);
		_;
	}

	event addValidator(address indexed validator,address _admin);
	event removeValidator(address indexed validator,address _admin);

	event votedfor(address by,address vfor);
	event votedagainst(address by,address vfor);

	event alreadyProposalForAddingValidator(address indexed _address);
	event alreadyProposalForRemovingValidator(address indexed _address);

	event noProposalForAddingValidator(address indexed _address);
	event noProposalForRemovingValidator(address indexed _address);

	function proposalToAddValidator (address _address) public isAdmin returns(bool res){
		//require(votes[_address].proposal == Proposal.NOT_CREATED);
		if(votes[_address].proposal != Proposal.NOT_CREATED){
			emit alreadyProposalForAddingValidator(_address);
			return false;
		}
		votes[_address].proposal = Proposal.ADD;
		require (voteFor(_address,msg.sender));
		return true;
	}

	function voteForAddingValidator (address _address) public isValidator returns(bool res){
		//require(votes[_address].proposal == Proposal.ADD);
		if(votes[_address].proposal != Proposal.ADD){
			emit noProposalForAddingValidator(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalCount / 2 + 1){
			if(!exists[_address]){
				adminValidatorsMap[msg.sender].push(_address);
				validators.push(_address);
				totalCount = totalCount.add(1);
    		}		
    		exists[_address] = true;
    		activeValidators[_address].isValidator = true;
    		activeValidators[_address].status = Status.ACTIVE;
			totalActiveCount = totalActiveCount.add(1);
    		require(clearVotes(_address));
		    emit addValidator(_address,msg.sender);
		}
		return true;
	}

	function voteAgainstAddingValidator (address _address) public isAdmin returns(bool res){
		//require(votes[_address].proposal == Proposal.ADD);
		if(votes[_address].proposal != Proposal.ADD){
			emit noProposalForAddingValidator(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalCount / 2 + 1){
			assert(clearVotes(_address));
		}
		return true;
	}
	
	function proposalToRemoveValidator (address _address) public isAdmin returns(bool res){
		//require(votes[_address].proposal == Proposal.NOT_CREATED);
		if(votes[_address].proposal != Proposal.NOT_CREATED){
			emit alreadyProposalForRemovingValidator(_address);
			return false;
		}
		votes[_address].proposal = Proposal.REMOVE;
		require (voteFor(_address,msg.sender));
		return true;
	}

	function voteForRemovingValidator (address _address) public isValidator returns(bool res){
		//require(votes[_address].proposal == Proposal.REMOVE);
		if(votes[_address].proposal != Proposal.REMOVE){
			emit noProposalForRemovingValidator(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalCount / 2 + 1){
			activeValidators[_address].isValidator = false;
    		activeValidators[_address].status = Status.INACTIVE;
			totalActiveCount = totalActiveCount.sub(1);
    		require(clearVotes(_address));
    		emit removeValidator(_address,msg.sender);
		}
		return true;
	}

	function voteAgainstRemovingValidator (address _address) public isAdmin returns(bool res){
		require(votes[_address].proposal == Proposal.REMOVE);
		if(votes[_address].proposal != Proposal.REMOVE){
			emit noProposalForRemovingValidator(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalCount / 2 + 1){
			assert(clearVotes(_address));
		}
		return true;
	}
	
	// function addValidator (address _address) public isValidator returns(bool res)  {
	// 	assert (!activeValidators[_address].isValidator);
	// 	assert (activeValidators[_address].status == Status.INACTIVE);
	// 	assert (voteFor(_address,msg.sender));
	// 	if(votes[_address].countFor >= totalActiveCount / 2 + 1){
    // 		if(!exists[_address]){
	// 			adminValidatorsMap[msg.sender].push(_address);
	// 			validators.push(_address);
	// 			totalCount = totalCount.add(1);
    // 		}		
    // 		exists[_address] = true;
    // 		activeValidators[_address].isValidator = true;
	// 		totalActiveCount = totalActiveCount.add(1);
    // 		//activeValidators[_address].lop = LastOp.ADD;
    // 		activeValidators[_address].status = Status.ACTIVE;
    // 		require(clearVotes(_address));
	// 		votes[_address].proposal = Proposal.NOT_CREATED;
	// 	    emit addvalidator(_address,msg.sender);
	// 	}
	// 	else {
	// 		votes[_address].proposal = Proposal.ADD;
	// 	}
	// 	if(votes[_address].countAgainst >= totalActiveCount / 2 +1){
	// 	    require(clearVotes(_address));
	// 	}
	// 	return true;
	// }

	// function removeValidator (address _address) public isValidator returns(bool res)  {
	// 	assert (activeValidators[_address].isValidator);
	// 	assert (activeValidators[_address].status == Status.ACTIVE);
	// 	assert (voteFor(_address,msg.sender));
	// 	if(votes[_address].countFor >= totalActiveCount / 2 + 1){
    // 		activeValidators[_address].isValidator = false;
    // 		//activeValidators[_address].lop = LastOp.REMOVE;
    // 		activeValidators[_address].status = Status.INACTIVE;
	// 		totalActiveCount = totalActiveCount.sub(1);
    // 		require(clearVotes(_address));
	// 		votes[_address].proposal = Proposal.NOT_CREATED;
    // 		emit removevalidator(_address,msg.sender);
	// 	}
	// 	else {
	// 		votes[_address].proposal = Proposal.REMOVE;
	// 	}
	// 	if(votes[_address].countAgainst >= totalActiveCount / 2 +1){
	// 	    require(clearVotes(_address));
	// 	}
	// 	return true;
	// }

	/*function lastOp (address _address)public view isAdmin returns(string res){
		if(activeValidators[_address].lop == LastOp.ADD){
			return "add";
		}
		else if(activeValidators[_address].lop == LastOp.REMOVE){
			return "remove";
		}else{
			return "no op";	
		}
	}*/

	function checkVotes (address _address) public view isValidator returns(uint32[2] res){
		return internalCheckVotes(_address);
	}
	
	function checkProposal (address _address) public view isValidator returns(string res){
		return internalCheckProposal(_address);
	}

	function getValidatorsForAdmin() public view isAdmin returns (address[] a){
	    return adminValidatorsMap[msg.sender];
	}

	function isActiveValidator(address _address) public view returns(bool a){
	    return activeValidators[_address].isValidator;
	}

	function getAllValidators()public view isValidator returns(address[] a){
	    return validators;
	}

	function getValidatorsCount()public view isValidator returns(uint32){
	    return totalCount;
	}

}
