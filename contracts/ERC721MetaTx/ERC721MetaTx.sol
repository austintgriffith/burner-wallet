pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "tabookey-gasless/contracts/RelayRecipient.sol";
import "tabookey-gasless/contracts/RecipientUtils.sol";

/// @title Token meta transactions
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @notice Glue layer to enable token meta transactions.
contract ERC721MetaTx is Ownable, ERC721, RelayRecipient, RecipientUtils {

  // Override ERC721 _tokenApprovals to move it up in hierarchy
  mapping (uint256 => address) private _tokenApprovals;

  /// Approve function override. 
  /// @dev Used to enable token transfers using meta transaction.
  /// @param to The address which will get the token.
  /// @param tokenId The token to transfer.
  function approve(address to, uint256 tokenId) public {
    address owner = ownerOf(tokenId);
    address sender = get_sender();
    require(to != owner);
    require(sender == owner || isApprovedForAll(owner, sender));

    _tokenApprovals[tokenId] = to;
    emit Approval(owner, to, tokenId);
  }

  /// TransferFrom function override. 
  /// @dev Transfer token from one address to another
  /// @param from address The address which you want to send tokens from
  /// @param to address The address which you want to transfer to
  /// @param tokenId uint256 token to transfer
  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  )
    public
  {
    address sender = get_sender();
    require(_isApprovedOrOwner(sender, tokenId));
    require(to != address(0));

    _clearApproval(from, tokenId);
    _removeTokenFrom(from, tokenId);
    _addTokenTo(to, tokenId);

    emit Transfer(from, to, tokenId);
  }

  /// Override function to use it at hierarchy level.
  function _clearApproval(address owner, uint256 tokenId) private {
    require(ownerOf(tokenId) == owner);
    if (_tokenApprovals[tokenId] != address(0)) {
      _tokenApprovals[tokenId] = address(0);
    }
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
      address sender = get_sender();
      uint256 balance = balanceOf(sender); // TODO Improve to a robust check
      if (balance > 0) {
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
