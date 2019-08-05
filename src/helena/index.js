import React from 'react';
import Decimal from 'decimal.js';
import Market from './views/Market';
import { initHelenaConnection, initReadOnlyHelenaConnection } from './utils/pm';
import { initServices, pmService } from './services';

Decimal.set({ toExpPos: 9999, precision: 50 });

export default class OneMarket {
  constructor({ web3, tokenAddress }) {
    this.web3 = web3;
    this.tokenAddress = tokenAddress;
  }

  async init() {
    console.log('Loading Helena services...');
    await Promise.all([initReadOnlyHelenaConnection(), initHelenaConnection()]);
    await initServices({ web3: this.web3 });
  }

  market({ marketId }) {
    return <Market marketId={marketId} />;
  }

  async getMarkets() {
    return pmService.getMarkets();
  }
}
