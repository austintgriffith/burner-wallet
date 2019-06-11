pragma solidity ^0.4.24;

contract YourContract {

  string public YourVar = "HELLO WORLD";
  address public owner;
  mapping (uint256 => string) public chat;
  uint256 public messageCount;

  constructor() public {
    owner = msg.sender;
    messageCount = 0;
  }

  function updateVar(string newVal) public returns (bool) {
    require(msg.sender==owner,"YourContract::updateVar not owner");
    YourVar=newVal;
    return true;
  }

  function sendMessage(string message) public returns (bool) {
    chat[messageCount] = message;
    messageCount = messageCount + 1;
    return true;
  }

}
