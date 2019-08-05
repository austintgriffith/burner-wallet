import React from 'react';
import Button from '../../../../ui-components/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import ArrowLeft from '@material-ui/icons/ArrowLeft';
import History from '@material-ui/icons/History';
import CompareArrows from '@material-ui/icons/CompareArrows';
import Toll from '@material-ui/icons/Toll';

import cn from 'classnames/bind';
import BuyTokens from './BuyTokens';
import MyShares from './MyShares';
import MyTrades from './MyTrades';
import { parseTokenValue } from '../../../../utils/token'
import style from './index.scss';

const cx = cn.bind(style);

export default class Bet extends React.Component {
  state = {
    value: 0
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const {
      onOverview,
      balance,
      amount,
      onChangeAmount,
      errorAmount,
      market,
      trades,
      onChangeOutcome,
      selectedOutcome,
      outcomeTokensSold,
      handleBuyTokens,
      canBet
    } = this.props;

    const { value } = this.state;

    const formattedBalance = parseTokenValue(balance);
    return (
      <div>
        <div style={{ width: '100%' }}>
          <div className={cx('title-header')}>
            <div className={cx('title')}>{market.title}</div>
          </div>
          <div style={{ display: 'flex' }}>
            <div className={cx('tab-content')}>
              <BuyTokens
                amount={amount}
                onChangeAmount={onChangeAmount}
                errorAmount={errorAmount}
                onChangeOutcome={onChangeOutcome}
                selectedOutcome={selectedOutcome}
                market={market}
                outcomeTokensSold={outcomeTokensSold}
                handleBuyTokens={handleBuyTokens}
                canBet={canBet}
              />
              {/* {value === 0 && (
                <BuyTokens
                  amount={amount}
                  onChangeAmount={onChangeAmount}
                  errorAmount={errorAmount}
                  onChangeOutcome={onChangeOutcome}
                  selectedOutcome={selectedOutcome}
                  market={market}
                  outcomeTokensSold={outcomeTokensSold}
                  handleBuyTokens={handleBuyTokens}
                  canBet={canBet}
                />
              )} */}
              {/* {value === 1 && <MyShares />} */}
              {/* {value === 2 && <MyTrades trades={trades} market={market} />} */}
            </div>
          </div>
        </div>
        <div className={cx('market-nav')}>
          <Button variant="outlined" size="small" className={cx('nav-button', 'pull-left')} onClick={onOverview}>
            <ArrowLeft />
            Back to Market
          </Button>
        </div>
        {/* <Tabs
          value={this.state.value}
          onChange={this.handleChange}
          variant="fullWidth"
          classes={{
            root: cx('tabs-root'),
            indicator: cx('tabs-indicator'),
            flexContainer: cx('tabs-flex')
          }}
        >
          <Tab
            classes={{ root: cx('tab-root'), selected: cx('tab-selected') }}
            icon={<Toll className={cx('icon')} />}
          />
          <Tab
            classes={{ root: cx('tab-root'), selected: cx('tab-selected') }}
            icon={<CompareArrows className={cx('icon')} />}
          />
          {/* <Tab
            classes={{ root: cx('tab-root'), selected: cx('tab-selected') }}
            icon={<History className={cx('icon')} />}
          />
        </Tabs> */}
      </div>
    );
  }
}
