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

	constructor (address _address)public {
		adminSet = AdminValidatorSet(_address);
	}

	modifier isOwner() {
		require (adminSet.checkAdmin(msg.sender));
		_;
	}

	event addvalidator(address validator,address _admin);
	event removevalidator(address validator,address _admin);
	event finalizeEvent(address validator,address _admin,string _event);

	function addValidator (address _address)public isOwner returns(bool res)  {
		assert (!activeValidators[_address].isValidator);
		assert (activeValidators[_address].status == Status.INACTIVE);
		assert (voteFor(_address,msg.sender));
		if(votes[_address].countFor >= adminSet.getTotalCount() / 2 + 1){
    		if(!exists[_address]){
    				adminValidatorsMap[msg.sender].push(_address);
    				validators.push(_address);
    		}		
    		exists[_address] = true;
    		activeValidators[_address].isValidator = true;
    		//activeValidators[_address].lop = LastOp.ADD;
    		activeValidators[_address].status = Status.ACTIVE;
    		require(clearVotes(_address));
		    emit addvalidator(_address,msg.sender);
		}
		if(votes[_address].countAgainst >= adminSet.getTotalCount() / 2 +1){
		    require(clearVotes(_address));
		}
		return true;
	}

	function removeValidator (address _address)public isOwner returns(bool res)  {
		assert (activeValidators[_address].isValidator);
		assert (activeValidators[_address].status == Status.ACTIVE);
		assert (voteFor(_address,msg.sender));
		if(votes[_address].countFor >= adminSet.getTotalCount() / 2 + 1){
    		activeValidators[_address].isValidator = false;
    		//activeValidators[_address].lop = LastOp.REMOVE;
    		activeValidators[_address].status = Status.INACTIVE;
    		require(clearVotes(_address));
    		emit removevalidator(_address,msg.sender);
		}
		if(votes[_address].countAgainst >= adminSet.getTotalCount() / 2 +1){
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

	function getValidatorsForAdmin() public view isOwner returns (address[] a){
	    return adminValidatorsMap[msg.sender];
	}

	function isValidator(address _address) public view isOwner returns(bool a){
	    return activeValidators[_address].isValidator;
	}

	function getAllValidators()public view isOwner returns(address[] a){
	    return validators;
	}

}
