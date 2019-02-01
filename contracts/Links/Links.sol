pragma solidity 0.4.25;
/* solium-disable security/no-send */
/* solium-disable security/no-block-members */

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

/// @title Send xDai/Eth with a link.
/// @author Austin Griffith  - <austin@gitcoin.co>
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @notice Funds have an adjustable expiration time.
/// After a fund expires it can only be claimed by the original sender.
contract Links {
    using SafeMath for uint256;
    using Address for address;
    using ECDSA for bytes32;

    struct Fund {
        address sender;
        address signer;
        uint256 value;
        uint256 nonce;
        uint256 creationTime;
        uint256 expirationTime;
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

    /// @dev Verifies if it is a valid Id.
    modifier ifValidId(bytes32 Id){
        require(isFundValid(Id),"Links::ifValidId, Id does NOT exists.");
        _;
    }
    /// @dev Verifies if the Id exists.
    modifier ifNotValidId(bytes32 Id){
        require(!isFundValid(Id),"Links::ifNotValidId, Id exists.");
        _;
    }
    /// @dev Verifies if it is a valid Signature lenght.
    modifier ifValidSig(bytes memory Signature){
        require(Signature.length == 65,"Links::ifValidSig, invalid signature lenght");
        _;
    }

    /// @dev fallback
    function () external{
        revert("Links::fallback");
    }

    /// @dev Create fund.
    /// @param _id Fund lookup key value.
    /// @param _signature Sender signature.
    function send(
        bytes32 _id, 
        bytes memory _signature,
        uint256 _expirationDays
    )   
        public 
        ifNotValidId(_id)
        ifValidSig(_signature)
        payable
        returns (bool)
    {
        require(msg.value >= 1000000000000000,"Links::send, needs to be at least 0.001 xDai/Eth to pay relay reward");
        require(_expirationDays >= uint256(0),"Links::send, invalid expiration days");
        // !isContract - Preventive measure against deployed contracts. 
        require(!msg.sender.isContract(),"Links::send, sender should not be a contract");
        address signer = ECDSA.recover(_id.toEthSignedMessageHash(),_signature);
        require(signer != address(0),"Links::send, invalid signer");
        // defaulting to 6 months expiration
        uint256 expiration = block.timestamp.add(26 weeks);
        uint256 nonce = contractNonce;
        contractNonce = contractNonce.add(uint256(1));
        if (_expirationDays >= 1){
            expiration = block.timestamp.add(_expirationDays.mul(1 days));
        }
        assert(nonce < contractNonce);
        funds[_id] = Fund({
            sender: msg.sender,
            signer: signer,
            value: msg.value,
            nonce: nonce,
            creationTime: block.timestamp,
            expirationTime: expiration,
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
        ifValidId(_id)
        returns (bool)
    {
        require(_gasReward <= funds[_id].value,"Links::claim, gas reward is greater than the fund value");
        require(_gasReward <= 1000000000000000, "Links::claim, cannot reward more than 0.001 xDai/Eth");
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
        uint256 nonce = funds[_id].nonce;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
          // Cannot assume empty initial values without initializating them. 
          sender := and(sender, 0xffffffff)
          signer := and(signer, 0xffffffff)
          nonce := and(nonce, 0xffffffff)
        }
        return (
          (sender != address(0)) && (signer != address(0)) && (nonce > uint256(0)) && (nonce < contractNonce)
        );
    }

    /// @dev Validate fund status. 
    /// @param _id Lookup key id.
    /// @param _destination Destination address.
    function isClaimExpired(
        bytes32 _id, 
        bytes memory _signature, 
        bytes32 _claimHash, 
        address _destination
    ) 
        public 
        view 
        returns (bool)
    {
        if(isClaimValid(_id,_signature,_claimHash,_destination)){
            return (funds[_id].expirationTime < block.timestamp);
        }else{
            return true;
        }
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
        require(isClaimValid(_id,_signature,_claimHash,_destination),"Links::executeClaim, invalid claim.");
        bool status = false;
        uint256 residual = uint256(0);
        bool claimed = funds[_id].claimed;
        uint256 value = funds[_id].value;
        uint256 nonce = funds[_id].nonce;

        assert(nonce < contractNonce);
        // validate mutex/flag status
        if(claimed == false){
            // !isContract - Preventive measure against deployed contracts. 
            require(!msg.sender.isContract(),"Links::executeClaim, sender should not be a contract");
            // mutex activation
            funds[_id].claimed = true;
            // expired funds can only be claimed back by original sender.
            if(isClaimExpired(_id,_signature,_claimHash,_destination)){
                require(msg.sender == funds[_id].sender,"Links::executeClaim, not original sender");
                msg.sender.transfer(value);
                delete funds[_id];
                status = true;
            }else{
                residual = value.sub(_gasReward);
                // address.send() restricts to 2300 gas units
                status = _destination.send(residual);
                // update mutex with correct status
                funds[_id].claimed = status;
                // update fund
                if(status == true){
                    delete funds[_id];
                } else{
                    funds[_id].value = residual;
                }
                require(msg.sender.send(_gasReward),"Links::executeClaim, could not pay sender");
            }
        } else{
            // DESTROY object so it can't be claimed again and free storage space.
            delete funds[_id];
            status = true;
        }
        // send out events for frontend parsing
        emit Claimed(_id,msg.sender,value,_destination,nonce,status);
        return status;
    }
}