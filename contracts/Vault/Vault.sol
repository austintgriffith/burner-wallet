pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";

/// @title Storage vault to send with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
contract Vault is IERC721Receiver{
    
    // Token Selectors
    bytes4 internal constant NATIVE_TOKEN = 0xfdae1ba7; // bytes4(keccak256("NATIVE"))
    bytes4 internal constant ERC20TOKEN = 0x8ae85d84;   // bytes4(keccak256("ERC20"))
    bytes4 internal constant ERC721TOKEN = 0x73ad2146;  // bytes4(keccak256("ERC721"))

    event VaultTransfer(address indexed token, bytes4 tokenType, address indexed to, uint256 value, bool status);
    event VaultDeposit(address indexed token, bytes4 tokenType, address indexed sender, uint256 value, bool status);

    function vaultBalance(address _token, bytes4 _tokenType) public view returns (uint256) {
        if (_tokenType == NATIVE_TOKEN && _token == address(0)) {
            return address(this).balance;
        } else if(_tokenType == ERC20TOKEN && _token != address(0)) {
            return ERC20(_token).balanceOf(address(this));
        } else if(_tokenType == ERC721TOKEN && _token != address(0)){
            return ERC721(_token).balanceOf(address(this));
        } else{
            revert("Vault::vaultBalance - Invalid token");
        }
    }

    /// @param _operator The address which called `safeTransferFrom` function
    /// @param _from The address which previously owned the token
    /// @param _tokenId The NFT identifier which is being transferred
    /// @param _data Additional data with no specified format
    /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    function onERC721Received(address _operator,address _from,uint256 _tokenId,bytes _data) public returns(bytes4){
        return this.onERC721Received.selector; 
    }

    /// @notice vaultDeposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Tokens being transferred
    /// @param _sender Token holder
    function _linkDeposit(address _token, bytes4 _tokenType, address _sender, uint256 _value) internal {
        _vaultDeposit(_token, _tokenType, _sender, _value);
    }

    /// @notice vaultTransfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Tokens being transferred
    function _linkTransfer(address _token, bytes4 _tokenType, address _to, uint256 _value) internal returns(bool){
        return _vaultTransfer(_token, _tokenType, _to, _value);
    }

    /// @notice Transfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Tokens being transferred
    /* solium-disable-next-line function-order */
    function _vaultTransfer(address _token, bytes4 _tokenType, address _to, uint256 _value) private returns(bool status) {

        status = false;
        if (_tokenType == NATIVE_TOKEN && _token == address(0)) {
            require(_value > 0, "Vault::_vaultTransfer - Invalid transfer");
            status = _to.send(_value);
        } else if(_tokenType == ERC20TOKEN && _token != address(0)) {
            require(_value > 0, "Vault::_vaultTransfer - Invalid transfer");
            status = ERC20(_token).transfer(_to, _value);
        } else if(_tokenType == ERC721TOKEN && _token != address(0)){
            ERC721(_token).safeTransferFrom(address(this), _to, _value);
            status = true;
        } else{
            revert("Vault::_vaultTransfer - Invalid token");
        }
        emit VaultTransfer(_token, _tokenType, _to, _value, status);
    }

    /// @notice Deposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    /// @param _sender Token holder
    /// @dev Vault contract needs to be approved by the token holder before calling this function. 
    /// ERC#(_token).approve(address(this), _value)
    function _vaultDeposit(address _token, bytes4 _tokenType, address _sender, uint256 _value) private {

        if (_tokenType == NATIVE_TOKEN && _token == address(0)) {
            require(_value > 0, "Vault::_vaultDeposit - Invalid deposit");
            require(msg.value == _value, "Vault::_vaultDeposit - Value mismatch");
        }  else if(_tokenType == ERC20TOKEN && _token != address(0)) {
            require(_value > 0, "Vault::_vaultDeposit - Invalid deposit");
            require(ERC20(_token).transferFrom(_sender, address(this), _value), "Vault::_vaultDeposit - Reverted ERC20 token transfer");
        } else if(_tokenType == ERC721TOKEN && _token != address(0)){
            ERC721(_token).safeTransferFrom(_sender, address(this), _value);
        } else{
            revert("Vault::_vaultDeposit - Invalid token");
        }
        emit VaultDeposit(_token, _tokenType, _sender, _value, true);
    }
}