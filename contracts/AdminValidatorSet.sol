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

	address[] admins;
	mapping (address => bool) exists;

	modifier isOwner() {
		// make sure only owner can add or remove admins
        require(owners[msg.sender]);
        _;
    }

	constructor (address owner1,address owner2) public {
		// make sure that there are minimum of 3 admins to vote for/against
		owners[msg.sender] = true;
		owners[owner1] = true;
		owners[owner2] = true;
		admins.push(msg.sender);
		admins.push(owner1);
		admins.push(owner2);
		exists[msg.sender] = true;
		exists[owner1] = true;
		exists[owner2] = true;
		totalCount = 3;
	}

	event votedfor(address by,address vfor);
	event votedagainst(address by,address vfor);

	function proposalToRemoveAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.NOT_CREATED);
		votes[_address].proposal = Proposal.REMOVE;
		require (voteFor(_address,msg.sender));
		return true;
	}

	function proposalToAddAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.NOT_CREATED);
		votes[_address].proposal = Proposal.ADD;
		require (voteFor(_address,msg.sender));
		return true;
	}

	function voteForAddingAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.ADD);
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalCount / 2 + 1){
			owners[_address] = true;
			totalCount = totalCount.add(1);
			if(!exists[_address])
				exists[_address] = true;
			admins.push(_address);
			require(clearVotes(_address));
		}
		return true;
	}

	function voteForRemovingAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.REMOVE);
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalCount / 2 + 1){
			owners[_address] = false;
			totalCount = totalCount.sub(1);
			require(clearVotes(_address));
		}
		return true;
	}

	function voteAgainstAddingAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.ADD);
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalCount / 2 + 1){
			assert(clearVotes(_address));
		}
		return true;
	}

	function voteAgainstRemovingAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.REMOVE);
		require(voteAgainst(_address,msg.sender));
		if(votes[_address].countAgainst >= totalCount / 2 + 1){
			assert(clearVotes(_address));
		}
		return true;
	}

	function changeVote (address _address) public isOwner returns(bool res){
		require(internalChangeVote(_address));
		uint32 cfor = votes[_address].countFor;
		uint32 cagainst = votes[_address].countAgainst;
		if(votes[_address].vote[msg.sender] == Decision.FOR){
			if(cagainst >= totalCount / 2 + 1){
				require(clearVotes(_address));
			}
		}
		else{
			if(cfor >= totalCount / 2 + 1){
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

	function checkAdmin(address _address) public view returns(bool){
	    return owners[_address];
	}

	function getAllAdmins () public view returns(address[] res){
		return admins;
	}

	function checkVotes (address _address) public view isOwner returns(uint32[2] res){
		return internalCheckVotes(_address);
	}

	function checkProposal (address _address) public view isOwner returns(string res){
		return internalCheckProposal(_address);
	}

	function getVoted(address _address)public view isOwner returns(address[]){
	    return internalGetVoted(_address);
	}
	
	function getTotalCount()public view returns(uint32){
	    return totalCount;
	}
	
}
