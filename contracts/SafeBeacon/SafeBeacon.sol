pragma solidity ^0.5.0;

contract SafeBeacon {

  constructor() public {

  }

  function update(address account, address safe, uint256 mode) public {
    emit SafeUpdate(account, safe, mode, msg.sender);
  }
  event SafeUpdate(address indexed account, address indexed safe, uint256 mode, address sender);

}
