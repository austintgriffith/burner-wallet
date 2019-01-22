/*
const fs = require('fs');
module.exports = {
  'openzeppelin-solidity/contracts/ownership/Ownable.sol': fs.readFileSync('openzeppelin-solidity/contracts/ownership/Ownable.sol', 'utf8')
}
*/
const fs = require('fs');
module.exports = {
  'tabookey-gasless/contracts/RelayRecipientApi.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayRecipientApi.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayRecipient.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayRecipient.sol', 'utf8'),
  'tabookey-gasless/contracts/RecipientUtils.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RecipientUtils.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayHubApi.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayHubApi.sol', 'utf8'),
  'tabookey-gasless/contracts/RLPReader.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RLPReader.sol', 'utf8'),
  'tabookey-gasless/contracts/RelayHub.sol': fs.readFileSync('node_modules/tabookey-gasless/contracts/RelayHub.sol', 'utf8')
}