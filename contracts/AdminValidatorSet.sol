pragma solidity ^0.4.24;
import "./SafeMath.sol";

/**
 * The AdminSet contract maintains the list of all the admin with their vote
 * to add or remove a particular member as admin
 */
contract AdminValidatorSet {

	using SafeMath for uint32;

	enum Decision {
		NOT_DECIDED,
		FOR,
		AGAINST
	}

	enum Proposal {
		NOT_CREATED,
		ADD,
		REMOVE
	}

	struct Vote {
		Proposal proposal;
		uint32 countFor;
		uint32 countAgainst;
		mapping (address => Decision) vote;
		address[] voted;
	}

	mapping (address => bool) owners;
	uint32 totalCount;
	mapping (address => Vote) votes;
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

	function voteFor (address _address,address voter) internal returns(bool) {
		require (votes[_address].vote[voter] == Decision.NOT_DECIDED);
		uint32 count = votes[_address].countFor.add(1);
		votes[_address].countFor = count;
		votes[_address].vote[voter] = Decision.FOR;
		votes[_address].voted.push(voter);
		emit votedfor(voter,_address);
		return true;
	}

	function voteAgainst (address _address,address voter) internal returns(bool) {
		require (votes[_address].vote[voter] == Decision.NOT_DECIDED);
		uint32 count = votes[_address].countAgainst.add(1);
		votes[_address].countAgainst = count;
		votes[_address].vote[voter] = Decision.AGAINST;
		votes[_address].voted.push(voter);
		return true;
	}

	function clearVotes (address _address)internal returns (bool){
		address[] memory list = votes[_address].voted;
		address[] memory empty;
		votes[_address].countFor = 0;
		votes[_address].countAgainst = 0;
		for (uint i = 0; i < list.length; i++) {
            votes[_address].vote[list[i]] = Decision.NOT_DECIDED;
        }
        votes[_address].proposal = Proposal.NOT_CREATED;
        votes[_address].voted = empty;
        return true;
	}

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
			totalCount++;
			if(!exists[_address]){
				exists[_address] = true;
				admins.push(_address);
			}	
			require(clearVotes(_address));
		}
		return true;
	}

	function voteForRemovingAdmin (address _address) public isOwner returns(bool res){
		require(votes[_address].proposal == Proposal.REMOVE);
		require(voteFor(_address,msg.sender));
		if(votes[_address].countFor >= totalCount / 2 + 1){
			owners[_address] = false;
        	totalCount--;
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
		require (votes[_address].vote[msg.sender] != Decision.NOT_DECIDED);
		require (votes[_address].proposal != Proposal.NOT_CREATED);
		uint32 cfor = votes[_address].countFor;
		uint32 cagainst = votes[_address].countAgainst;
		if(votes[_address].vote[msg.sender] == Decision.FOR){
			votes[_address].countFor = cfor.sub(1);
			votes[_address].countAgainst = cagainst.add(1);
			votes[_address].vote[msg.sender] = Decision.AGAINST;
			if(cagainst.add(1) >= totalCount / 2 + 1){
				require(clearVotes(_address));
			}
		}
		else{
			votes[_address].countFor = cfor.add(1);
			votes[_address].countAgainst = cagainst.sub(1);
			votes[_address].vote[msg.sender] = Decision.FOR;
			if(cfor.add(1) >= totalCount / 2 + 1){
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

	function checkVotes (address _address) public view isOwner returns(uint32[2] res){
		uint32[2] memory a;
		a[0] = votes[_address].countFor;
		a[1] = votes[_address].countAgainst;
		return a;
	}

	function checkProposal (address _address) public view isOwner returns(string res){
		if(votes[_address].proposal == Proposal.ADD)
			return "add";
		else if(votes[_address].proposal == Proposal.REMOVE)
			return "remove";
		else
			return "proposal not created";
	}

	function checkAdmin(address _address) public view returns(bool){
	    return owners[_address];
	}

	function getVoted(address _address)public view isOwner returns(address[]){
	    address[] memory arr = votes[_address].voted;
	    return arr;
	}

	function getAllAdmins () public view returns(address[] res){
		return admins;
	}
	
}