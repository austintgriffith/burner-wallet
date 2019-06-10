const fs = require('fs');

module.exports = {
  'node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol': {content:fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol', 'utf8')},
  'node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol': {content:fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol', 'utf8')},
  'node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol': {content:fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol', 'utf8')},
  'node_modules/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol': {content:fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol', 'utf8')},
}
