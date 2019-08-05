import { normalizeScalarPoint, getOutcomeName } from '../../../../../utils/helpers';
import { OUTCOME_TYPES } from '../../../../../utils/constants';

const getFirstGraphPoint = (market) => {
  let firstPoint;
  if (OUTCOME_TYPES.SCALAR === market.type) {
    firstPoint = {
      date: new Date(market.creation).valueOf(),
      scalarPoint: normalizeScalarPoint(['0.5', '0.5'], market)
    };
  } else if (OUTCOME_TYPES.CATEGORICAL === market.type) {
    firstPoint = {
      date: new Date(market.creation).valueOf(),
      scalarPoint: undefined,
      ...market.outcomes.reduce((prev, current) => {
        const toReturn = {
          ...prev
        };
        toReturn[current] = 1 / market.outcomes.length;
        return toReturn;
      }, {})
    };
  }
  return firstPoint;
};

const getMarketGraph = (market, trades) => {
  const firstPoint = getFirstGraphPoint(market);

  if (trades.length === 0) {
    return [firstPoint, firstPoint];
  }

  const graphPoints = trades.map((trade) =>
    trade.marginalPrices.reduce(
      (prev, current, outcomeIndex) => {
        const toReturn = { ...prev };
        toReturn[getOutcomeName(market, outcomeIndex)] = current;
        return toReturn;
      },
      {
        date: new Date(trade.date).valueOf(),
        scalarPoint:
          OUTCOME_TYPES.SCALAR === market.type
            ? normalizeScalarPoint(trade.marginalPrices, market)
            : undefined
      }
    )
  );

  const lastPoint = {
    ...graphPoints[graphPoints.length - 1],
    date: new Date().valueOf()
  };

  return [firstPoint, ...graphPoints, lastPoint];
};

export default getMarketGraph;
