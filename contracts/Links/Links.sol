pragma solidity 0.4.25;

contract Links {

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
        require(msg.value >= 1500000000000000,"Links::send, needs to be at least 0.0015 xDai to pay relay reward");
        require(_signature.length == 65,"Links::send, invalid signature lenght");
        //make sure there is not already a fund here
        require(!isFundValid(_id),"Links::send, id already exists");
        address signer = recoverSigner(_id,_signature);
        //recoverSigner returns: address(0) if invalid signature or incorrect version.
        require(signer != address(0),"Links::send, invalid signer");
        uint256 nonce = contractNonce;
        contractNonce = safeAdd(contractNonce,uint256(1));
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
        address _destination
    )
        public
        returns (bool)
    {
        require(isFundValid(_id),"Links::claim, invalid fund");
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
                signer = recoverSigner(claimHash1,_signature);
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
        address _destination
    )
        private
        returns (bool)
    {
        //makes sure signature is correct and fund is valid.
        require(isClaimValid(_id,_signature,_claimHash,_destination),"Links::executeClaim, claim is not valid");
        bool status = false;
        uint256 residual = funds[_id].value;
        bool claimed = funds[_id].claimed;
        uint256 value = funds[_id].value;
        uint256 nonce = funds[_id].nonce;

        assert(nonce < contractNonce);
        if(claimed == false){
            // temporary fund invalidation
            funds[_id].claimed = true;
            /* solium-disable-next-line security/no-send */
            status = _destination.send(value);
            // update fund with correct status
            funds[_id].claimed = status;
            if(status == true){
                // DESTROY object so it can't be claimed again and free storage space.
                delete funds[_id];
            }
        } else{
            status = claimed;
            // DESTROY object so it can't be claimed again and free storage space.
            delete funds[_id];
        }
        // send out events for frontend parsing
        emit Claimed(_id,msg.sender,value,_destination,nonce,status);
        return status;
    }

    ///@dev Returns whether the target address is a contract
    ///@param account address of the account to check
    ///@return whether the target address is a contract
    function isContract(
        address account
    )
        private
        view
        returns (bool)
    {
        uint256 size;
        // TODO Check this again before the Serenity release, because all addresses will be contracts then.
        // solium-disable-next-line security/no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }

    /// @dev Recover signer from bytes32 data.
    /// @param _hash bytes32 data.
    /// @param _signature message signature (65 bytes).
    function recoverSigner(
        bytes32 _hash,
        bytes memory _signature
    )
        private
        pure
        returns (address)
    {
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
        /* solium-disable-next-line security/no-inline-assembly */
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
            return ecrecover(
              /* solium-disable-next-line */
                keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash))
                , v, r, s);
        }
    }

    /// @dev Adds two numbers, throws on overflow.
    function safeAdd(
        uint256 _a,
        uint256 _b
    )
        private
        pure
        returns (uint256 c)
    {
        c = _a + _b;
        assert(c >= _a);
        return c;
    }

    /// @dev Substracts two numbers, throws on underflow.
    function safeSub(
        uint256 _a,
        uint256 _b
    )
        private
        pure
        returns (uint256)
    {
        assert(_b <= _a);
        return _a - _b;
    }
}
