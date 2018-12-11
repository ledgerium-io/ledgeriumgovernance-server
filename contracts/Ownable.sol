pragma solidity 0.5.1;

contract Ownable {

	mapping (address => bool) owners;
	uint32 totalCount;

	modifier onlyOwner(address _address) { 
		require(owners[msg.sender]);
        _; 
	}

	event ownerAdded(address _address);
	event ownerRemoved(address _address);	
	
	function addOwner(address _address) internal returns(bool){
		owners[_address] = true;
		totalCount++;
		emit ownerAdded(_address);
		return true;
	}

	function removeOwner(address _address) internal returns(bool) {
		owners[_address] = false;
		totalCount--;
		emit ownerRemoved(_address);
		return false;
	}
	
}
