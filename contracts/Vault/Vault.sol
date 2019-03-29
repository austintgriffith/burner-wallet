pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/// @title Storage vault to send with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
/// @notice Based on ARAGON VAULT.
contract Vault {

    address internal constant xDai = address(0);

    event VaultTransfer(address indexed token, address indexed to, uint256 amount, bool status);
    event VaultDeposit(address indexed token, address indexed sender, uint256 amount, bool status);

    function balance(address _token, address _from) public view returns (uint256) {
        if (_token == xDai) {
            return address(_from).balance;
        } else {
            return ERC20(_token).balanceOf(_from);
        }
    }

    /// @notice vaultDeposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    /// @param _sender Token holder
    function _linkDeposit(address _token, uint256 _value, address _sender) internal {
        _vaultDeposit(_token, _value, _sender);
    }

    /// @notice vaultTransfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Amount of tokens being transferred
    function _linkTransfer(address _token, address _to, uint256 _value) internal returns(bool){
        return _vaultTransfer(_token, _to, _value);
    }

    /// @notice Transfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Amount of tokens being transferred
    /* solium-disable-next-line function-order */
    function _vaultTransfer(address _token, address _to, uint256 _value) private returns(bool status) {
        require(_value > 0, "Vault::_vaultTransfer - Invalid transfer");

        status = false;
        if (_token == xDai) {
            status = _to.send(_value);
        } else {
            status = ERC20(_token).transfer(_to, _value);
        }
        emit VaultTransfer(_token, _to, _value, status);
    }

    /// @notice Deposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    /// @param _sender Token holder
    function _vaultDeposit(address _token, uint256 _value, address _sender) private {
        require(_value > 0, "Vault::_vaultDeposit - Invalid deposit");

        if (_token == xDai) {
            // Deposit is implicit in this case
            require(msg.value == _value, "Vault::_vaultDeposit - Value mismatch");
        } else {
            // The Vault contract needs to get approved by the token holder before this transaction. ERC20(_token).approve(address(this), _value)
            require(ERC20(_token).transferFrom(_sender, address(this), _value), "Vault::_vaultDeposit - Reverted token transfer");
        }
        emit VaultDeposit(_token, _sender, _value, true);
    }
}
