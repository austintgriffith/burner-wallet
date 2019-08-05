import React from 'react';
import cn from 'classnames/bind';
import Radio from '@material-ui/core/Radio';
import { calcLMSRMarginalPrice } from '../../../../utils/pm';
import style from './outcomeCategorical.scss';
import { COLOR_SCHEME_DEFAULT } from '../../../../utils/constants';

const cx = cn.bind(style);

const OutcomeCategorical = ({
  resolved,
  outcomeTokensSold,
  funding,
  resolution,
  outcomes,
  canSelect, // Will show the button to select the outcome
  onChange,
  selectedOutcome
}) => {
  const tokenDistribution = outcomes.map((outcome, outcomeIndex) => {
    const marginalPrice = calcLMSRMarginalPrice({
      netOutcomeTokensSold: outcomeTokensSold,
      funding,
      outcomeTokenIndex: outcomeIndex
    });

    return marginalPrice.toFixed(5);
  });

  // show all outcomes
  return (
    <div>
      {outcomes.map((outcome, outcomeIndex) => {
        const outcomeBarStyle = {
          width: `${tokenDistribution[outcomeIndex] * 100}%`,
          backgroundColor: COLOR_SCHEME_DEFAULT[outcomeIndex]
        };
        const tokenDistributionPercent = `${Math.round(
          tokenDistribution[outcomeIndex] * 100
        ).toFixed(0)}%`;

        return (
          <div key={outcome} className={cx('outcome')}>
            {canSelect && (
              <Radio
                classes={{ root: cx('outcome-control') }}
                checked={selectedOutcome === outcomeIndex}
                onChange={onChange(outcomeIndex)}
                value="no"
                name="outcome-no"
                aria-label="B"
              />
            )}
            <div className={cx('outcomeBar')}>
              <div className={cx('outcomeBarInner')} style={outcomeBarStyle}>
                <div className={cx('outcomeBarLabel')}>
                  {outcomes[outcomeIndex]}
                  <div className={cx('outcomeBarValue')}>
                    {tokenDistributionPercent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OutcomeCategorical;
