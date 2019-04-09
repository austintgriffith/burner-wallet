pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "tabookey-gasless/contracts/RelayRecipient.sol";
import "tabookey-gasless/contracts/RecipientUtils.sol";
import "../Vault/Vault.sol";

/// @title Send xDai/Eth with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @author TabooKey Team  - <info@tabookey.com>
/// @notice Funds have an adjustable expiration time.
/// After a fund expires it can only be claimed by the original sender.
contract Links is Ownable, Vault, RelayRecipient, RecipientUtils {
    using SafeMath for uint;
    using ECDSA for bytes32;

    struct Fund {
        address sender;
        address signer;
        address token;
        bytes4 tokenType;
        uint256 value;
        uint256 msgVal;
        uint256 nonce;
        uint256 creationTime;
        uint256 expirationTime;
        bool claimed;
    }
    mapping (bytes32 => Fund) public funds;
    mapping(bytes32 => uint256) public nonceId;
    mapping(address => uint256) public blockLog;

    event Sent(
        bytes32 indexed id,
        address indexed sender,
        uint256 value,
        bytes4 tokenType,
        bool sent,
        uint256 indexed previousBlock
    );
    event Claimed(
        bytes32 indexed id,
        address sender, 
        uint256 value, 
        address indexed receiver, 
        bytes4 indexed tokenType, 
        bool claimed
    );

    /// @dev Verifies if it is a valid Id.
    modifier ifValidFund(bytes32 Id){
        require(isFundValid(Id),"Links::ifValidFund - Fund does NOT exists.");
        _;
    }
    /// @dev Verifies if the Id exists.
    modifier ifNotValidFund(bytes32 Id){
        require(!isFundValid(Id),"Links::ifNotValidFund - Fund exists.");
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
        bytes4 _tokenType,
        uint256 _value,
        uint256 _expirationDays
    )   
        public 
        ifNotValidFund(_id)
        payable
        returns (bool)
    {
        require(_signature.length == 65,"Links::ifValidSig - Invalid signature lenght");
        address signer = ECDSA.recover(_id.toEthSignedMessageHash(),_signature);
        require(signer != address(0),"Links::send - Invalid signer");
        address sender = get_sender();  // Get sender for MetaTx instead of msg.sender
        
        // Handle Id nonce, Ids can be reused if the fund was correclty claimed and deleted
        uint256 nonce = nonceId[_id];
        if(nonce == 0){
            nonce = 1;
            nonceId[_id] = 1;
            blockLog[sender] = block.number;
        }
        nonceId[_id] = nonceId[_id].add(uint256(1));
        
        // Default expiration time
        uint256 expiration = now.add(1 days);
        if (_expirationDays > 1){
            expiration = now.add(_expirationDays.mul(1 days));
        }
        assert(nonce < nonceId[_id]);
        _linkDeposit(_token, _tokenType, sender, _value);
        funds[_id] = Fund({
            sender: sender,
            signer: signer,
            token: _token,
            tokenType: _tokenType,
            value: _value,
            msgVal: msg.value,
            nonce: nonce,
            creationTime: now,
            expirationTime: expiration,
            claimed: false
        });
        require(isFundValid(_id),"Links::send - Invalid fund");

        // keep track of the block number in order to scan the log bloom filter for Ids.
        emit Sent(_id,sender,_value,_tokenType,true,blockLog[sender]);
        blockLog[sender] = block.number;
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
        ifValidFund(_id)
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
        if(isFundValid(_id) && _signature.length == 65){
            address signer = address(0);
            bool expired = isClaimExpired(_id);
            // _claimHash - keccak256(_id,_destination,nonce,address(this)) is a unique key
            // remains unique if the id gets reused after fund deletion
            signer = ECDSA.recover(_claimHash.toEthSignedMessageHash(),_signature);
            return (
                signer != address(0) &&
                (
                    (!expired && signer == funds[_id].signer) || // normal case
                    (expired && (signer == funds[_id].sender || signer == funds[_id].signer)) // expired case
                )
            );
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
          (sender != address(0)) && (signer != address(0)) && (nonce > uint256(0)) && (nonce < nonceId[_id])
        );
    }

    /// @dev Validate fund status. 
    /// @param _id Lookup key id.
    function isClaimExpired(
        bytes32 _id
    ) 
        public 
        view 
        returns (bool)
    {
        if(isFundValid(_id)){
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
        bytes4 tokenType = funds[_id].tokenType;
        uint256 value = funds[_id].value;
        address sender = get_sender(); // Get sender for MetaTx instead of msg.sender

        assert(nonce < nonceId[_id]);
        // validate mutex/flag status
        if(funds[_id].claimed == false){
            // mutex activation
            funds[_id].claimed = true;
            // expired funds can only be claimed back by the original sender.
            if(isClaimExpired(_id)){
                require(sender == funds[_id].sender,"Links::executeClaim - Not original sender");
                require(_linkTransfer(token, tokenType, sender, value),"Links::executeClaim - Could not transfer to sender");
                delete funds[_id];
                status = true;
            }else{
                status = _linkTransfer(token, tokenType, _destination, value);
                // update mutex with correct status
                funds[_id].claimed = status;
                // update fund
                if(status == true){
                    delete funds[_id];
                }
                require(sender.send(0),"Links::executeClaim - Unsuccessful transaction");
            }
        } else{
            // DESTROY object so it can't be claimed again and free storage space.
            delete funds[_id];
            status = true;
        }
        // send out events for frontend parsing
        emit Claimed(_id,sender,value,_destination,tokenType,status);
        return status;
    }


    /// TabooKey Team - MetaTX Relay Section
    
    function set_hub(
        RelayHub rhub
    ) 
        public 
        onlyOwner()
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