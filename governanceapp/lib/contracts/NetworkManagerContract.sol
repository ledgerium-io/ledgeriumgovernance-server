pragma solidity ^0.5.1;

/**
 * @title The NetworkManagerContract contract maintains the list of all the peers with their node related details
 * 
 */
contract NetworkManagerContract {

    address private _owner;
    
    uint nodeCounter;
  
    struct NodeDetails {  
        string nodeId;
        string hostName;
        string role; 
        string ipAddress;
        string port;
        string publicKey;
        string enode;
    }

    bool private isInit; 								//To check if 3 initial owners are set or not already
    mapping (string => NodeDetails)nodes;
    string[] enodeList;
    
    //List of events
    event print(string nodeId, string hostName, string role, string ipAddress, string port, string publicKey, string enode);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @return the address of the owner.
     */
    function owner() public isInitalised view returns (address) {
        return _owner;
    }
    
    /**
    * @dev check whether msg.sender is owner
    */
	modifier onlyOwner() {
		// make sure only activeAdmin can operate
        require(msg.sender == _owner, "msg.sender is not owner!");
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
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public isInitalised onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
    
    /**
    * @dev Function to initiate contract with adding first 3 valid admins. The pre-deployed contract will be the owner
    * @return A success flag
    */
	function init() public ifNotInitalised {
		_owner = msg.sender;
        isInit = true;  //Important flag!
	}
    
    /**
    * @dev Function to register/add new peer node. It checks validity of msg.sender with isAdmin modifier
    * msg.sender will be made owner and any subsequent update node should be called by the smae admin
	* @param _nodeId nodeID of the added node
    * @param _hostName hostName of the added node
    * @param _role role of the added node, useful at the governance application level
    * @param _ipAddress ipAddress of the added node
    * @param _port Port of the added node
    * @param _publicKey publicKey, the coinbase ethereum account of the added node
    * @param _enode enode of the added node, useful at the blockchain GOSSIP nodes discovery
	* @return A success flag
    */
	function registerNode (
        string memory _nodeId,
        string memory _hostName, 
        string memory _role, 
        string memory _ipAddress, 
        string memory _port, 
        string memory _publicKey, 
        string memory _enode
        ) public onlyOwner isInitalised returns (bool) {

        // bytes memory tempEmptyStringTest = bytes(nodes[_enode].nodeId);
        // if (tempEmptyStringTest.length == 0)
        //     return false;
        nodes[_enode].nodeId = _nodeId;
        nodes[_enode].hostName = _hostName;
        nodes[_enode].role = _role;
        nodes[_enode].ipAddress = _ipAddress;
        nodes[_enode].port = _port;
        nodes[_enode].publicKey = _publicKey;
        enodeList.push(_enode);

        emit print(_nodeId, _hostName, _role, _ipAddress, _port, _publicKey, _enode);
        return true;
    }

    /**
    * @dev Function to updated existing peer node. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the original owner
    * enode and public key should not be changed in the Ledgerium node management context 
	* @param _nodeId nodeID of the added node
    * @param _hostName hostName of the added node
    * @param _role role of the added node, useful at the governance application level
    * @param _ipAddress ipAddress of the added node
    * @param _port Port of the added node
    * @param _publicKey publicKey, the coinbase ethereum account of the added node
    * @param _enode enode of the added node, useful at the blockchain GOSSIP nodes discovery
	* @return A success flag
    */
	function updateNode (
        string memory _nodeId,
        string memory _hostName, 
        string memory _role, 
        string memory _ipAddress, 
        string memory _port, 
        string memory _publicKey, 
        string memory _enode
        ) public onlyOwner isInitalised returns (bool) {
        
        // bytes memory tempEmptyStringTest = bytes(nodes[_enode].nodeId);
        // if (tempEmptyStringTest.length == 0)
        //     return false;
        nodes[_enode].nodeId = _nodeId;
        nodes[_enode].hostName = _hostName;
        nodes[_enode].role = _role;
        nodes[_enode].ipAddress = _ipAddress;
        nodes[_enode].port = _port;
        emit print(_nodeId, _hostName, _role, _ipAddress, _port, _publicKey, _enode);
        return true;
    }
   
    /**
    * @dev Function to return peer node details. It checks validity of msg.sender with isAdmin modifier
    * msg.sender address should be one of the active admin
    * not returning the ID of the node as it will be static
	* @param _index of the node from the nodelist
    * @return hostName of the peer node
	* @return role of the peer node
	* @return ipAddress of the peer node
	* @return port of the peer node
    * @return publicKey/coinbase ethereum account of the peer node
    * @return enode enode of the peer node
    */
    function getNodeDetails(uint16 _index) public isInitalised view returns (
                    //string memory nodeId,
                    string memory hostName, 
                    string memory role, 
                    string memory ipAddress, 
                    string memory port, 
                    string memory publicKey, 
                    string memory enode
                    ) {
        NodeDetails memory nodeInfo = nodes[enodeList[_index]];
        bytes memory tempEmptyStringTest = bytes(nodeInfo.nodeId);
        if (tempEmptyStringTest.length == 0)
            return ("","","","","","");
        return (
            //nodeInfo.nodeId,
            nodeInfo.hostName,
            nodeInfo.role,
            nodeInfo.ipAddress,
            nodeInfo.port,
            nodeInfo.publicKey,
            enodeList[_index]
            );
    }

    function getNodesCounter() public view returns (uint) {
        return enodeList.length;
    }
}
