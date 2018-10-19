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

	modifier isOwner() {
		require (adminSet.checkAdmin(msg.sender));
		_;
	}

	modifier isValidatorM() {
		require (activeValidators[msg.sender].isValidator);
		_;
	}

	event addvalidator(address validator,address _admin);
	event removevalidator(address validator,address _admin);
	event finalizeEvent(address validator,address _admin,string _event);

	function addValidator (address _address) public isValidatorM returns(bool res)  {
		assert (!activeValidators[_address].isValidator);
		assert (activeValidators[_address].status == Status.INACTIVE);
		assert (voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1){
    		if(!exists[_address]){
    				adminValidatorsMap[msg.sender].push(_address);
    				validators.push(_address);
					totalCount = totalCount.add(1);
    		}		
    		exists[_address] = true;
    		activeValidators[_address].isValidator = true;
			totalActiveCount = totalActiveCount.add(1);
    		//activeValidators[_address].lop = LastOp.ADD;
    		activeValidators[_address].status = Status.ACTIVE;
    		require(clearVotes(_address));
			votes[_address].proposal = Proposal.NOT_CREATED;
		    emit addvalidator(_address,msg.sender);
		}
		else {
			votes[_address].proposal = Proposal.ADD;
		}
		if(votes[_address].countAgainst >= totalActiveCount / 2 +1){
		    require(clearVotes(_address));
		}
		return true;
	}

	function removeValidator (address _address) public isValidatorM returns(bool res)  {
		assert (activeValidators[_address].isValidator);
		assert (activeValidators[_address].status == Status.ACTIVE);
		assert (voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1){
    		activeValidators[_address].isValidator = false;
    		//activeValidators[_address].lop = LastOp.REMOVE;
    		activeValidators[_address].status = Status.INACTIVE;
			totalActiveCount = totalActiveCount.sub(1);
    		require(clearVotes(_address));
			votes[_address].proposal = Proposal.NOT_CREATED;
    		emit removevalidator(_address,msg.sender);
		}
		else {
			votes[_address].proposal = Proposal.REMOVE;
		}
		if(votes[_address].countAgainst >= totalActiveCount / 2 +1){
		    require(clearVotes(_address));
		}
		return true;
	}

	/*function lastOp (address _address)public view isOwner returns(string res){
		if(activeValidators[_address].lop == LastOp.ADD){
			return "add";
		}
		else if(activeValidators[_address].lop == LastOp.REMOVE){
			return "remove";
		}else{
			return "no op";	
		}
	}*/

	function checkProposal (address _address) public view isValidatorM returns(string res){
		return internalCheckProposal(_address);
	}

	function getValidatorsForAdmin() public view isOwner returns (address[] a){
	    return adminValidatorsMap[msg.sender];
	}

	function isValidator(address _address) public view isValidatorM returns(bool a){
	    return activeValidators[_address].isValidator;
	}

	function getAllValidators()public view isValidatorM returns(address[] a){
	    return validators;
	}

	function getValidatorsCount()public view isValidatorM returns(uint32){
	    return totalCount;
	}

}
