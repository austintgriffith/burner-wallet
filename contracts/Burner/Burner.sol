pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Burner is ERC20, Ownable {
  address public vendingMachine;
  string public name;
  string public symbol;
  uint8 public decimals = 18;

  constructor(string memory _name, string memory _symbol) public {
    name = _name;
    symbol = _symbol;
  }

  modifier onlyVendingMachine() {
    require(msg.sender == vendingMachine);
    _;
  }

  //to emulate how we send data with a transaction, we do that here on a token transfer to enable similar chat in the burner
  function transferWithData(address to, uint256 value, bytes data) public returns (bool) {
    emit TransferWithData(msg.sender,to,value,data);
    return transfer(to, value);
  }
  event TransferWithData(address indexed from, address indexed to, uint256 value, bytes data);

  //Ideally the Vending Machine would actually create the ERC20Vendable,
  //and we could make mint and burn onlyCreator.
  //However, to get the ERC20 contract deployed before we have all of the VendingMachine stuff ready,
  //the ability to change is required to allow us to keep iterating on the VendingMachine design
  function changeVendingMachine(address newVendingMachine) onlyOwner {
    vendingMachine = newVendingMachine;
  }

  /**
   * @dev Function to mint tokens
   * @param to The address that will receive the minted tokens.
   * @param amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address to, uint256 amount) public onlyVendingMachine returns (bool) {
    _mint(to, amount);
    return true;
  }

  /**
   * @dev Burns a specific amount of tokens.
   * This is different then the standard Burnable definition.
   * We only want the vending machine to be able to burn the tokens, but we don't want to require
   * the two step approve and burnFrom which the standard case would require.
   * @param from The address of which tokens should be burned away from.
   * @param value The amount of token to be burned.
   */
  function burn(address from, uint256 value) public onlyVendingMachine returns (bool) {
    _burn(from, value);
    return true;
  }
}
