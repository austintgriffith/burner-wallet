pragma solidity 0.4.25;


import "tabookey-gasless/contracts/RelayRecipient.sol";
import "tabookey-gasless/contracts/RecipientUtils.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/// @title Storage vault to send with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @notice Based on ARAGON VAULT.
contract Vault is RelayRecipient, RecipientUtils {

    address internal constant ETH = address(0);

    event VaultTransfer(address indexed token, address indexed to, uint256 amount, bool status);
    event VaultDeposit(address indexed token, address indexed sender, uint256 amount, bool status);

    function balance(address _token, address _from) public view returns (uint256) {
        if (_token == ETH) {
            return address(_from).balance;
        } else {
            return ERC20(_token).balanceOf(_from);
        }
    }

    /// @notice vaultDeposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    function _deposit(address _token, uint256 _value) internal {
        _vDeposit(_token, _value);
    }

    /// @notice vaultTransfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Amount of tokens being transferred
    function _transfer(address _token, address _to, uint256 _value) internal returns(bool){
        return _vTransfer(_token, _to, _value);
    }

    /// @notice Transfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Amount of tokens being transferred
    /* solium-disable-next-line function-order */
    function _vTransfer(address _token, address _to, uint256 _value) private returns(bool status) {
        require(_value > 0, "Vault::_vTransfer - Invalid transfer");

        status = false;
        if (_token == ETH) {
            status = _to.send(_value);
        } else {
            status = ERC20(_token).transfer(_to, _value);
        }

        emit VaultTransfer(_token, _to, _value, status);
    }

    /// @notice Deposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    function _vDeposit(address _token, uint256 _value) private {
        require(_value > 0, "Vault::_vDeposit - Invalid deposit");

        if (_token == ETH) {
            // Deposit is implicit in this case
            require(msg.value == _value, "Vault::_vDeposit - Value mismatch");
        } else {
            require(ERC20(_token).transferFrom(get_sender(), this, _value), "Vault::_vDeposit - Reverted token transfer");
        }

        emit VaultDeposit(_token, get_sender(), _value, true);
    }
}
