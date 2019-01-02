pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract DenDai is ERC20Mintable {

  string public name = "DenDai";
  string public symbol = "DEN";
  uint8 public decimals = 18;

  constructor() public {
    admin[msg.sender] = true;
  }

  mapping (address => bool) public admin;

  function updateAdmin(address newAdmin,bool active) public {
    require(admin[msg.sender], "DenDai::addAdmin - sender is not admin");
    admin[newAdmin] = active;
    UpdateAdmin(newAdmin,active,msg.sender);
  }
  event UpdateAdmin(address wallet,bool active,address sender);

  mapping (address => Vendor) public vendors;

  struct Vendor {
    bool isAllowed; //let's admin turn them off
    bytes32 name;
    bool isActive; //let's vendor indicate if they are open at the time
  }
  mapping (address => mapping (uint256 => Product)) public products;

  function addVendor(address wallet,bytes32 name) public {
    require(admin[msg.sender], "DenDai::addVendor - sender is not admin");
    vendors[wallet] = Vendor({
        isAllowed: true,
        name: name,
        isActive: false
    });
    emit UpdateVendor(wallet,vendors[wallet].name,vendors[wallet].isAllowed,vendors[wallet].isActive,msg.sender);
  }
  function updateVendor(address wallet, bytes32 name, bool newAllowed) public {
    require(admin[msg.sender], "DenDai::addVendor - sender is not admin");
    vendors[wallet].name = name;
    vendors[wallet].isAllowed = newAllowed;
    emit UpdateVendor(wallet,vendors[wallet].name,vendors[wallet].isAllowed,vendors[wallet].isActive,msg.sender);
  }
  function activateVendor(bool isActive) public {
    require(vendors[msg.sender].isAllowed, "DenDai::activateVendor - vendor is not allowed by admin");
    vendors[msg.sender].isActive = isActive;
    emit UpdateVendor(msg.sender,vendors[msg.sender].name,vendors[msg.sender].isAllowed,vendors[msg.sender].isActive,msg.sender);
  }
  event UpdateVendor(address indexed wallet,bytes32 name,bool isAllowed,bool isActive,address sender);

  struct Product {
    bool exists;
    bytes32 name;
    uint256 cost;
    bool isAvailable;
  }

  function addProduct(uint256 id, bytes32 name, uint256 cost, bool isAvailable) public {
    require(vendors[msg.sender].isAllowed, "DenDai::addProduct - vendor is not allowed by admin");
    products[msg.sender][id] = Product({
      exists:true,
      name:name,
      cost:cost,
      isAvailable:isAvailable
    });
    emit AddProduct(msg.sender,id,name,cost,isAvailable);
  }
  event AddProduct(address indexed vendor, uint256 id, bytes32 name, uint256 cost, bool isAvailable);





  /*
  mapping (address => uint256) public replayNonce;

  function metaTransfer(bytes signature, address to, uint256 value, uint256 nonce, uint256 reward) public returns (bool) {
    bytes32 metaHash = metaTransferHash(to,value,nonce,reward);
    address signer = getSigner(metaHash,signature);
    //make sure signer doesn't come back as 0x0
    require(signer!=address(0));
    require(nonce == replayNonce[signer]);
    replayNonce[signer]++;
    _transfer(signer, to, value);
    if(reward>0){
      _transfer(signer, msg.sender, reward);
    }
  }
  function metaTransferHash(address to, uint256 value, uint256 nonce, uint256 reward) public view returns(bytes32){
    return keccak256(abi.encodePacked(address(this),"metaTransfer", to, value, nonce, reward));
  }

  function getSigner(bytes32 _hash, bytes _signature) internal pure returns (address){
    bytes32 r;
    bytes32 s;
    uint8 v;
    if (_signature.length != 65) {
      return address(0);
    }
    assembly {
      r := mload(add(_signature, 32))
      s := mload(add(_signature, 64))
      v := byte(0, mload(add(_signature, 96)))
    }
    if (v < 27) {
      v += 27;
    }
    if (v != 27 && v != 28) {
      return address(0);
    } else {
      return ecrecover(keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)
      ), v, r, s);
    }
  }*/

}
