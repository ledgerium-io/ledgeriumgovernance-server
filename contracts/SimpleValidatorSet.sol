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
	
	bool isInit;
	uint32 totalCount;
	uint32 totalActiveCount;

	event AddValidator(address indexed proposer, address indexed validator);
	event RemoveValidator(address indexed proposer, address indexed validator);

	event AlreadyProposalForAddingValidator(address indexed _address);
	event AlreadyProposalForRemovingValidator(address indexed _address);

	event NoProposalForAddingValidator(address indexed _address);
	event NoProposalForRemovingValidator(address indexed _address);

	event AlreadyActiveValidator(address indexed _address);
	event AlreadyInActiveValidator(address indexed _address);

	event MinValidatorNeeded(uint8 minNoOfValidator);

	modifier isAdmin() {
		require (adminSet.isActiveAdmin(msg.sender));
		_;
	}

	modifier isValidator() {
		require (activeValidators[msg.sender].isValidator);
		_; 
	}

	modifier isInitalised() {
		// make sure isInit is set before any logical execution on the contract
        if(isInit){_;}
    }

	modifier ifNotInitalised() {
		// make sure isInit is set before any logical execution on the contract
        if(!isInit){_;}
    }

	/**
    * @dev Function to initiate contract with adding first 3 valid valdiators and the contract's owner. The pre-deployed contract will be the owner
    * @return A success flag
    */
	function init() public ifNotInitalised {
		
		address adminContractAddress = address(0x0000000000000000000000000000000000002018);
		address msg_sender = address(0x44643353444f4b42b46ED28e668C204db6Dbb7c3);
		address _validator1 = address(0x43a69eDD54e07B95113FEd92e8c9ba004500Ce12);
		address _validator2 = address(0xd44b2838207A46F1007B3F296a599fADfb20978c);
		
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

		isInit = true;
	}
	
	/**
    * @dev Function to propose adding new validator. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin, who can start the proposal
	* @param _address address, which is to be added as new active admin
	* @return Emits event alreadyProposalForAddingValidator() in case some proposal already exists
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
		require (voteFor(_address,msg.sender));
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR adding one validator. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to add as active admin
    * @return Emits event noProposalForAddingValidator() in case the ADD validator proposal is not started already
	* @return Emits event addValidator() once valdiator is successfully added
	* @return A success flag
    */
	function voteForAddingValidator(address _address) public isValidator isInitalised returns (bool) {
		//require(votes[_address].proposal == Proposal.ADD);
		if(votes[_address].proposal != Proposal.ADD) {
			emit NoProposalForAddingValidator(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1) {
			if(!exists[_address]){
				adminValidatorsMap[msg.sender].push(_address);
				validators.push(_address);
				totalCount = totalCount.add(1);
    		}		
    		exists[_address] = true;
    		activeValidators[_address].isValidator = true;
    		activeValidators[_address].status = Status.ACTIVE;
			totalActiveCount = totalActiveCount.add(1);
		    emit AddValidator(votes[_address].proposer, _address);
    		require(clearVotes(_address));
		}	
		return true;
	}

	/**
    * @dev Function to vote AGAINST adding one validator. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to add as active admin
    * @return Emits event noProposalForAddingValidator() in case the ADD validator proposal is not started already
	* @return A success flag
    */
	function voteAgainstAddingValidator(address _address) public isValidator isInitalised returns (bool) {
		//require(votes[_address].proposal == Proposal.ADD);
		if(votes[_address].proposal != Proposal.ADD) {
			emit NoProposalForAddingValidator(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
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
	* @return Emits event MinValidatorNeeded() in case the no of existing active validators are less than 3
	* @return Emits event alreadyProposalForRemovingValidator() in case some proposal already exists
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
		//require(votes[_address].proposal == Proposal.NOT_CREATED);
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
		require (voteFor(_address,msg.sender));	
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR remving one active validatoe. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event noProposalForRemovingValidator() in case the REMOVE validator proposal is not started already
	* @return Emits event removeValidator() once valdiator is successfully removed
	* @return A success flag
    */
	function voteForRemovingValidator(address _address) public isValidator isInitalised returns (bool) {
		//require(votes[_address].proposal == Proposal.REMOVE);
		if(votes[_address].proposal != Proposal.REMOVE) {
			emit NoProposalForRemovingValidator(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1) {
			activeValidators[_address].isValidator = false;
    		activeValidators[_address].status = Status.INACTIVE;
			totalActiveCount = totalActiveCount.sub(1);
			emit RemoveValidator(votes[_address].proposer, _address);
    		require(clearVotes(_address));
		}	
		return true;
	}

	/**
    * @dev Function to vote AGAINST remving one active validatoe. It checks validity of msg.sender with isValidator modifier
    * msg.sender address should be one of the active validator
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event noProposalForRemovingValidator() in case the REMOVE validator proposal is not started already
	* @return A success flag
    */
	function voteAgainstRemovingValidator(address _address) public isValidator isInitalised returns (bool) {
		//require(votes[_address].proposal == Proposal.REMOVE);
		if(votes[_address].proposal != Proposal.REMOVE) {
			emit NoProposalForRemovingValidator(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
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
	function checkVotes(address _address) public view isValidator returns (uint32[2]) {
		return internalCheckVotes(_address);
	}
	
	/**
    * @dev Function to check current proposal for the _address. It checks validity of msg.sender with isValidator modifier
	* @param _address address
	* @return returns the array of no of votes FOR and AGAINST
    */
	function checkProposal(address _address) public view isValidator returns (string) {
		return internalCheckProposal(_address);
	}

	/**
    * @dev Function to return list of all validators active/non-active against a specific admin
	* It checks validity of msg.sender with isAdmin modifier
	* @return returns the list
    */
	function getValidatorsForAdmin() public view isAdmin returns (address[]) {
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
	function getAllValidators() public view isValidator returns(address[]) {
	    return validators;
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
	    if(_address==address(0))
			return false;
		return clearVotes(_address);
	}

	/**
    * @dev Function to retrieve the proposer for the given address
	* @param _address address of the admin
	* @return returns the address of the proposer
    */
	function getProposer(address _address) public view isValidator isInitalised returns (address) {
	    if(_address==address(0))
			return address(0);
		return votes[_address].proposer;
	}
}
