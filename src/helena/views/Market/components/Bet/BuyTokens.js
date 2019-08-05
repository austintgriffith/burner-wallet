import React from 'react';
import GridContainer from '../../../../ui-components/Grid/GridContainer';
import GridItem from '../../../../ui-components/Grid/GridItem';
import Input from '../../../../ui-components/Input';
import cn from 'classnames/bind';
import Button from '../../../../ui-components/Button';
import style from './buyTokens.scss';
import OutcomeCategorical from '../Overview/OutcomeCategorical';
import OutcomeScalar from '../Overview/OutcomeScalar';

const cx = cn.bind(style);

const BuyTokens = ({
  amount,
  errorAmount,
  onChangeAmount,
  selectedOutcome,
  onChangeOutcome,
  outcomeTokensSold,
  market,
  handleBuyTokens,
  canBet
}) => {
  const { resolved, funding, resolution, outcomes } = market;
  const bounds = market.bounds
    ? {
        upperBound: market.bounds.upper,
        lowerBound: market.bounds.lower,
        unit: market.bounds.unit,
        decimals: market.bounds.decimals
      }
    : {};
  return (
    <div>
      <GridContainer style={{ width: '100%' }}>
        <GridItem xs={6}>
          {market.isScalar && (
            <OutcomeScalar
              resolved={resolved}
              outcomeTokensSold={outcomeTokensSold}
              funding={funding}
              winningOutcome
              canSelect
              onChange={onChangeOutcome}
              selectedOutcome={selectedOutcome}
              {...bounds}
            />
          )}
          {!market.isScalar && (
            <OutcomeCategorical
              resolved={resolved}
              funding={funding}
              resolution={resolution}
              outcomes={outcomes}
              outcomeTokensSold={outcomeTokensSold}
              onChange={onChangeOutcome}
              selectedOutcome={selectedOutcome}
              canSelect
            />
          )}
        </GridItem>

        <GridItem xs={6}>
          <GridContainer>
            <GridItem xs={12}>
              <Input
                id="amount"
                label="Amount"
                value={amount}
                onChange={onChangeAmount}
                fullWidth
                error={errorAmount}
                required
              />
            </GridItem>
            <GridItem xs={12}>
              <div style={{ textAlign: 'right', marginTop: '15px' }}>
                <Button
                  onClick={handleBuyTokens}
                  variant="outlined"
                  disabled={!canBet}
                >
                  BET
                </Button>
              </div>
            </GridItem>
          </GridContainer>
        </GridItem>
      </GridContainer>
    </div>
  );
};

export default BuyTokens;
