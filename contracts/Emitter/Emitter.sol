pragma solidity 0.4.25;

contract Emitter {
    event FundsSent(uint time, address indexed sender, uint value); // shoudl I log the time???
    event FundsFlushed(uint time, address indexed pool, uint value);
    event PoolChanged(address indexed oldPool, address indexed newPool);

    address public poolOwner; // this is the address where the funds will be redirected for our liquidity pool
    constructor() public{
        poolOwner = msg.sender; // set the address of the pool owner
    }

    modifier isOwner(){
        require(msg.sender == poolOwner, "Only owner can call this function");
        _;
    }

    function goToETH() public payable{
        poolOwner.transfer(msg.value); // send the funds to our pool
        emit FundsSent(now, msg.sender, msg.value); // emit the event so that the service trigers the corresponding ETH transfer
    }

    function flush() isOwner public{
        poolOwner.transfer(address(this).balance); // send the funds to our pool
        emit FundsFlushed(now, poolOwner, address(this).balance); //
    }

    function updateOwner(address newPool) isOwner public{
        address oldPool = poolOwner;
        poolOwner = newPool;
        emit PoolChanged(oldPool, newPool);
    }
}
