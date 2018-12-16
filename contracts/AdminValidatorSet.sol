pragma solidity 0.5.1;
import "./SafeMath.sol";
import "./Voteable.sol";

/**
 * @title The AdminValidatorSet contract maintains the list of all the admin with their vote
 * to add or remove a particular member as admin
 */
contract AdminValidatorSet is Voteable {

	using SafeMath for uint32;

	enum Status {
		INACTIVE,
		PENDING,
		ACTIVE
	}

	struct Admin {
		bool isActive;
		Status status;
	}
	
	bool private isInit; 								//To check if 3 initial owners are set or not already
	address[] private admins;
	mapping (address => Admin) private activeAdmins;
	mapping (address => bool) private exists;
	uint32 private totalCount;							//Total count of Admin Validators
	uint32 private totalActiveCount;					//Total count of active Admin Validators

	//List of events
	event AddAdmin(address indexed proposer, address indexed admin);
	event RemoveAdmin(address indexed proposer, address indexed admin);

	event AlreadyProposalForAddingAdmin(address indexed _address);
	event AlreadyProposalForRemovingAdmin(address indexed _address);

	event NoProposalForAddingAdmin(address indexed _address);
	event NoProposalForRemovingAdmin(address indexed _address);

	event AlreadyActiveAdmin(address indexed _address);
	event AlreadyInActiveAdmin(address indexed _address);

	event MinAdminNeeded(uint8 minNoOfAdmin);

	/**
    * @dev check whether msg.sender is one of the active admin
    */
	modifier isAdmin() {
		// make sure only activeAdmin can operate
        require(activeAdmins[msg.sender].isActive);
        _;
    }

	/**
    * @dev check whether isInit is set true or not
    */
	modifier isInitalised() {
		// make sure isInit flag is set before any logical execution on the contract
        if(isInit){_;}
    }

	/**
    * @dev Ensure isInit is set before any logical execution on the contract
    */
	modifier ifNotInitalised() {
		// 
        if(!isInit){_;}
    }

	/**
    * @dev Function to initiate contract with adding first 3 valid admins. The pre-deployed contract will be the owner
    * @return A success flag
    */
	function init() public ifNotInitalised {

		address msg_sender = address(0x44643353444f4b42b46ED28e668C204db6Dbb7c3);
		address _owner1 = address(0x43a69eDD54e07B95113FEd92e8c9ba004500Ce12);
		address _owner2 = address(0xd44b2838207A46F1007B3F296a599fADfb20978c);
		
		// make sure that there are minimum of 3 admins to vote for/against
		exists[msg_sender] = true;
		activeAdmins[msg_sender].isActive = true;
		activeAdmins[msg_sender].status = Status.ACTIVE;
		admins.push(msg_sender);

		exists[_owner1] = true;
		activeAdmins[_owner1].isActive = true;
		activeAdmins[_owner1].status = Status.ACTIVE;
		admins.push(_owner1);

		exists[_owner2] = true;
		activeAdmins[_owner2].isActive = true;
		activeAdmins[_owner2].status = Status.ACTIVE;
		admins.push(_owner2);
		
		totalCount = 3;
		totalActiveCount = 3;
		isInit = true;  //Important flag!
	}

	/**
    * @dev Function to propose adding new admin. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be added as new active admin
    * @return Emits event AlreadyActiveAdmin() in case the _address is already an active admin
	* @return Emits event AlreadyProposalForAddingAdmin() in case the ADD admin proposal is started already
	* @return Emits event AlreadyProposalForRemovingAdmin() in case the REMOVE admin proposal is started already
	* @return A success flag
    */
	function proposalToAddAdmin(address _address) public isAdmin isInitalised returns (bool) {

		//Lets check if the _address is already active!
		if(isActiveAdmin(_address)){
			emit AlreadyActiveAdmin(_address);
			return false;
		}

		if(votes[_address].proposal != Proposal.NOT_CREATED) {
			if(votes[_address].proposal == Proposal.ADD){
				emit AlreadyProposalForAddingAdmin(_address);
				return false;
			}
			if(votes[_address].proposal == Proposal.REMOVE) {
				emit AlreadyProposalForRemovingAdmin(_address);
				return false;
			}
		}
		votes[_address].proposal = Proposal.ADD;
		require (voteFor(_address,msg.sender));
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR adding new admin. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be added as new active admin
	* @return Emits event NoProposalForAddingAdmin() in case the ADD admin proposal is not started already
	* @return Emits event AddAdmin() in case the ADD admin is successfully completed
    * @return A success flag
    */
	function voteForAddingAdmin(address _address) public isAdmin isInitalised returns (bool) {

		if(votes[_address].proposal != Proposal.ADD) {
			emit NoProposalForAddingAdmin(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1) {
			if(!exists[_address]){
				admins.push(_address);
				exists[_address] = true;
				totalCount = totalCount.add(1);
    		}		
    		activeAdmins[_address].isActive = true;
    		activeAdmins[_address].status = Status.ACTIVE;
			totalActiveCount = totalActiveCount.add(1);
			emit AddAdmin(votes[_address].proposer, _address);
			require(clearVotes(_address));
		}
		return true;
	}

	/**
    * @dev Function to vote AGAINST adding new admin. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed as new active admin
    * @return Emits event NoProposalForAddingAdmin() in case the ADD admin proposal is not started already
	* @return A success flag
    */
	function voteAgainstAddingAdmin(address _address) public isAdmin isInitalised returns (bool) {

		if(votes[_address].proposal != Proposal.ADD) {
			emit NoProposalForAddingAdmin(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalActiveCount / 2 + 1) {
			assert(clearVotes(_address));
		}
		return true;
	}

	/**
    * @dev Function to propose to remove one of the existing active admin. It checks validity with isAdmin modifier
	* msg.sender address should be one of the active admin
	* System needs min 3 active admins for voting mechanism to function
    * @param _address address The address which is one of the admin.
    * @return A success flag
	* @return Emits event AlreadyInActiveAdmin() in case the _address is already Inactive admin
	* @return Emits event MinAdminNeeded() we need minimum 3 admins in the system, emit event in case it can bring this condition
	* @return Emits event AlreadyProposalForAddingAdmin() in case the ADD admin proposal is started already
	* @return Emits event AlreadyProposalForRemovingAdmin() in case the REMOVE admin proposal is started already
	* @return Emits event minAdminNeeded in case the no of existing active admins are less than 3
    */
  	function proposalToRemoveAdmin(address _address) public isAdmin isInitalised returns (bool) {
		
		//Lets check if the _address is already inActive!
		if(!isActiveAdmin(_address)){
			emit AlreadyInActiveAdmin(_address);
			return false;
		}
		if(totalActiveCount <= 3){
			emit MinAdminNeeded(3);
			return false;
		}	
		//require(votes[_address].proposal == Proposal.NOT_CREATED);
		if(votes[_address].proposal != Proposal.NOT_CREATED) {
			if(votes[_address].proposal == Proposal.ADD){
				emit AlreadyProposalForAddingAdmin(_address);
				return false;
			}
			if(votes[_address].proposal == Proposal.REMOVE) {
				emit AlreadyProposalForRemovingAdmin(_address);
				return false;
			}
		}
		votes[_address].proposal = Proposal.REMOVE;
		require (voteFor(_address,msg.sender));
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR remving one active admin. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event NoProposalForRemovingAdmin() in case the REMOVE admin proposal is not started already
	* @return Emits event RemoveAdmin() in case the REMOVE admin is successfully completed
	* @return A success flag
    */
	function voteForRemovingAdmin(address _address) public isAdmin isInitalised returns (bool) {

		if(votes[_address].proposal != Proposal.REMOVE){
			emit NoProposalForRemovingAdmin(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1) {
			activeAdmins[_address].isActive = false;
    		activeAdmins[_address].status = Status.INACTIVE;
			totalActiveCount = totalActiveCount.sub(1);
			emit RemoveAdmin(votes[_address].proposer, _address);
			require(clearVotes(_address));
		}
		return true;
	}

	/**
    * @dev Function to vote AGAINST Removing active admin. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event NoProposalForRemovingAdmin() in case the REMOVE admin proposal is not started already
	* @return A success flag
    */
	function voteAgainstRemovingAdmin(address _address) public isAdmin isInitalised returns (bool) {
		
		if(votes[_address].proposal != Proposal.REMOVE) {
			emit NoProposalForRemovingAdmin(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalActiveCount / 2 + 1) {
			assert(clearVotes(_address));
		}
		return true;
	}

	/**
    * @dev Function to check current voting status. It checks validity of msg.sender with isAdmin modifier
	* @param _address address
	* @return returns the array of no of votes FOR and AGAINST
    */
	function checkVotes(address _address) public view isAdmin returns (uint32[2] memory) {
		return internalCheckVotes(_address);
	}

	/**
    * @dev Function to check current proposal for the _address. It checks validity of msg.sender with isAdmin modifier
	* @param _address address
	* @return returns the current proposal i.e. add, remove or proposal not created
    */
	function checkProposal(address _address) public view isAdmin returns (string memory) {
		return internalCheckProposal(_address);
	}

	/**
    * @dev Function to check whether _address is active admin or not
	* @param _address address
	* @return returns bool as active or non-active admin/owner
    */
	function isActiveAdmin(address _address) public view returns (bool) {
	    return activeAdmins[_address].isActive;
	}

	/**
    * @dev Function to return list of all admins
	* @return returns the list
    */
	function getAllAdmins() public view returns (address[] memory) {
		return admins;
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
	function getAdminsCount() public view isAdmin returns (uint32) {
	    return totalCount;
	}
	
	/**
    * @dev Function to get total active admin
	* @return returns the number
    */
	function getActiveAdminsCount() public view isAdmin returns (uint32) {
	    return totalActiveCount;
	}

	/**
    * @dev Function to clear votes/proposal for the given address
	* @param _address address of the admin
	* @return returns the status true/false
    */
	function clearProposal(address _address) public isAdmin isInitalised returns (bool) {
	    if(_address == address(0))
			return false;
		return clearVotes(_address);
	}

	/**
    * @dev Function to retrieve the proposer for the given address
	* @param _address address of the admin
	* @return returns the address of the proposer
    */
	function getProposer(address _address) public view isAdmin isInitalised returns (address) {
	    if(_address == address(0))
			return address(0);
		return votes[_address].proposer;
	}
}
