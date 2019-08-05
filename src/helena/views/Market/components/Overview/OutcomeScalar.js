import React from 'react';
import cn from 'classnames/bind';
import Decimal from 'decimal.js';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import FormControlLabel from '@material-ui/core/FormControlLabel';

import DecimalValue from '../../../../ui-components/DecimalValue';
import style from './outcomeScalar.scss';
import { calcLMSRMarginalPrice } from '../../../../utils/pm';

const cx = cn.bind(style);

const OutcomeScalar = ({
  resolved: showOnlyWinningOutcome,
  outcomeTokensSold,
  funding,
  upperBound,
  lowerBound,
  unit,
  decimals: decimalsRaw,
  winningOutcome,
  canSelect,
  onChange,
  selectedOutcome,
  onChangeOutcome
}) => {
  const marginalPrice = calcLMSRMarginalPrice({
    netOutcomeTokensSold: outcomeTokensSold,
    funding,
    outcomeTokenIndex: 1 // always calc for long when calculating estimation
  });

  const decimals = Math.max(decimalsRaw, 0);

  const lower = Decimal(lowerBound).div(10 ** decimals);
  const upper = Decimal(upperBound).div(10 ** decimals);

  const bounds = Decimal(upper).sub(lower);
  const value = Decimal(marginalPrice)
    .times(bounds)
    .add(lower);

  const currentValueStyle = { left: `${marginalPrice.mul(100).toFixed(5)}%` };

  return (
    <div>
      <div className={cx('scalarOutcome')}>
        <div className={cx('outcomeBound', 'lower')}>
          {lower.toNumber().toLocaleString()}
          &nbsp;
          {unit}
        </div>
        <div className={cx('currentPrediction')}>
          <div className={cx('currentPredictionLine')} />
          <div
            className={cx('currentPredictionValue')}
            style={currentValueStyle}
          >
            <DecimalValue value={value} decimals={decimals} />
            &nbsp;
            {unit}
          </div>
        </div>
        <div className={cx('outcomeBound', 'upper')}>
          {upper.toNumber().toLocaleString()}
          &nbsp;
          {unit}
        </div>
      </div>
      {canSelect && (
        <div style={{ textAlign: 'center' }}>
          <FormControlLabel
            value="short"
            control={
              <Radio
                classes={{ root: cx('outcome-control') }}
                checked={selectedOutcome === 0}
                onChange={onChange(0)}
                value="short"
                name="outcome-short"
                aria-label="A"
              />
            }
            label="Short"
            labelPlacement="start"
          />
          <FormControlLabel
            value="long"
            classes={{ root: cx('control-label') }}
            control={
              <Radio
                classes={{ root: cx('outcome-control') }}
                checked={selectedOutcome === 1}
                onChange={onChange(1)}
                value="long"
                name="outcome-long"
                aria-label="B"
              />
            }
            label="Long"
            labelPlacement="end"
          />
        </div>
      )}
    </div>
  );
};

export default OutcomeScalar;
