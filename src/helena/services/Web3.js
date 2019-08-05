import Web3 from 'web3';
import { getConfig } from '../utils/config';

export default class Web3Service {
  get web3IsPresent() {
    return !!this.web3;
  }

  constructor(web3) {
    this.web3 = web3;
  }

  async init() {
    // await window.web3.currentProvider.enable();
    // this.web3 = new Web3(window.web3.currentProvider);

    // setInterval(async () => {
    //   const accounts = await this.web3.eth.getAccounts();
    //   this.account = accounts[0];
    // }, 1000);
    return true;
  }

  async getNetworkId() {
    if (!this.isReady()) {
      return 'web3 not ready';
    }
    const networkId = await this.web3.eth.net.getId();
    return networkId;
  }

  async getAccount() {
    if (!this.isReady()) {
      return 'web3 not ready';
    }
    const accounts = await this.web3.eth.getAccounts();

    return accounts && accounts.length ? accounts[0] : null;
  }

  async getBalance() {
    if (!this.isReady()) {
      return 'web3 not ready';
    }
    if (!this.account) {
      throw new Error('No Account available');
    }

    const balance = await this.web3.eth.getBalance(this.account);

    if (typeof balance !== 'undefined') {
      return balance;
      // return weiToEth(balance.toString());
    }

    throw new Error('Invalid Balance');
  }

  isReady() {
    return !!this.web3;
  }
}
