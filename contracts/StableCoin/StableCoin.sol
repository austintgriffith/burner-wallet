pragma solidity ^0.5.0;

import "node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract StableCoin is ERC20Mintable {

  string public name = "🐶 DAOG";
  string public symbol = "🐶";
  uint8 public decimals = 18;

  constructor() public {

  }

}
