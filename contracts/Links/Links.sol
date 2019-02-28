pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "../Vault/Vault.sol";

/// @title Send xDai/Eth with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @author TabooKey Team  - <info@tabookey.com>
/// @notice Funds have an adjustable expiration time.
/// After a fund expires it can only be claimed by the original sender.
contract Links is Vault {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    struct Fund {
        address sender;
        address signer;
        address token;
        uint256 amount;
        uint256 msgVal;
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
        require(isFundValid(Id),"Links::ifValidId - Id does NOT exists.");
        _;
    }
    /// @dev Verifies if the Id exists.
    modifier ifNotValidId(bytes32 Id){
        require(!isFundValid(Id),"Links::ifNotValidId - Id exists.");
        _;
    }
    /// @dev Verifies if it is a valid Signature lenght.
    modifier ifValidSig(bytes memory Signature){
        require(Signature.length == 65,"Links::ifValidSig - Invalid signature lenght");
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
        address _token,
        uint256 _amount,
        uint256 _expirationDays
    )   
        public 
        ifNotValidId(_id)
        ifValidSig(_signature)
        payable
        returns (bool)
    {
        require(_expirationDays >= uint256(0),"Links::send - Invalid expiration days");
        
        address signer = ECDSA.recover(_id.toEthSignedMessageHash(),_signature);
        require(signer != address(0),"Links::send - Invalid signer");
        
        uint256 nonce = contractNonce;
        contractNonce = contractNonce.add(uint256(1));
        
        // Default expiration time
        uint256 expiration = now.add(1 days);
        if (_expirationDays > 1){
            expiration = now.add(_expirationDays.mul(1 days));
        }
        assert(nonce < contractNonce);
        _deposit(_token,_amount);
        funds[_id] = Fund({
            sender: get_sender(),
            signer: signer,
            token: _token,
            amount: _amount,
            msgVal: msg.value,
            nonce: nonce,
            creationTime: now,
            expirationTime: expiration,
            claimed: false
        });

        require(isFundValid(_id),"Links::send - Invalid fund");
        //send out events for frontend parsing
        emit Sent(_id,get_sender(),msg.value,nonce,true);
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
        address _destination
    ) 
        public 
        ifValidId(_id)
        returns (bool)
    {
        return executeClaim(_id,_signature,_claimHash,_destination);
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
            return (funds[_id].expirationTime < now);
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
        address _destination
    ) 
        private
        returns (bool)
    {
        require(isClaimValid(_id,_signature,_claimHash,_destination),"Links::executeClaim - Invalid claim.");
        bool status = false;
        uint256 nonce = funds[_id].nonce;
        address token = funds[_id].token;
        uint256 amount = funds[_id].amount;
        assert(nonce < contractNonce);

        // validate mutex/flag status
        if(funds[_id].claimed == false){
            // mutex activation
            funds[_id].claimed = true;
            // expired funds can only be claimed back by original sender.
            if(isClaimExpired(_id,_signature,_claimHash,_destination)){
                require(get_sender() == funds[_id].sender,"Links::executeClaim - Not original sender");
                require(_transfer(token, get_sender(), amount),"Links::executeClaim - Could not transfer to sender");
                delete funds[_id];
                status = true;
            }else{
                status = _transfer(token, _destination, amount);
                // update mutex with correct status
                funds[_id].claimed = status;
                // update fund
                if(status == true){
                    delete funds[_id];
                }
                require(get_sender().send(0),"Links::executeClaim - Unsuccessful transaction");
            }
        } else{
            // DESTROY object so it can't be claimed again and free storage space.
            delete funds[_id];
            status = true;
        }
        // send out events for frontend parsing
        emit Claimed(_id,get_sender(),amount,_destination,nonce,status);
        return status;
    }


    /// TabooKey Team - MetaTX Relay Section

    function set_hub(
        RelayHub rhub
    ) 
        public 
    {
        init_relay_hub(rhub);
    }

    function deposit_to_relay_hub()
        public
        payable
    {
        RelayHub(get_hub_addr()).depositFor.value(msg.value)(this);
    }

    /// @dev decide whether this call should be allowed to called by a relay
    /// @param encoded_function raw bytes of the transaction being relayed
    /// @return fsdgf
    function accept_relayed_call(
        address /* relay */,
        address /* from */,
        bytes memory encoded_function,
        uint /* gas_price */,
        uint /* transaction_fee */
    )
        public 
        view 
        returns(uint32)
    {
        bytes4 claimFunctionIdentifier = RecipientUtils.sig("claim(bytes32,bytes,bytes32,address)");
        bool is_call_to_claim = RecipientUtils.getMethodSig(encoded_function) == claimFunctionIdentifier;
        if (!is_call_to_claim){
            return 4;
        }
        bytes32 id = bytes32(RecipientUtils.getParam(encoded_function, 0));
        bytes memory signature = RecipientUtils.getBytesParam(encoded_function, 1);
        bytes32 claimHash = bytes32(RecipientUtils.getParam(encoded_function, 2));
        address destination = address(RecipientUtils.getParam(encoded_function, 3));
        bool is_claim_valid = isClaimValid(id, signature, claimHash, destination);
        if (!is_claim_valid) {
            return 5;
        }
        return 0;
    }

    function post_relayed_call(
        address /* relay */,
        address /* from */,
        bytes memory/* encoded_function */,
        bool /* success */,
        uint /* used_gas */,
        uint /* transaction_fee */
    )
        public 
    {
    }

}
