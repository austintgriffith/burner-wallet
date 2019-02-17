const fs = require('fs');
module.exports = {
  'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol', 'utf8')
}
