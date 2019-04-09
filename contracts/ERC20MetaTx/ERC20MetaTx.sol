pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "tabookey-gasless/contracts/RelayRecipient.sol";
import "tabookey-gasless/contracts/RecipientUtils.sol";

/// @title Token meta transactions
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @notice Glue layer to enable token meta transactions.
contract ERC20MetaTx is Ownable, ERC20, RelayRecipient, RecipientUtils {

  // Override _allowed to move it up in hierarchy
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

  /// Transfer function override. 
  /// @dev Transfer token for a specified address
  /// @param to The address to transfer to.
  /// @param value The amount to be transferred.
  function transfer(
    address to, 
    uint256 value
  ) 
    public 
    returns (bool) 
  {
    address sender = get_sender();
    _transfer(sender, to, value);
    return true;
  }

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
      bool is_call_to_approve = RecipientUtils.getMethodSig(encoded_function) == bytes4(keccak256('approve(address,uint256)'));
      bool is_call_to_transfer = RecipientUtils.getMethodSig(encoded_function) == bytes4(keccak256('transfer(address,uint256)'));
      bool is_call_to_transferFrom = RecipientUtils.getMethodSig(encoded_function) == bytes4(keccak256('transferFrom(address,address,uint256)'));
      if (!(is_call_to_approve || is_call_to_transfer || is_call_to_transferFrom)){
          return 4;
      }
      address sender = get_sender();
      address to = 0;
      uint256 value = 0;
      uint256 balance = 0;
      address from = address(0);

      if (is_call_to_approve){
          value = uint256(RecipientUtils.getParam(encoded_function, 1));
          balance = balanceOf(sender);
          if (value <= balance) {
              return 5;
          } else{
            return 0;
          }
      } else if (is_call_to_transfer){
          to = address(RecipientUtils.getParam(encoded_function, 0));
          value = uint256(RecipientUtils.getParam(encoded_function, 1));
          balance = balanceOf(sender);
          if (value <= balance) {
              return 5;
          } else{
            return 0;
          }
      } else if (is_call_to_transferFrom){
          from = address(RecipientUtils.getParam(encoded_function, 0));
          value = uint256(RecipientUtils.getParam(encoded_function, 2));
          balance = balanceOf(sender);
          if (value <= _allowed[from][sender] && value <= balance) {
              return 5;
          } else{
            return 0;
          }
      } else{
          return 0;
      }
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
