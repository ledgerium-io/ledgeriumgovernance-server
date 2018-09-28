pragma solidity 0.4.24;
import "./Greeter.sol";

contract TestGreeter {

    uint32 myNumber;
    Greeter greeter;
    constructor (address _address) public
    {
        myNumber = 0;
        greeter = Greeter(_address);
    }
    
    function add(uint32 a, uint32 b) public 
    {
        myNumber = a + b;
        greeter.setMyNumber(myNumber);
    }

    function result() constant public returns (uint32) 
    {
        return greeter.getMyNumber();
    }
}