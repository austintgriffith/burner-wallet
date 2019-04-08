pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "tabookey-gasless/contracts/RelayRecipient.sol";
import "tabookey-gasless/contracts/RecipientUtils.sol";

/// @title Token meta transactions
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @notice Glue layer to enable token meta transactions.
contract ERC20MetaTx is Ownable, ERC20, RelayRecipient, RecipientUtils {

  // Override ERC20 _allowed to move it up in hierarchy
  mapping (address => mapping (address => uint256)) private _allowed;

  /// Approve function override. 
  /// @dev Used to enable token transfers using meta transaction.
  /// @param spender The address which will spend the funds.
  /// @param value The amount of tokens to be spent.
  function approve(
    address spender, 
    uint256 value
  ) 
    public 
    returns (bool) 
  {
    require(spender != address(0));
    address sender = get_sender();

    _allowed[sender][spender] = value;
    emit Approval(sender, spender, value);
    return true;
  }

  /// TransferFrom function override. 
  /// @dev Transfer tokens from one address to another
  /// @param from address The address which you want to send tokens from
  /// @param to address The address which you want to transfer to
  /// @param value uint256 the amount of tokens to be transferred
  function transferFrom(
    address from,
    address to,
    uint256 value
  )
    public
    returns (bool)
  {
    address sender = get_sender();
    require(value <= _allowed[from][sender]);

    _allowed[from][sender] = _allowed[from][sender].sub(value);
    _transfer(from, to, value);
    return true;
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
