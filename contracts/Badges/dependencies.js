const fs = require('fs');

module.exports = {
  'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol', 'utf8'),
  'openzeppelin-solidity/contracts/ownership/Ownable.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/IERC721.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol', 'utf8'),
  'openzeppelin-solidity/contracts/utils/Address.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/utils/Address.sol', 'utf8'),
  'openzeppelin-solidity/contracts/introspection/ERC165.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/introspection/ERC165.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/IERC721Enumerable.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721Enumerable.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/IERC721Metadata.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/IERC721Metadata.sol', 'utf8'),
  'openzeppelin-solidity/contracts/introspection/IERC165.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/introspection/IERC165.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC721/ERC721MetadataMintable.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721MetadataMintable.sol', 'utf8'),
  'openzeppelin-solidity/contracts/access/roles/MinterRole.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/access/roles/MinterRole.sol', 'utf8'),
  'openzeppelin-solidity/contracts/access/Roles.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/access/Roles.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayRecipientApi.sol': fs.readFileSync('./node_modules/tabookey-gasless/contracts/RelayRecipientApi.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayRecipient.sol': fs.readFileSync('./node_modules/tabookey-gasless/contracts/RelayRecipient.sol', 'utf8'),
  'tabookey-gasless/contracts/RecipientUtils.sol': fs.readFileSync('./node_modules/tabookey-gasless/contracts/RecipientUtils.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayHubApi.sol': fs.readFileSync('./node_modules/tabookey-gasless/contracts/RelayHubApi.sol', 'utf8'),
  'tabookey-gasless/contracts/RLPReader.sol': fs.readFileSync('./node_modules/tabookey-gasless/contracts/RLPReader.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayHub.sol': fs.readFileSync('./node_modules/tabookey-gasless/contracts/RelayHub.sol', 'utf8'),
  'ERC721MetaTx/ERC721MetaTx.sol': fs.readFileSync('./contracts/ERC721MetaTx/ERC721MetaTx.sol', 'utf8')
}
