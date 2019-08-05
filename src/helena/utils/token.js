import Decimal from 'decimal.js';
import { getROHelenaConnection } from './pm';
import { getCollateralToken } from './config';
import { web3Service } from '../services';

export const getTokenSymbol = async (tokenAddress) => {
  const helena = await getROHelenaConnection();
  const token = await helena.contracts.HumanFriendlyToken.at(tokenAddress);
  const tokenSymbol = await token.symbol();
  return tokenSymbol;
};

export const getTokenBalance = async () => {
  const tokenAddress = getCollateralToken();
  const account = await web3Service.getAccount();
  const helena = await getROHelenaConnection();
  const token = await helena.contracts.Token.at(tokenAddress);
  const balance = await token.balanceOf(account);
  return balance.toString();
};

export const parseTokenValue = (value) => {
  return new Decimal(value)
    .div(1e18)
    .toDP(4)
    .toString();
};
