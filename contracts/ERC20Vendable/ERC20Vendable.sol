pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ERC20Vendable is ERC20, Ownable {
  address public vendingMachine;
  string public name;
  string public symbol;
  uint8 public decimals = 18;

  uint8 constant PRICEDEPTH = 64;
  uint256 constant public COSTMULTIPLIER = 10000000000000;
  uint8[] coinInventory = new uint8[](8);

  uint8 constant STARTING_VOL = 100;

  mapping (address => mapping (uint8 => uint8)) emojiBalance;

  constructor(string memory _name, string memory _symbol) public {
    name = _name;
    symbol = _symbol;

    coinInventory[0]=STARTING_VOL;
    coinInventory[1]=STARTING_VOL;
    coinInventory[2]=STARTING_VOL;
    coinInventory[3]=STARTING_VOL;
    coinInventory[4]=STARTING_VOL;
    coinInventory[5]=STARTING_VOL;
    coinInventory[6]=STARTING_VOL;
    coinInventory[7]=STARTING_VOL;
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


  function emojiBalanceOf(address addr,uint8 index) external view returns (uint8) {
    return emojiBalance[addr][index];
  }

  function getEmojiPrice(uint8 index) public view returns (uint16){
    uint256 x = 0;
    for(uint8 depth=PRICEDEPTH;depth>0;depth--){
      bytes32 blockHash = blockhash(block.number-depth);
      uint16 thisBlockValue = uint16(blockHash[index*2]) << 8 | uint16(blockHash[index*2+1]);
      x=x+(uint256(thisBlockValue));
    }
    return uint16(x/PRICEDEPTH);
  }

  function buyEmoji(uint8 index) public returns (bool){
    uint16 price = getEmojiPrice(index);
    uint256 fullPrice = price*COSTMULTIPLIER;

    transfer(address(this), fullPrice);
    require(coinInventory[index]>=1,"Emojicoin::buyEmoji");
    coinInventory[index] = coinInventory[index]--;

    emojiBalance[msg.sender][index]++;

    emit BuyEmoji(msg.sender,index,fullPrice);
    return true;
  }
  event BuyEmoji(address sender, uint8 index, uint256 fullPrice);


  function sellEmoji(uint8 index) public returns (bool){
    uint16 price = getEmojiPrice(index);
    uint256 fullPrice = price*COSTMULTIPLIER;


    require(emojiBalance[msg.sender][index]>0,"Emojicoin::sellEmoji emojiBalance is 0");

    this.transfer(msg.sender, fullPrice);
    coinInventory[index]++;
    emojiBalance[msg.sender][index]--;

    emit SellEmoji(msg.sender,index,fullPrice);
    return true;
  }
  event SellEmoji(address sender, uint8 index, uint256 fullPrice);

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
