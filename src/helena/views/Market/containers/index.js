import React from 'react';
import cn from 'classnames/bind';
import Overview from './Overview';
import Bet from './Bet/index';
import Graph from './Graph';
import { pmService, web3Service } from '../../../services';
import { getTokenBalance } from '../../../utils/token';

import styles from './index.scss';

const cx = cn.bind(styles);
const INTERVAL_MARKET_REFRESH = 15000;
const INTERVAL_BALANCE_REFRESH = 3000;

export default class Market extends React.Component {
  constructor(props) {
    super(props);
    this.address = props.marketId;

    this.state = {
      direction: 1,
      index: 0,
      market: {},
      balance: null,
      web3Ready: web3Service.isReady()
    };
  }

  componentDidMount() {
    this.refreshMarket();

    this.marketInterval = setInterval(
      this.refreshMarket,
      INTERVAL_MARKET_REFRESH
    );

    this.balanceInterval = setInterval(() => {
      if (web3Service.isReady()) {
        getTokenBalance().then((balance) => this.setState({ balance }));
      }
    }, INTERVAL_BALANCE_REFRESH);
  }

  componentWillUnmount() {
    clearInterval(this.marketInterval);
    clearInterval(this.balanceInterval);
  }

  toggle = (step) => (e) => {
    this.setState((prevState) => {
      let direction;
      if (prevState.index === 0 && step === 1) {
        direction = 1;
      } else if (prevState.index === 0 && step === 2) {
        direction = -1;
      } else if (prevState.index === 1 && step === 0) {
        direction = -1;
      } else if (prevState.index === 2 && step === 0) {
        direction = 1;
      }
      return { index: step, direction };
    });
  };

  onBet = (ev) => {
    if (!web3Service.isReady()) {
      web3Service
        .init()
        .then(() => getTokenBalance())
        .then((balance) => {
          this.setState({ balance, web3Ready: true });
        })
        .catch((error) => console.log(error));
    }

    this.toggle(1)();
  };

  refreshMarket = () => {
    return pmService.getMarket(this.address).then((market) => {
      this.setState({ market });
    });
  };

  render() {
    const { index, market, balance, direction } = this.state;

    if (!market.title) {
      return 'Loading';
    }

    const overview = (
      <Overview
        onDetail={this.toggle(2)}
        onBet={this.onBet}
        market={market}
        balance={balance}
      />
    );

    const canInteract = this.state.web3Ready && this.state.balance > 0;
    const bet = (
      <Bet
        market={market}
        onOverview={this.toggle(0)}
        balance={balance}
        canInteract={canInteract}
        loading={!this.state.web3Ready}
        refreshMarket={this.refreshMarket}
      />
    );
    const graph = <Graph onOverview={this.toggle(0)} market={market} />;
    // const pages = [
    //   (style) => <animated.div style={{ ...style }}>{overview}</animated.div>,
    //   (style) => <animated.div style={{ ...style }}>{bet}</animated.div>,
    //   (style) => <animated.div style={{ ...style }}>{graph}</animated.div>
    // ];
    const pages = [overview, bet, graph];
    return (
      <div className={cx('container')}>
        <div className={cx('main')}>
        {pages[index]}
        </div>
      </div>
    );
  }
}
