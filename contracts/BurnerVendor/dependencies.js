const fs = require('fs');
module.exports = {
  'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync(
    './node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol',
    'utf8'
  ),
  'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol': fs.readFileSync(
    './node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol',
    'utf8'
  ),
  'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol': fs.readFileSync(
    './node_modules/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol',
    'utf8'
  ),
  'openzeppelin-solidity/contracts/access/Roles.sol': fs.readFileSync(
    './node_modules/openzeppelin-solidity/contracts/access/Roles.sol',
    'utf8'
  ),
  'openzeppelin-solidity/contracts/ownership/Ownable.sol': fs.readFileSync(
    './node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol',
    'utf8'
  ),
  'ERC20Vendable.sol': fs.readFileSync(
    'contracts/ERC20Vendable/ERC20Vendable.sol',
    'utf8'
  ),
};
