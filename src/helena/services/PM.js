import { Trade } from '../models/Trade';
import { web3Service } from './index';
import { hexWithoutPrefix } from '../utils/helpers';
import { CategoricalMarket, ScalarMarket } from '../models/Market';
import { getCollateralToken } from '../utils/config';

class PMService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  newMarket(market) {
    return market.event.type === 'CATEGORICAL'
      ? new CategoricalMarket(market)
      : new ScalarMarket(market);
  }

  getMarkets() {
    return this.httpService.get('/markets').then((response) => {
      if (!response.results) {
        return [];
      }

      const records = response.results.map(this.newMarket);
      const collateralToken = getCollateralToken();
      const filteredRecords = records.filter(
        (market) =>
          `0x${market.collateralToken.toLowerCase()}` ===
          collateralToken.toLowerCase()
      );
      return filteredRecords;
    });
  }

  getMarket(marketId) {
    return this.httpService.get(`/markets/${marketId}`).then((response) => {
      if (!response) {
        return {};
      }
      return this.newMarket(response);
    });
  }

  getMarketTrades(marketId) {
    return this.httpService
      .get(`/markets/${marketId}/trades`)
      .then((response) => {
        if (response && response.results.length) {
          return response.results.map((trade) => new Trade(trade));
        }

        return [];
      });
  }

  async getAccountTrades(marketId) {
    const account = await web3Service.getAccount();
    const normalizedAccount = hexWithoutPrefix(account);
    return this.httpService
      .get(`/markets/${marketId}/trades/${normalizedAccount.toLowerCase()}`)
      .then((response) => {
        if (response && response.results.length) {
          return response.results.map((trade) => new Trade(trade));
        }

        return [];
      });
  }
}

export default PMService;
