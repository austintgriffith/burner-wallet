const fs = require('fs');
module.exports = {
  'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol': fs.readFileSync('openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol', 'utf8'),
  'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync('openzeppelin-solidity/contracts/math/SafeMath.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol': fs.readFileSync('openzeppelin-solidity/contracts/token/ERC20/ERC20.sol', 'utf8'),
  'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol': fs.readFileSync('openzeppelin-solidity/contracts/token/ERC20/IERC20.sol', 'utf8'),
  'openzeppelin-solidity/contracts/access/roles/MinterRole.sol': fs.readFileSync('openzeppelin-solidity/contracts/access/roles/MinterRole.sol', 'utf8'),
  'openzeppelin-solidity/contracts/access/Roles.sol': fs.readFileSync('openzeppelin-solidity/contracts/access/Roles.sol', 'utf8'),
  'openzeppelin-solidity/contracts/ownership/Ownable.sol': fs.readFileSync('openzeppelin-solidity/contracts/ownership/Ownable.sol', 'utf8'),
}
