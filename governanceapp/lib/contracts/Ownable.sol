pragma solidity ^0.5.1;

/**
 * @title The Ownable contract maintains the list of all the owner of the derived class
 */

contract Ownable {

	mapping (address => bool) internal owners;
	uint32 internal totalCount;

	/**
    * @dev check whether msg.sender is one of the active admin
    */
	modifier onlyOwner(address _address) { 
		require(owners[msg.sender]);
        _; 
	}

	event ownerAdded(address _address);
	event ownerRemoved(address _address);	
	
	/**
    * @dev adds Owner and emits ownerAdded event
	* @param _address address
	* @return A success flag
    */
	function addOwner(address _address) internal returns(bool) {
		owners[_address] = true;
		totalCount++;
		emit ownerAdded(_address);
		return true;
	}

	/**
    * @dev remove Owner and emits ownerRemoved event
	* @param _address address
	* @return A success flag
    */
	function removeOwner(address _address) internal returns(bool) {
		owners[_address] = false;
		totalCount--;
		emit ownerRemoved(_address);
		return true;
	}
}
