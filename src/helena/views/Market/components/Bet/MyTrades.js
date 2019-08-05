import React from 'react';
import {
  OUTCOME_TYPES,
  RESOLUTION_TIME,
  COLOR_SCHEME_SCALAR,
  COLOR_SCHEME_DEFAULT
} from '../../../../utils/constants';
import moment from 'moment';
import { getOutcomeName } from '../../../../utils/helpers';
import Decimal from 'decimal.js';
import cn from 'classnames/bind';
import TradeRow from './MyTradesTable/Row';
import TableHeader from './MyTradesTable/Header';
import style from './MyTradesTable/index.scss';

const cx = cn.bind(style);

const MyTrades = (props) => {
  function renderTrades() {
    const {
      market,
      trades,
      market: { type }
    } = props;
    const colorScheme =
      type === OUTCOME_TYPES.SCALAR
        ? COLOR_SCHEME_SCALAR
        : COLOR_SCHEME_DEFAULT;

    const tableRowElements = trades.map((trade) => {
      const outcomeColorStyle = {
        backgroundColor: colorScheme[trade.outcomeToken.index]
      };
      const tradeDate = moment
        .utc(trade.date)
        .local()
        .format(RESOLUTION_TIME.ABSOLUTE_FORMAT);
      const outcomeName = getOutcomeName(market, trade.outcomeToken.index);

      let tradeCost = '0';
      if (trade.price !== 'None') {
        tradeCost = (
          <React.Fragment>
            {Decimal(trade.price)
              .div(1e18)
              .toDP(2, 1)
              .toString()}
            &nbsp; xP+
          </React.Fragment>
        );
      }

      return (
        <TradeRow
          key={trade.id}
          trade={trade}
          tradeCost={tradeCost}
          outcomeColorStyle={outcomeColorStyle}
          tradeDate={tradeDate}
          outcomeName={outcomeName}
          collateralToken={market.collateralToken}
        />
      );
    });

    return tableRowElements;
  }

  return (
    <table className={cx('shareTable', 'table')}>
      <TableHeader />
      <tbody>{renderTrades()}</tbody>
    </table>
  );
};

export default MyTrades;
