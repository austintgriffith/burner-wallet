pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721MetadataMintable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";
/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract Badges is ERC721, ERC721Enumerable, ERC721Metadata, ERC721MetadataMintable {
    constructor (string memory name, string memory symbol) public ERC721Metadata(name, symbol) {
        // solhint-disable-previous-line no-empty-blocks
    }

    //EXAMPLE RESPONSE FROM TOKEN URI: https://opensea-creatures-api.herokuapp.com/api/creature/3

    function mintNextTokenWithTokenURI(address to, string memory tokenURI) public onlyMinter returns (bool) {
        uint256 tokenId = _getNextTokenId();
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return true;
    }

    function _getNextTokenId() private view returns (uint256) {
       return totalSupply().add(1);
    }
}
