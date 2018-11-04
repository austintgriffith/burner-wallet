pragma solidity ^0.4.24;

contract Links {

  constructor() public {

  }

  struct Fund {
    address sender;
    uint256 value;
    uint64 expires;
  }
  mapping (bytes32 => Fund) public funds;

  function send(bytes32 id) public payable returns(bool result){
    //make sure there isnt already a fund here
    require(funds[id].sender==address(0),"Links::send id already exists");
    //create hardcoded expires time for now
    uint64 expires = uint64(block.number+10);//expires in 100 blocks
    //create fund
    funds[id] = Fund({
      sender: msg.sender,
      value: msg.value,
      expires: expires
    });
    //send out events for frontend parsing
    Send(id,msg.sender,msg.value,expires);
    return true;
  }
  event Send(bytes32 id,address indexed sender, uint256 value, uint64 expires);

  function claim(bytes32 id, bytes sig) public returns(bool result){
    //make sure there is fund here
    require(funds[id].sender!=address(0),"Links::claim id does not exists");
    //make sure it hasn't expired
    require(uint64(block.number)<=funds[id].expires,"Links::claim id does not exists");
    //makes sure sig is correct
    require(recoverSigner(id,sig)==funds[id].sender,"Links::claim sig did not recover right");
    //save value in temp so we can destory before sending
    uint256 value = funds[id].value;
    //DESTROY object so it can't be claimed again
    delete funds[id];
    //send out events for frontend parsing
    Claim(id,funds[id].sender,funds[id].value,msg.sender);
    //send funds to the msg.sender (receiver)
    msg.sender.call.value(value).gas(msg.gas)();
    return true;
  }
  event Claim(bytes32 id,address indexed sender, uint256 value, address indexed receiver);

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
