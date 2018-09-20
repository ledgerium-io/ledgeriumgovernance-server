pragma solidity ^0.4.24;
import "./AdminValidatorSet.sol";

/**
 * The ValidatorSet contract maintains the set of validators and Allows
 * admins to add and remove members from the validator set
 */
contract SimpleValidatorSet {

	enum Status {
		DISABLED,
		PENDING,
		ACTIVE
	}

	enum LastOp{
		NO_OP,
		REMOVE,
		ADD
	}

	struct Validator {
		bool isValidator;
		Status status;
		LastOp lop;
	}

	AdminValidatorSet adminSet;

	mapping (address => Validator) activeValidators;
	mapping (address => address[]) adminValidatorsMap;
	address[] validators;

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
		assert (activeValidators[_address].status == Status.DISABLED);
		adminValidatorsMap[msg.sender].push(_address);
		validators.push(_address);
		activeValidators[_address].isValidator = true;
		activeValidators[_address].lop = LastOp.ADD;
		activeValidators[_address].status = Status.PENDING;
		emit addvalidator(_address,msg.sender);
		return true;
	}

	function removeValidator (address _address)public isOwner returns(bool res)  {
		assert (activeValidators[_address].isValidator);
		assert (activeValidators[_address].status == Status.ACTIVE);
		activeValidators[_address].isValidator = false;
		activeValidators[_address].lop = LastOp.REMOVE;
		activeValidators[_address].status = Status.PENDING;
		emit removevalidator(_address,msg.sender);
		return true;
	}

	function finalize (address _address)public isOwner returns(bool res)  {
		assert (activeValidators[_address].status == Status.PENDING);
		if(activeValidators[_address].lop == LastOp.ADD){
			activeValidators[_address].status = Status.ACTIVE;
			emit finalizeEvent(_address,msg.sender,"add");
		}
		else{
			activeValidators[_address].status = Status.DISABLED;
			emit finalizeEvent(_address,msg.sender,"remove");
		}
		return true;
	}

	function lastOp (address _address)public view isOwner returns(string res){
		if(activeValidators[_address].lop == LastOp.ADD){
			return "add";
		}
		else if(activeValidators[_address].lop == LastOp.REMOVE){
			return "remove";
		}else{
			return "no op";
		}
	}

	function getValidatorsForAdmin() public view isOwner returns (address[] a){
	    return adminValidatorsMap[msg.sender];
	    /*address[10] memory temp;
	    address[] memory all = adminValidatorsMap[msg.sender];
	    uint j = 0;
	    for(uint i=0;i<all.length;i++){
	        if(activeValidators[all[i]].isValidator){
	            temp[i] = a[i];
	            j++;
	        }
	    }
	    return temp;*/
	}

	function isValidator(address _address) public view isOwner returns(bool a){
	    return activeValidators[_address].isValidator;
	}

	function getAllValidators()public view isOwner returns(address[] a){
	    return validators;
	    /*address[10] memory temp;
	    address[] memory all = validators;
	    uint j = 0;
	    for(uint i=0;i<all.length;i++){
	        if(activeValidators[all[i]].isValidator){
	            temp[j] = a[i];
	            j++;
	        }
	    }
	    return temp;*/
	}
}
