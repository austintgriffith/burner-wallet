import Decimal from 'decimal.js';
import { calcLMSROutcomeTokenCount, getHelenaConnection } from '../../../../../../utils/pm';

const NUMBER_REGEXP = /^-?\d+\.?\d*$/;
const LIMIT_MARGIN = '5';

const getOutcomeTokenCount = (
  market,
  investment,
  outcomeIndex,
  limitMargin
) => {
  if (
    !market ||
    !investment ||
    !String(outcomeIndex) ||
    !NUMBER_REGEXP.test(investment) ||
    parseFloat(investment) < 0
  ) {
    return Decimal(0);
  }

  const invest = new Decimal(investment)
    .mul(1e18)
    .div(new Decimal(100).add(limitMargin || LIMIT_MARGIN))
    .mul(100)
    .round();
  const { funding, outcomeTokensSold, fee } = market;

  let outcomeTokenCount;
  try {
    outcomeTokenCount = calcLMSROutcomeTokenCount({
      feeFactor: fee,
      netOutcomeTokensSold: outcomeTokensSold,
      funding,
      outcomeTokenIndex: parseInt(outcomeIndex, 10),
      cost: invest.toString()
    });
  } catch (e) {
    console.error(e);
    return Decimal(0);
  }
  return outcomeTokenCount;
};

const getMaximumWin = (outcomeTokenCount, investment) => {
  if (
    !NUMBER_REGEXP.test(investment) ||
    !parseFloat(investment) > 0 ||
    !outcomeTokenCount
  ) {
    return Decimal(0);
  }

  return Decimal(outcomeTokenCount)
    .sub(Decimal(investment).mul(1e18))
    .div(1e18);
};

const getPercentageWin = (outcomeTokenCount, investment) => {
  if (
    !NUMBER_REGEXP.test(investment) ||
    !parseFloat(investment) > 0 ||
    !outcomeTokenCount
  ) {
    return Decimal(0);
  }

  const invest = new Decimal(investment).mul(1e18);
  return Decimal(outcomeTokenCount)
    .div(invest)
    .mul(100)
    .sub(100);
};

const buyShares = async (
  market,
  outcomeTokenIndex,
  outcomeTokenCount,
  cost
) => {
  const helena = await getHelenaConnection();

  const collateralTokenWei = Decimal(cost)
    .mul(1e18)
    .toString();

  // buyOutComeTokens handles approving
  const collateralTokensPaid = await helena.buyOutcomeTokens({
    market: market.address,
    outcomeTokenIndex,
    outcomeTokenCount: outcomeTokenCount.toString(),
    cost: collateralTokenWei
  });

  return collateralTokensPaid;
};

export {
  getOutcomeTokenCount,
  getMaximumWin,
  getPercentageWin,
  NUMBER_REGEXP,
  buyShares
};
