pragma solidity ^0.5.1;
import "./AdminValidatorSet.sol";
import "./Voteable.sol";

/**
 * @title The SimpleValidatorSet contract maintains the set of validators and Allows
 * admins to add and remove members from the validator set
 */
contract SimpleValidatorSet is Voteable {

	enum Status {
		INACTIVE,
		PENDING,
		ACTIVE
	}

	struct Validator {
		bool isValidator;
		Status status;
	}

	AdminValidatorSet private adminSet;
	mapping (address => Validator) private activeValidators;
	mapping (address => address[]) private adminValidatorsMap;
	address[] private validators;
	mapping (address => bool) private exists;
	
	bool private isInit;			 //To check if 3 initial owners are set or not already
	uint32 private totalCount;		 //Total count of Simple Validators
	uint32 private totalActiveCount; //Total count of active Simple Validators

	//List of events
	event AddValidator(address indexed proposer, address indexed validator);
	event RemoveValidator(address indexed proposer, address indexed validator);

	event AlreadyProposalForAddingValidator(address indexed _address);
	event AlreadyProposalForRemovingValidator(address indexed _address);

	event NoProposalForAddingValidator(address indexed _address);
	event NoProposalForRemovingValidator(address indexed _address);

	event AlreadyActiveValidator(address indexed _address);
	event AlreadyInActiveValidator(address indexed _address);

	event MinValidatorNeeded(uint8 minNoOfValidator);

	/**
    * @dev check whether msg.sender is one of the active admin
    */
	modifier isAdmin() {
		require (adminSet.isActiveAdmin(msg.sender), "msg.sender is not active admin!");
		_;
	}

	/**
    * @dev check whether msg.sender is active validator or not
    */
	modifier isValidator() {
		require (activeValidators[msg.sender].isValidator, "msg.sender is not active validator!");
		_; 
	}

	/**
    * @dev check whether isInit is set true or not
    */
	modifier isInitalised() {
		// make sure isInit is set before any logical execution on the contract
        if(isInit){_;}
    }

	/**
    * @dev Ensure isInit is set before any logical execution on the contract
    */
	modifier ifNotInitalised() {
		// make sure isInit is set before any logical execution on the contract
        if(!isInit){_;}
    }

	/**
    * @dev Function to initiate contract with adding first 3 valid valdiators and the contract's owner. The pre-deployed contract will be the owner
    * @return A success flag
    */
	function init(address address1, address address2, address address3) public ifNotInitalised {
		address adminContractAddress = address(0x0000000000000000000000000000000000002018);
		address msg_sender = address1;
		address _validator1 = address2;
		address _validator2 = address3;
		
		adminSet = AdminValidatorSet(adminContractAddress);

		//Adding msg.sender as first validator
		exists[msg_sender] = true;
		adminValidatorsMap[msg_sender].push(msg_sender);
		activeValidators[msg_sender].isValidator = true;
		activeValidators[msg_sender].status = Status.ACTIVE;
		validators.push(msg_sender);

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
		isInit = true;	//Important flag!
	}
	
	/**
    * @dev Function to propose adding new validator. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin, who can start the proposal
	* @param _address address, which is to be added as new active admin
	* @return Emits event AlreadyActiveValidator() in case address already an active validator
	* @return Emits event AlreadyProposalForAddingValidator() in case some proposal already exists for adding
	* @return Emits event AlreadyProposalForRemovingValidator() in case some proposal already exists for removing
    * @return A success flag
    */
  	function proposalToAddValidator(address _address) public isAdmin isInitalised returns (bool) {
		//Lets check if the _address is already active!
		if(isActiveValidator(_address)){
			emit AlreadyActiveValidator(_address);
			return false;
		}
		if(votes[_address].proposal != Proposal.NOT_CREATED) {
			if(votes[_address].proposal == Proposal.ADD){
				emit AlreadyProposalForAddingValidator(_address);
				return false;
			}
			if(votes[_address].proposal == Proposal.REMOVE) {
				emit AlreadyProposalForRemovingValidator(_address);
				return false;
			}
		}
		votes[_address].proposal = Proposal.ADD;
		require (voteFor(_address,msg.sender), "voteFor function failed!");
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR adding one validator. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to add as active admin
    * @return Emits event NoProposalForAddingValidator() in case the ADD validator proposal is not started already
	* @return Emits event AddValidator() once valdiator is successfully added
	* @return A success flag
    */
	function voteForAddingValidator(address _address) public isValidator isInitalised returns (bool) {
		if(votes[_address].proposal != Proposal.ADD) {
			emit NoProposalForAddingValidator(_address);
			return false;
		}
		require(voteFor(_address,msg.sender), "voteFor function failed!");
		if(votes[_address].countFor >= totalActiveCount / 2 + 1) {
			if(!exists[_address]){
				adminValidatorsMap[msg.sender].push(_address);
				validators.push(_address);
				exists[_address] = true;
				totalCount = totalCount.add(1);
    		}		
    		activeValidators[_address].isValidator = true;
    		activeValidators[_address].status = Status.ACTIVE;
			totalActiveCount = totalActiveCount.add(1);
		    emit AddValidator(votes[_address].proposer, _address);
    		require(clearVotes(_address), "clearVotes function failed!");
		}	
		return true;
	}

	/**
    * @dev Function to vote AGAINST adding one validator. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to add as active admin
    * @return Emits event NoProposalForAddingValidator() in case the ADD validator proposal is not started already
	* @return A success flag
    */
	function voteAgainstAddingValidator(address _address) public isValidator isInitalised returns (bool) {
		if(votes[_address].proposal != Proposal.ADD) {
			emit NoProposalForAddingValidator(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender), "voteAgainst function failed!");
		if(votes[_address].countAgainst >= totalActiveCount / 2 + 1) {
			assert(clearVotes(_address));
		}
		return true;
	}
	
	/**
    * @dev Function to propose to remove one of the existing active validator.
	* msg.sender address should be one of the active admin, get validated with modifer isAdmin
	* System needs min 3 active admins for voting mechanism to function
    * @param _address address The address which is one of the admin.
    * @return A success flag
	* @return Emits event AlreadyInActiveValidator() in case the _address is already Inactive validator
	* @return Emits event MinValidatorNeeded() in case the no of existing active validators are less than 3
	* @return Emits event AlreadyProposalForAddingValidator() in case some proposal already exists for Adding
	* @return Emits event alreadyProposalForRemovingValidator() in case some proposal already exists for Removing
    */
  	function proposalToRemoveValidator(address _address) public isValidator isInitalised returns (bool) {
		//Lets check if the _address is already inActive!
		if(!isActiveValidator(_address)){
			emit AlreadyInActiveValidator(_address);
			return false;
		}
		if(totalActiveCount <= 3) {
			emit MinValidatorNeeded(3);
			return false;
		}
		if(votes[_address].proposal != Proposal.NOT_CREATED) {
			if(votes[_address].proposal == Proposal.ADD){
				emit AlreadyProposalForAddingValidator(_address);
				return false;
			}
			if(votes[_address].proposal == Proposal.REMOVE) {
				emit AlreadyProposalForRemovingValidator(_address);
				return false;
			}
		}
		votes[_address].proposal = Proposal.REMOVE;
		require (voteFor(_address,msg.sender), "voteFor function failed!");	
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR remving one active validatoe. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event NoProposalForRemovingValidator() in case the REMOVE validator proposal is not started already
	* @return Emits event RemoveValidator() once valdiator is successfully removed
	* @return A success flag
    */
	function voteForRemovingValidator(address _address) public isValidator isInitalised returns (bool) {
		if(votes[_address].proposal != Proposal.REMOVE) {
			emit NoProposalForRemovingValidator(_address);
			return false;
		}
		require(voteFor(_address,msg.sender), "voteFor function failed!");
		if(votes[_address].countFor >= totalActiveCount / 2 + 1) {
			activeValidators[_address].isValidator = false;
    		activeValidators[_address].status = Status.INACTIVE;
			totalActiveCount = totalActiveCount.sub(1);
			emit RemoveValidator(votes[_address].proposer, _address);
    		require(clearVotes(_address), "clearVotes function failed!");
		}	
		return true;
	}

	/**
    * @dev Function to vote AGAINST remving one active validatoe. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event NoProposalForRemovingValidator() in case the REMOVE validator proposal is not started already
	* @return A success flag
    */
	function voteAgainstRemovingValidator(address _address) public isValidator isInitalised returns (bool) {
		if(votes[_address].proposal != Proposal.REMOVE) {
			emit NoProposalForRemovingValidator(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender), "voteAgainst function failed!");
		if(votes[_address].countAgainst >= totalActiveCount / 2 + 1) {
			assert(clearVotes(_address));
		}
		return true;
	}
	
	/**
    * @dev Function to check current voting status. It checks validity of msg.sender with isValidator modifier
	* @param _address address
	* @return returns the bool
    */
	function checkVotes(address _address) public view isValidator returns (uint32[2] memory) {
		return internalCheckVotes(_address);
	}
	
	/**
    * @dev Function to check current proposal for the _address. It checks validity of msg.sender with isValidator modifier
	* @param _address address
	* @return returns the array of no of votes FOR and AGAINST
    */
	function checkProposal(address _address) public view isValidator returns (string memory) {
		return internalCheckProposal(_address);
	}

	/**
    * @dev Function to return list of all validators active/non-active against a specific admin
	* It checks validity of msg.sender with isAdmin modifier
	* @return returns the list
    */
	function getValidatorsForAdmin() public view isAdmin returns (address[]memory) {
	    return adminValidatorsMap[msg.sender];
	}

	/**
    * @dev Function to check whether _address is active validator or not
	* @param _address address
	* @return returns bool as active or non-active validator
    */
	function isActiveValidator(address _address) public view returns (bool) {
	    return activeValidators[_address].isValidator;
	}

	/**
    * @dev Function to return list of all validators active/non-active
	* @return returns the list
    */
	function getAllValidators() public view isValidator returns(address[] memory) {
	    return validators;
	}

	/**
    * @dev Function to get who all have voted for current proposal. It checks validity of msg.sender with isAdmin modifier
	* @return returns the array of no of votes FOR and AGAINST
    */
	function getVoted(address _address) public view isAdmin returns (address[] memory) {
	    return internalGetVoted(_address);
	}
	
	/**
    * @dev Function to get total admin
	* @return returns the number
    */
	function getValidatorsCount() public view isValidator returns (uint32) {
	    return totalCount;
	}

	/**
    * @dev Function to get total active validators
	* @return returns the number
    */
	function getActiveValidatorsCount() public view isValidator returns (uint32) {
	    return totalActiveCount;
	}

	/**
    * @dev Function to clear votes/proposal for the given address
	* @param _address address of the admin
	* @return returns the status true/false
    */
	function clearProposal(address _address) public isValidator isInitalised returns (bool) {
	    if(_address == address(0))
			return false;
		return clearVotes(_address);
	}

	/**
    * @dev Function to retrieve the proposer for the given address
	* @param _address address of the admin
	* @return returns the address of the proposer
    */
	function getProposer(address _address) public view isValidator isInitalised returns (address) {
	    if(_address == address(0))
			return address(0);
		return votes[_address].proposer;
	}
}
