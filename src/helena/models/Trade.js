import moment from 'moment';
import sha1 from 'sha1';
import { OUTCOME_TYPES } from '../utils/constants';

const OUTCOMES_SCALAR = ['Short', 'Long'];

export class Trade {
  constructor(trade) {
    const {
      outcomeToken: selectedOutcomeToken,
      outcomeTokenCount,
      collateralToken: collateralTokenAddress,
      cost,
      owner,
      profit: rawProfit,
      orderType,
      marginalPrices,
      date,
      eventDescription: {
        title: marketTitle,
        outcomes: marketOutcomeLabels
      } = {}
    } = trade;

    const profit = rawProfit === 'None' ? '0' : rawProfit;
    const price = orderType === 'BUY' ? cost : profit;
    const id = sha1(
      `${owner}-${orderType}-${price}-${date}-${
        selectedOutcomeToken.index
      }-${outcomeTokenCount}`
    );
    const marketType =
      typeof marketOutcomeLabels !== 'undefined'
        ? OUTCOME_TYPES.CATEGORICAL
        : OUTCOME_TYPES.SCALAR;
    const outcomeToken = {
      index: selectedOutcomeToken.index,
      name:
        typeof marketOutcomeLabels !== 'undefined'
          ? marketOutcomeLabels[selectedOutcomeToken.index]
          : OUTCOMES_SCALAR[selectedOutcomeToken.index],
      outcomeTokenCount
    };

    const record = {
      id,
      date: moment.utc(date),
      collateralTokenAddress,
      eventAddress: selectedOutcomeToken.event,
      outcomeToken,
      outcomeTokenCount,
      price,
      marketTitle,
      marketType,
      owner,
      orderType,
      marginalPrices
    };

    Object.assign(this, record);
  }
}
