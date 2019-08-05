import React from 'react';
import cn from 'classnames/bind';
import Decimal from 'decimal.js';
import style from '../index.scss';

const cx = cn.bind(style);

const getAverageCost = (order) =>
  new Decimal(order.price)
    .div(order.outcomeToken.outcomeTokenCount)
    .toDP(4, 1)
    .toString();

const TradeRow = ({
  trade,
  outcomeColorStyle,
  tradeDate,
  outcomeName,
  tradeCost
}) => (
  <tr className={cx('shareTableRow')}>
    <td>
      <div className={cx('shareOutcomeColor')} style={outcomeColorStyle} />
    </td>
    <td>{trade.orderType}</td>
    <td>{outcomeName}</td>
    <td>
      {new Decimal(trade.outcomeToken.outcomeTokenCount)
        .div(1e18)
        .toDP(4, 1)
        .toString()}
    </td>
    <td>{getAverageCost(trade)}&nbsp; xP+</td>
    <td>{tradeDate}</td>
    <td>{tradeCost}</td>
  </tr>
);

export default TradeRow;
