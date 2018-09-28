pragma solidity 0.4.24;

contract Mortal {
    /* Define variable owner of the type address */
    address public owner;

    /* This function is executed at initialization and sets the owner of the contract */
    constructor() public { owner = msg.sender; }

    /* Function to recover the funds on the contract */
    function kill() public { if (msg.sender == owner) selfdestruct(owner); }
}

contract Greeter is Mortal {
    /* Define variable greeting of the type string */
    string public greeting;
    uint32 public myNumber;

    /* This runs when the contract is executed */
    constructor(string _greeting) public {
        greeting = _greeting;
        myNumber = 0;
    }

    /* Main function */
    function greet() public view returns (string) {
        return greeting;
    }

    /* Main function */
    function getOwner() public view returns (address) {
        return owner;
    }

    /* Main function */
    function setMyNumber(uint32 value) public {
        myNumber = value;
    }

    /* Main function */
    function getMyNumber() public view returns (uint32) {
        return myNumber;
    }
}
