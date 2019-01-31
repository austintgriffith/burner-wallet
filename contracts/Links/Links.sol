pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

contract Links {

    using SafeMath for uint256;
    using Address for address;
    using ECDSA for bytes32;

    struct Fund {
        address sender;
        address signer;
        uint256 value;
        uint256 nonce;
        bool claimed;
    }
    uint256 public  contractNonce = 1;
    mapping (bytes32 => Fund) public funds;

    event Sent(
        bytes32 indexed id,
        address indexed sender,
        uint256 value,
        uint256 indexed nonce,
        bool sent
    );
    event Claimed(
        bytes32 indexed id,
        address sender, 
        uint256 value, 
        address indexed receiver, 
        uint256 indexed nonce, 
        bool claimed
    );

    /// @dev Create fund.
    /// @param _id Fund lookup key value.
    /// @param _signature Sender signature.
    function send(
        bytes32 _id, 
        bytes memory _signature
    )   
        public 
        payable 
        returns (bool)
    {
        require(msg.value >= 1000000000000000,"Links::send, needs to be at least 0.001 xDai to pay relay reward");
        require(_signature.length == 65,"Links::send, invalid signature lenght");
        //make sure there is not already a fund here
        require(!isFundValid(_id),"Links::send, id already exists");
        address signer = ECDSA.recover(_id.toEthSignedMessageHash(),_signature);
        //recoverSigner returns: address(0) if invalid signature or incorrect version.
        require(signer != address(0),"Links::send, invalid signer");
        uint256 nonce = contractNonce;
        contractNonce = contractNonce.add(uint256(1));
        assert(nonce < contractNonce);
        //create fund
        funds[_id] = Fund({
            sender: msg.sender,
            signer: signer,
            value: msg.value,
            nonce: nonce,
            claimed: false
        });
        require(isFundValid(_id) && funds[_id].value == msg.value,"Links::send, invalid fund");
        //send out events for frontend parsing
        emit Sent(_id,msg.sender,msg.value,nonce,true);
        return true;
    }

    /// @dev Claim fund value.
    /// @param _id Claim lookup key value.
    /// @param _signature Sender signature.
    /// @param _destination Destination address.
    function claim(
        bytes32 _id, 
        bytes memory _signature, 
        bytes32 _claimHash, 
        address _destination,
        uint256 _gasReward
    ) 
        public 
        returns (bool)
    {
        require(isFundValid(_id),"Links::claim, invalid fund");
        require(_gasReward <= 1000000000000000, "Links::claim, cannot reward more than 0.001 xDai");
        require(_gasReward <= funds[_id].value,"Links::claim, gas reward is greater than the fund value");
        return executeClaim(_id,_signature,_claimHash,_destination,_gasReward);
    }
  
    /// @dev Off chain relayer can validate the claim before submitting.
    /// @param _id Claim lookup key value.
    /// @param _signature Sender signature.
    /// @param _destination Destination address.
    function isClaimValid(
        bytes32 _id, 
        bytes memory _signature,
        bytes32 _claimHash, 
        address _destination
    ) 
        public 
        view 
        returns (bool)
    {
        // address(0) destination is valid
        if(isFundValid(_id) && _signature.length == 65){
            address signer = address(0);
            uint256 nonce = funds[_id].nonce;
            // keccak256(_id,_destination,nonce,address(this)) is a unique key
            // remains unique if the id gets reused after fund deletion
            bytes32 claimHash1 = keccak256(abi.encodePacked(_id,_destination,nonce,address(this)));
            if(_claimHash == claimHash1){
                signer = ECDSA.recover(claimHash1.toEthSignedMessageHash(),_signature);
            } else{
                return false;
            } 
            if(signer != address(0)){
                return(funds[_id].signer == signer);
            } else{
                return false;
            }
        } else{
            return false;
        }
    }

    /// @dev Validate fund status. 
    /// @param _id Lookup key id.
    function isFundValid(
        bytes32 _id
    ) 
        public 
        view 
        returns (bool)
    {
        address sender = funds[_id].sender;
        address signer = funds[_id].signer;
        uint256 value = funds[_id].value;
        uint256 nonce = funds[_id].nonce;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
          // Cannot assume empty initial values without initializating them. 
          sender := and(sender, 0xffffffff)
          signer := and(signer, 0xffffffff)
          value := and(value, 0xffffffff)
          nonce := and(nonce, 0xffffffff)
        }
        return (
          sender != address(0) && 
          signer != address(0) && 
          value > uint256(0) && 
          nonce > uint256(0) &&
          nonce < contractNonce
        );
    }

    /// @dev Claim fund value.
    /// @param _id Claim lookup key value.
    /// @param _destination Destination address.
    function executeClaim(
        bytes32 _id, 
        bytes memory _signature, 
        bytes32 _claimHash, 
        address _destination,
        uint256 _gasReward
    ) 
        private 
        returns (bool)
    {
        //makes sure signature is correct and fund is valid.
        require(isClaimValid(_id,_signature,_claimHash,_destination),"Links::executeClaim, claim is not valid");
        bool status = false;
        uint256 residual = uint256(0);
        bool claimed = funds[_id].claimed;
        uint256 value = funds[_id].value;
        uint256 nonce = funds[_id].nonce;
 
        assert(nonce < contractNonce);
        if(claimed == false){
            // !isContract - Preventive measure against deployed contracts. 
            require(!msg.sender.isContract(),"Links::executeClaim, sender should not be a contract");
            // temporary fund invalidation
            funds[_id].claimed = true;
            residual = value.sub(_gasReward);
            // address.send() restricts to 2300 gas units
            /* solium-disable-next-line security/no-send */
            status = _destination.send(residual);
            // update fund with correct status
            funds[_id].claimed = status;
            // update fund
            if(status == true){
                // DESTROY object so it can't be claimed again and free storage space.
                delete funds[_id];
            } else{
                funds[_id].value = residual;
            }
            /* solium-disable-next-line security/no-send */
            require(msg.sender.send(_gasReward),"Links::executeClaim, could not pay sender");
        } else{
            status = claimed;
            // DESTROY object so it can't be claimed again and free storage space.
            delete funds[_id];
        }
        // send out events for frontend parsing
        emit Claimed(_id,msg.sender,value,_destination,nonce,status);
        return status;
    }
}