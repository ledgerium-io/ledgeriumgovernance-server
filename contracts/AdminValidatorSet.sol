pragma solidity ^0.4.24;
import "./SafeMath.sol";
import "./Ownable.sol";
import "./Voteable.sol";

/**
 * The AdminSet contract maintains the list of all the admin with their vote
 * to add or remove a particular member as admin
 */
contract AdminValidatorSet is Voteable, Ownable {

	using SafeMath for uint32;

	bool isInit; 
	address[] admins;
	mapping (address => bool) exists;
	uint32 totalActiveCount; //

	modifier isOwner() {
		// make sure only owner can add or remove admins
        require(owners[msg.sender]);
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
    * @dev Function to deploy and construct adminvalidatorset. These addresses are hardcoded 
    */
	constructor () public {
	}

	function init () public ifNotInitalised{
		
		// make sure that there are minimum of 3 admins to vote for/against
		address msg_sender = address(0x44643353444f4b42b46ed28e668c204db6dbb7c3);
		address _owner1 = address(0x43a69edd54e07b95113fed92e8c9ba004500ce12);
		address _owner2 = address(0xd44b2838207a46f1007b3f296a599fadfb20978c);
		
		owners[msg_sender] = true;
		owners[_owner1] = true;
		owners[_owner2] = true;
		admins.push(msg_sender);
		admins.push(_owner1);
		admins.push(_owner2);
		exists[msg_sender] = true;
		exists[_owner1] = true;
		exists[_owner2] = true;
		totalActiveCount = 3;

		isInit = true;
	}

	event minAdminNeeded(uint8 minNoOfAdmin);

	event addAdmin(address indexed validator,address _admin);
	event removeAdmin(address indexed validator,address _admin);

	event votedfor(address indexed by,address vfor);
	event votedagainst(address indexed by,address vfor);
	
	event alreadyProposalForAddingAdmin(address indexed _address);
	event alreadyProposalForRemovingAdmin(address indexed _address);

	event noProposalForAddingAdmin(address indexed _address);
	event noProposalForRemovingAdmin(address indexed _address);

	event alreadyActiveAdmin(address indexed _address);
	event alreadyInActiveAdmin(address indexed _address);

	/**
    * @dev Function to propose adding new admin. It checks validity of msg.sender with isOwner modifier
    * msg.sender address should be one of the active admin
	* @return Emits event alreadyProposalForAddingAdmin() in case the ADD admin proposal is started already
	* @return Emits event alreadyProposalForRemovingAdmin() in case the REMOVE admin proposal is started already
	* @param _address address, which is to be added as new active admin
    * @return A success flag
    */
	function proposalToAddAdmin (address _address) public isOwner isInitalised returns(bool res){
		//require(votes[_address].proposal == Proposal.NOT_CREATED);
		if(votes[_address].proposal != Proposal.NOT_CREATED){
			if(votes[_address].proposal == Proposal.ADD){
				emit alreadyProposalForAddingAdmin(_address);
				return false;
			}
			if(votes[_address].proposal == Proposal.REMOVE){
				emit alreadyProposalForRemovingAdmin(_address);
				return false;
			}
		}
		votes[_address].proposal = Proposal.ADD;
		require (voteFor(_address,msg.sender));
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR adding new admin. It checks validity of msg.sender with isOwner modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be added as new active admin
	* @return Emits event noProposalForAddingAdmin() in case the ADD admin proposal is not started already
	* @return Emits event addAdmin() in case the ADD admin is successfully completed
    * @return A success flag
    */
	function voteForAddingAdmin (address _address) public isOwner isInitalised returns(bool res){
		//require(votes[_address].proposal == Proposal.ADD);
		if(votes[_address].proposal != Proposal.ADD){
			emit noProposalForAddingAdmin(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1){
			owners[_address] = true;
			totalActiveCount = totalActiveCount.add(1);
			if(!exists[_address])
				exists[_address] = true;
			admins.push(_address);
			require(clearVotes(_address));
			emit addAdmin(_address,msg.sender);
		}
		return true;
	}

	/**
    * @dev Function to vote AGAINST adding new admin. It checks validity of msg.sender with isOwner modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed as new active admin
    * @return Emits event noProposalForAddingAdmin() in case the ADD admin proposal is not started already
	* @return A success flag
    */
	function voteAgainstAddingAdmin (address _address) public isOwner isInitalised returns(bool res){
		//require(votes[_address].proposal == Proposal.ADD);
		if(votes[_address].proposal != Proposal.ADD){
			emit noProposalForAddingAdmin(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalActiveCount / 2 + 1){
			assert(clearVotes(_address));
		}
		return true;
	}

	/**
    * @dev Function to propose to remove one of the existing active admin. It checks validity with isOwner modifier
	* msg.sender address should be one of the active admin
	* System needs min 3 active admins for voting mechanism to function
    * @param _address address The address which is one of the admin.
    * @return A success flag
	* @return Emits event alreadyProposalForAddingAdmin() in case the ADD admin proposal is started already
	* @return Emits event alreadyProposalForRemovingAdmin() in case the REMOVE admin proposal is started already
	* @return Emits event minAdminNeeded in case the no of existing active admins are less than 3
    */
  	function proposalToRemoveAdmin (address _address) public isOwner isInitalised returns(bool res){
		if(totalActiveCount <= 3){
			emit minAdminNeeded(3);
			return false;
		}	
		//require(votes[_address].proposal == Proposal.NOT_CREATED);
		if(votes[_address].proposal != Proposal.NOT_CREATED){
			if(votes[_address].proposal == Proposal.ADD){
				emit alreadyProposalForAddingAdmin(_address);
				return false;
			}
			if(votes[_address].proposal == Proposal.REMOVE){
				emit alreadyProposalForRemovingAdmin(_address);
				return false;
			}
		}
		votes[_address].proposal = Proposal.REMOVE;
		require (voteFor(_address,msg.sender));
		votes[_address].proposer = msg.sender;
		return true;
	}

	/**
    * @dev Function to vote FOR remving one active admin. It checks validity of msg.sender with isOwner modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event noProposalForRemovingAdmin() in case the REMOVE admin proposal is not started already
	* @return Emits event removeAdmin() in case the REMOVE admin is successfully completed
	* @return A success flag
    */
	function voteForRemovingAdmin (address _address) public isOwner isInitalised returns(bool res){
		//require(votes[_address].proposal == Proposal.REMOVE);
		if(votes[_address].proposal != Proposal.REMOVE){
			emit noProposalForRemovingAdmin(_address);
			return false;
		}
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalActiveCount / 2 + 1){
			owners[_address] = false;
			totalActiveCount = totalActiveCount.sub(1);
			require(clearVotes(_address));
			emit removeAdmin(_address,msg.sender);
		}
		return true;
	}

	/**
    * @dev Function to vote AGAINST one active admin. It checks validity of msg.sender with isOwner modifier
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed to remove as active admin
    * @return Emits event noProposalForRemovingAdmin() in case the REMOVE admin proposal is not started already
	* @return A success flag
    */
	function voteAgainstRemovingAdmin (address _address) public isOwner isInitalised returns(bool res){
		//require(votes[_address].proposal == Proposal.REMOVE);
		if(votes[_address].proposal != Proposal.REMOVE){
			emit noProposalForRemovingAdmin(_address);
			return false;
		}
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalActiveCount / 2 + 1){
			assert(clearVotes(_address));
		}
		return true;
	}

	/**
    * @dev Function to change vote 
    * msg.sender address should be one of the active admin
	* @param _address address, which is to be proposed to remove as active admin
    * @return A success flag
    */
	function changeVote (address _address) public isOwner isInitalised returns(bool res){
		require(internalChangeVote(_address));
		uint32 cfor = votes[_address].countFor;
		uint32 cagainst = votes[_address].countAgainst;
		if(votes[_address].vote[msg.sender] == Decision.FOR){
			if(cagainst >= totalActiveCount / 2 + 1){
				require(clearVotes(_address));
			}
		}
		else{
			if(cfor >= totalActiveCount / 2 + 1){
				if(votes[_address].proposal == Proposal.ADD){
					owners[_address] = true;
				}else{
					owners[_address] = false;
				}
				require(clearVotes(_address));
			}
		}
		return true;
	}

	/**
    * @dev Function to check whether _address is active admin or not
	* @param _address address
	* @return returns bool as active or non-active admin/owner
    */
	function isActiveAdmin(address _address) public view returns(bool){
	    return owners[_address];
	}

	/**
    * @dev Function to return list of all admins
	* @return returns the list
    */
	function getAllAdmins () public view returns(address[] res){
		return admins;
	}

	/**
    * @dev Function to check current voting status. It checks validity of msg.sender with isOwner modifier
	* @param _address address
	* @return returns the bool
    */
	function checkVotes (address _address) public view isOwner returns(uint32[2] res){
		return internalCheckVotes(_address);
	}

	/**
    * @dev Function to check current proposal for the _address. It checks validity of msg.sender with isOwner modifier
	* @param _address address
	* @return returns the array of no of votes FOR and AGAINST
    */
	function checkProposal (address _address) public view isOwner returns(string res){
		return internalCheckProposal(_address);
	}

	/**
    * @dev Function to get who all have voted for current proposal. It checks validity of msg.sender with isOwner modifier
	* @return returns the array of no of votes FOR and AGAINST
    */
	function getVoted(address _address)public view isOwner returns(address[]){
	    return internalGetVoted(_address);
	}
	
	/**
    * @dev Function to get total active admin
	* @return returns the number
    */
	function getTotalActiveCount()public view returns(uint32){
	    return totalActiveCount;
	}

	/**
    * @dev Function to clear votes/proposal for the given address
	* @param _address address of the admin
	* @return returns the status true/false
    */
	function clearProposal(address _address)public isOwner isInitalised returns(bool res){
	    if(_address==address(0))
			return false;
		return clearVotes(_address);
	}
}
