pragma solidity ^0.5.0;

import "node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";

/// @title Storage vault to send with a link.
/// @author Ricardo Rius  - <ricardo@rius.info>
contract Vault is IERC721Receiver{

    address internal constant NATIVE_TOKEN = address(0);
    bytes4 internal constant ERC20TOKEN = bytes4(keccak256("ERC20"));
    bytes4 internal constant ERC721TOKEN = bytes4(keccak256("ERC721"));

    event VaultTransfer(address indexed token, address indexed to, uint256 amount, uint256 tokenId, bool status);
    event VaultDeposit(address indexed token, address indexed sender, uint256 amount, uint256 tokenId, bool status);

    function balance(address _token, address _from) public view returns (uint256) {
        if (_token == NATIVE_TOKEN) {
            return address(_from).balance;
        } else {
            return ERC20(_token).balanceOf(_from);
        }
    }

    /// @param _operator The address which called `safeTransferFrom` function
    /// @param _from The address which previously owned the token
    /// @param _tokenId The NFT identifier which is being transferred
    /// @param _data Additional data with no specified format
    /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    function onERC721Received(address _operator,address _from,uint256 _tokenId,bytes memory _data) public returns(bytes4){
        return this.onERC721Received.selector;
    }

    /// @notice vaultDeposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    /// @param _sender Token holder
    function _linkDeposit(address _token, bytes4 _type, uint256 _value,  uint256 _tokenId, address _sender) internal {
        _vaultDeposit(_token, _type, _value,  _tokenId, _sender);
    }

    /// @notice vaultTransfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Amount of tokens being transferred
    function _linkTransfer(address _token, bytes4 _type, address payable _to, uint256 _value, uint256 _tokenId) internal returns(bool){
        return _vaultTransfer(_token, _type, _to, _value, _tokenId);
    }

    /// @notice Transfer `_value` `_token` from the Vault to `_to`
    /// @param _token Address of the token being transferred
    /// @param _to Address of the recipient of tokens
    /// @param _value Amount of tokens being transferred
    /* solium-disable-next-line function-order */
    function _vaultTransfer(address _token, bytes4 _type, address payable _to, uint256 _value, uint256 _tokenId) private returns(bool status) {

        status = false;
        if (_token == NATIVE_TOKEN) {
            require(_value > 0, "Vault::_vaultTransfer - Invalid transfer");
            status = _to.send(_value);
        } else if(_type == ERC20TOKEN) {
            require(_value > 0, "Vault::_vaultTransfer - Invalid transfer");
            status = ERC20(_token).transfer(_to, _value);
        } else if(_type == ERC721TOKEN){
            ERC721(_token).safeTransferFrom(address(this), _to, _tokenId);
            status = true;
        } else{
            revert("Vault::_vaultTransfer - Invalid token");
        }
        emit VaultTransfer(_token, _to, _value, _tokenId, status);
    }

    /// @notice Deposit `_value` `_token` to the vault
    /// @param _token Address of the token being transferred
    /// @param _value Amount of tokens being transferred
    /// @param _sender Token holder
    function _vaultDeposit(address _token, bytes4 _type, uint256 _value, uint256 _tokenId, address _sender) private {

        if (_token == NATIVE_TOKEN) {
            require(_value > 0, "Vault::_vaultDeposit - Invalid deposit");
            // Deposit is implicit in this case
            require(msg.value == _value, "Vault::_vaultDeposit - Value mismatch");
        }  else if(_type == ERC20TOKEN) {
            require(_value > 0, "Vault::_vaultDeposit - Invalid deposit");
            // The Vault contract needs to be approved by the token holder before this transaction takes place. ERC20(_token).approve(address(this), _value)
            require(ERC20(_token).transferFrom(_sender, address(this), _value), "Vault::_vaultDeposit - Reverted ERC20 token transfer");
        } else if(_type == ERC721TOKEN){
            // The Vault contract needs to be approved by the token holder before this transaction takes place. ERC721(_token).approve(address(this), _tokenId)
            ERC721(_token).safeTransferFrom(_sender, address(this), _tokenId);
        } else{
            revert("Vault::_vaultDeposit - Invalid token");
        }
        emit VaultDeposit(_token, _sender, _value, _tokenId, true);
    }
}
