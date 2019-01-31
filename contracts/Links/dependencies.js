const fs = require('fs');
module.exports = {
  'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol', 'utf8'),
  'openzeppelin-solidity/contracts/utils/Address.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/utils/Address.sol', 'utf8'),
  'openzeppelin-solidity/contracts/cryptography/ECDSA.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/cryptography/ECDSA.sol', 'utf8'),
}
