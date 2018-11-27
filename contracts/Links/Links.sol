pragma solidity ^0.4.24;

contract Links {

  constructor() public {

  }

  struct Fund {
    address sender;
    address signer;
    uint256 value;
    uint64 expires;
  }
  mapping (bytes32 => Fund) public funds;
  mapping (bytes32 => bool) public claimed;

  function send(bytes32 id, bytes sig) public payable returns(bool result){
    //make sure there isnt already a fund here
    require(funds[id].sender==address(0),"Links::send id already exists");
    require(!claimed[id],"Links::send id already claimed");
    //create hardcoded expires time for now
    uint64 expires = uint64(block.number+10);//expires in 100 blocks
    //create fund
    funds[id] = Fund({
      sender: msg.sender,
      signer: recoverSigner(id,sig),
      value: msg.value,
      expires: expires
    });
    //send out events for frontend parsing
    Send(id,msg.sender,msg.value,expires);
    return true;
  }
  event Send(bytes32 id,address indexed sender, uint256 value, uint64 expires);

  function claim(bytes32 id, bytes sig, address destination) public returns(bool result){
    //makes sure sig is correct
    //make sure there is fund here
    //make sure it hasn't expired
    require(isClaimValid(id,sig,destination),"Links::claim is not valid");
    require(!claimed[id],"Links::send id already claimed");
    //send out events for frontend parsing
    Claim(id,funds[id].sender,funds[id].value,destination);
    //save value in temp so we can destory before sending
    uint256 value = funds[id].value;
    //DESTROY object so it can't be claimed again
    delete funds[id];
    claimed[id] = true;
    //send funds to the destination (receiver)
    //destination.call.value(value).gas(msg.gas)();
    destination.transfer(value);
    return true;
  }
  event Claim(bytes32 id,address indexed sender, uint256 value, address indexed receiver);

  //this lets an off chain relayer make sure the claim is valid before submitting
  function isClaimValid(bytes32 id, bytes sig, address destination) public view returns(bool){
    //makes sure sig is correct
    return (
      recoverSigner(keccak256(destination),sig)==funds[id].signer &&
      funds[id].sender!=address(0) &&
      uint64(block.number)<=funds[id].expires
    );
  }

  function recoverSigner(bytes32 _hash, bytes _signature) internal view returns (address){
    bytes32 r;
    bytes32 s;
    uint8 v;
    // Check the signature length
    if (_signature.length != 65) {
      return address(0);
    }
    // Divide the signature in r, s and v variables
    // ecrecover takes the signature parameters, and the only way to get them
    // currently is to use assembly.
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      r := mload(add(_signature, 32))
      s := mload(add(_signature, 64))
      v := byte(0, mload(add(_signature, 96)))
    }
    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }
    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return address(0);
    } else {
      // solium-disable-next-line arg-overflow
      return ecrecover(keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)
      ), v, r, s);
    }
  }

}
