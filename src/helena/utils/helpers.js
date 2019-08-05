import { OUTCOME_TYPES } from '../utils/constants';
import Decimal from 'decimal.js';

export const getOutcomeName = (market, index) => {
  let outcomeName;
  if (!market.outcomes) {
    return null;
  }

  if (market.type === OUTCOME_TYPES.CATEGORICAL) {
    outcomeName = market.outcomes[index];
  } else if (market.type === OUTCOME_TYPES.SCALAR) {
    outcomeName = index === 0 ? 'Short' : 'Long';
  }
  return outcomeName;
};

export const normalizeScalarPoint = (
  marginalPrices,
  { bounds: { lower, upper, decimals } }
) => {
  const bigDecimals = parseInt(decimals, 10);

  const bigUpperBound = Decimal(upper).div(10 ** bigDecimals);
  const bigLowerBound = Decimal(lower).div(10 ** bigDecimals);

  const bounds = bigUpperBound.sub(bigLowerBound);
  return Decimal(marginalPrices[1].toString())
    .times(bounds)
    .add(bigLowerBound)
    .toDP(decimals)
    .toNumber();
};

export const hexWithoutPrefix = (value) =>
  value.startsWith('0x') ? value.substring(2) : value;
