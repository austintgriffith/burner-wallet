import moment from 'moment';

export const MARKET_STAGES = {
  MARKET_CREATED: 0,
  MARKET_FUNDED: 1,
  MARKET_CLOSED: 2
};

export const isMarketClosed = ({ stage, resolution }) => {
  const stageClosed = stage !== MARKET_STAGES.MARKET_FUNDED;
  const marketExpired = moment.utc(resolution).isBefore(moment.utc());

  const marketClosed = stageClosed || marketExpired;
  return marketClosed;
};

export const isMarketEndingSoon = (resolutionDate) => {
  const threeDays = moment.utc().add(3, 'days');
  return moment.utc(resolutionDate).isSameOrBefore(threeDays);
};

export const isNewMarket = (creation) => {
  const threeDaysAgo = moment.utc().subtract(3, 'days');

  return threeDaysAgo.isBefore(creation);
};

export const isMarketResolved = ({ resolved }) => resolved;

export const isMarketClosedOrResolved = (market) =>
  isMarketClosed(market) || isMarketResolved(market);

export const isMarketFunded = (stage) => stage > MARKET_STAGES.MARKET_CREATED;

export class CategoricalMarket {
  constructor(market) {
    const {
      stage,
      contract: { address, creationDate, creator },
      tradingVolume,
      funding,
      fee,
      netOutcomeTokensSold,
      event: {
        contract: { address: eventAddress },
        type,
        collateralToken,
        isWinningOutcomeSet,
        oracle: {
          isOutcomeSet,
          outcome: winningOutcomeIndex,
          eventDescription: { title, description, resolutionDate, outcomes }
        }
      }
    } = market;

    const resolved = isOutcomeSet || isWinningOutcomeSet;
    const closed = isMarketClosed({ stage, resolution: resolutionDate });

    const marketRecord = {
      title,
      description,
      creator,
      collateralToken,
      address,
      stage,
      type,
      outcomes,
      eventAddress,
      resolution: resolutionDate,
      creation: creationDate,
      volume: tradingVolume,
      resolved,
      closed,
      fee,
      funding: funding || 0,
      winningOutcome: outcomes[winningOutcomeIndex],
      outcomeTokensSold: netOutcomeTokensSold
    };

    Object.assign(this, marketRecord);
  }

  get isScalar() {
    return false;
  }
}

const buildOutcomesFrom = (outcomes, outcomeTokensSold, marginalPrices) => {
  if (!outcomes) {
    return [];
  }

  const outcomesRecords = outcomes.map((outcome, index) => {
    return {
      name: outcome,
      index,
      marginalPrice: marginalPrices[index],
      outcomeTokensSold: outcomeTokensSold[index]
    };
  });

  return outcomesRecords;
};

const buildBoundsFrom = (lower, upper, unit, decimals) => ({
  lower,
  upper,
  unit,
  decimals: parseInt(decimals, 10)
});

export class ScalarMarket {
  constructor(market) {
    const {
      stage,
      contract: { address, creationDate, creator },
      tradingVolume,
      funding,
      netOutcomeTokensSold,
      fee,
      event: {
        contract: { address: eventAddress },
        type,
        collateralToken,
        lowerBound,
        upperBound,
        isWinningOutcomeSet,
        oracle: {
          isOutcomeSet,
          outcome,
          eventDescription: {
            title,
            description,
            resolutionDate,
            unit,
            decimals
          }
        }
      }
    } = market;

    const outcomesResponse = ['SHORT', 'LONG'];

    const outcomes = buildOutcomesFrom(
      outcomesResponse,
      netOutcomeTokensSold,
      market.marginalPrices
    );
    const bounds = buildBoundsFrom(lowerBound, upperBound, unit, decimals);

    const resolved = isOutcomeSet || isWinningOutcomeSet;
    const closed = isMarketClosed({ stage, resolution: resolutionDate });

    const marketRecord = {
      title,
      description,
      creator,
      collateralToken,
      address,
      stage,
      type,
      fee,
      lowerBound,
      upperBound,
      outcomes,
      bounds,
      eventAddress,
      resolution: resolutionDate,
      creation: creationDate,
      volume: tradingVolume,
      resolved,
      closed,
      winningOutcome: outcome,
      funding: funding || 0,
      outcomeTokensSold: netOutcomeTokensSold
    };

    Object.assign(this, marketRecord);
  }

  get isScalar() {
    return true;
  }
}
