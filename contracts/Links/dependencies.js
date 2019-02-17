const fs = require('fs');
module.exports = {
  'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol', 'utf8'),
  'openzeppelin-solidity/contracts/utils/Address.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/utils/Address.sol', 'utf8'),
  'openzeppelin-solidity/contracts/cryptography/ECDSA.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayRecipientApi.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayRecipientApi.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayRecipient.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayRecipient.sol', 'utf8'),
  'tabookey-gasless/contracts/RecipientUtils.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RecipientUtils.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayHubApi.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayHubApi.sol', 'utf8'),
  'tabookey-gasless/contracts/RLPReader.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RLPReader.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayHub.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayHub.sol', 'utf8'),
  'Vault.sol': fs.readFileSync('contracts/Vault/Vault.sol', 'utf8')
}