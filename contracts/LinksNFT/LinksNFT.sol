pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "../Vault/Vault.sol";

/// @title Send NFTs with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
contract LinksNFT is Vault{
    using SafeMath for uint;
    using ECDSA for bytes32;

    struct Fund {
        address sender;
        address signer;
        address token;
        uint tokenId;
        uint nonce;
    }
    mapping (bytes32 => Fund) public funds;
    mapping(bytes32 => uint) public nonceId;

    event Sent(
        bytes32 indexed id,
        address indexed sender,
        uint tokenId,
        uint nonce,
        bool indexed sent
    );
    event Claimed(
        bytes32 indexed id,
        address sender, 
        uint tokenId, 
        address indexed receiver, 
        uint nonce, 
        bool indexed claimed
    );

    /// @dev Verifies if it is a valid Id.
    modifier ifValidFund(bytes32 Id){
        require(isFundValid(Id),"LinksNFT::ifValidFund - Fund does NOT exists.");
        _;
    }
    /// @dev Verifies if the Id exists.
    modifier ifNotValidFund(bytes32 Id){
        require(!isFundValid(Id),"LinksNFT::ifNotValidFund - Fund exists.");
        _;
    }
    /// @dev Verifies if it is a valid Signature lenght.
    modifier ifValidSig(bytes memory Signature){
        require(Signature.length == 65,"LinksNFT::ifValidSig - Invalid signature lenght");
        _;
    }

    /// @dev fallback
    function () external{
        revert("LinksNFT::fallback");
    }

    /// @dev Create fund.
    /// @param _id Fund lookup key value.
    /// @param _signature Sender signature.
    function send(
        bytes32 _id, 
        bytes memory _signature,
        address _token,
        uint _tokenId
    )   
        public 
        ifNotValidFund(_id)
        ifValidSig(_signature)
        returns (bool)
    {
        address signer = ECDSA.recover(_id.toEthSignedMessageHash(),_signature);
        require(signer != address(0),"LinksNFT::send - Invalid signer");
        address sender = msg.sender;
        
        // Handle Id nonce
        // Ids could be reused if the fund was correclty claimed and deleted
        uint nonce = nonceId[_id];
        if(nonce == 0){
            nonce = 1;
            nonceId[_id] = 1;
        }
        nonceId[_id] = nonceId[_id].add(uint(1));
        
        assert(nonce < nonceId[_id]);
        _linkDeposit(_token, ERC721TOKEN, 0, _tokenId, sender);
        funds[_id] = Fund({
            sender: sender,
            signer: signer,
            token: _token,
            tokenId: _tokenId,
            nonce: nonce
        });
        require(isFundValid(_id),"LinksNFT::send - Invalid fund");
        // send out events for frontend parsing
        emit Sent(_id,sender,_tokenId,nonce,true);
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
            uint nonce = funds[_id].nonce;
            // keccak256(_id,_destination,nonce,address(this)) is a unique key
            // remains unique if the id gets reused after fund deletion
            bytes32 claimHash1 = keccak256(abi.encodePacked(_id,_destination,nonce,address(this)));
            if(_claimHash == claimHash1){
                signer = ECDSA.recover(claimHash1.toEthSignedMessageHash(),_signature);
            } else{
                return false;
            } 
            return (
                signer != address(0) && (signer == funds[_id].signer)
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
        uint nonce = funds[_id].nonce;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
          // Cannot assume empty initial values without initializating them. 
          sender := and(sender, 0xffffffff)
          signer := and(signer, 0xffffffff)
          nonce := and(nonce, 0xffffffff)
        }
        return (
          (sender != address(0)) && (signer != address(0)) && (nonce > uint(0)) && (nonce < nonceId[_id])
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
        require(isClaimValid(_id,_signature,_claimHash,_destination),"LinksNFT::executeClaim - Invalid claim.");
        uint nonce = funds[_id].nonce;
        address token = funds[_id].token;
        uint tokenId = funds[_id].tokenId;
        address sender = msg.sender;

        assert(nonce < nonceId[_id]);
        // validate mutex/flag status
        _linkTransfer(token, ERC721TOKEN, _destination, 0, tokenId);
        // DESTROY object so it can't be claimed again and free storage space.
        delete funds[_id];
        // send out events for frontend parsing
        emit Claimed(_id,sender,tokenId,_destination,nonce,true);
        return true;
    }

}