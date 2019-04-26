import React, { Component } from 'react';
import { ERC20TOKEN } from '../config';

const sortByBlockNumberDESC = (a, b) => {
  if(b.blockNumber > a.blockNumber){
    return -1
  }
  if(b.blockNumber < a.blockNumber){
    return 1
  }
  return 0
}
const sortByBlockNumber = (a, b) => {
  if(b.blockNumber < a.blockNumber){
    return -1
  }
  if(b.blockNumber > a.blockNumber){
    return 1
  }
  return 0
}

const { Provider, Consumer } = React.createContext({});

export default class TransactionStoreProvider extends Component {

  state = {
    recentTxs: [],
    fullRecentTxs: [],
    transactionsByAddress: {},
    fullTransactionsByAddress: {},
  };

  initRecentTxs(account){
    let recentTxs = [];
    if (this.state.recentTx){ recentTxs = [...this.state.recentTx];}

    let transactionsByAddress = { ...this.state.transactionsByAddress };
    if(recentTxs.length === 0) {
      recentTxs = localStorage.getItem(`${account}recentTxs`);
      try{
        recentTxs = JSON.parse(recentTxs);
      } catch(e) {
        recentTxs = [];
      }
    }

    if(Object.keys(transactionsByAddress).length === 0){
      transactionsByAddress = localStorage.getItem(`${account}transactionsByAddress`);
      try{
        transactionsByAddress = JSON.parse(transactionsByAddress);
      } catch(e) {
        transactionsByAddress = {};
      }
    }
    if(!transactionsByAddress){
      transactionsByAddress = {}
    }
    return [recentTxs, transactionsByAddress]
  }

  addTxIfAccountMatches = (account, smallerTx) => {
    let recentTxs = [...this.state.recentTxs];
    let transactionsByAddress = { ...this.state.transactionsByAddress };
    let updatedTxs = false

    let otherAccount = smallerTx.to
    if(smallerTx.to === account){
      otherAccount = smallerTx.from
    }
    if(!transactionsByAddress[otherAccount]){
      transactionsByAddress[otherAccount] = []
    }

    let found = false
    if(parseFloat(smallerTx.value) > 0.005){
      for(let r in recentTxs){
        if(recentTxs[r].hash === smallerTx.hash/* && (!smallerTx.data || recentTxs[r].data == smallerTx.data)*/){
          found = true
          if(!smallerTx.data || recentTxs[r].data === smallerTx.data){
            // do nothing, it exists
          }else{
            recentTxs[r].data = smallerTx.data
            updatedTxs=true
          }
        }
      }
      if(!found){
        updatedTxs=true
        recentTxs.push(smallerTx)
        //console.log("recentTxs after push",recentTxs)
      }
    }

    found = false
    for(let t in transactionsByAddress[otherAccount]){
      if(transactionsByAddress[otherAccount][t].hash === smallerTx.hash/* && (!smallerTx.data || recentTxs[r].data == smallerTx.data)*/){
        found = true
        if(!smallerTx.data || transactionsByAddress[otherAccount][t].data === smallerTx.data){
          // do nothing, it exists
        }else{
          transactionsByAddress[otherAccount][t].data = smallerTx.data
          if(smallerTx.encrypted) transactionsByAddress[otherAccount][t].encrypted = true
          updatedTxs=true
        }
      }
    }
    if(!found) {
      updatedTxs=true
      transactionsByAddress[otherAccount].push(smallerTx)
    }

    this.setState({ transactionsByAddress, recentTxs });

    return updatedTxs
  }

  sortAndSaveTransactions = (account) => {
    let recentTxs = [...this.state.recentTxs];
    let transactionsByAddress = {...this.state.transactionsByAddress};
    recentTxs.sort(sortByBlockNumber)

    for(let t in transactionsByAddress){
      transactionsByAddress[t].sort(sortByBlockNumberDESC)
    }
    recentTxs = recentTxs.slice(0,12)
    localStorage.setItem(`${account}recentTxs`, JSON.stringify(recentTxs))
    localStorage.setItem(`${account}transactionsByAddress`, JSON.stringify(transactionsByAddress))

    this.setState({ recentTxs, transactionsByAddress }, () => {
      if(ERC20TOKEN){
        this.syncFullTransactions(account);
      }
    })
  }

  async addAllTransactionsFromList(recentTxs,transactionsByAddress,theList){
    let updatedTxs = false

    for(let e in theList){
      let thisEvent = theList[e]
      let cleanEvent = Object.assign({},thisEvent)
      cleanEvent.to = cleanEvent.to.toLowerCase()
      cleanEvent.from = cleanEvent.from.toLowerCase()
      cleanEvent.value = this.state.web3.utils.fromWei(""+cleanEvent.value,'ether')
      cleanEvent.token = ERC20TOKEN
      if(cleanEvent.data) {
        let decrypted = await this.decryptInput(cleanEvent.data)
        if(decrypted){
          cleanEvent.data = decrypted
          cleanEvent.encrypted = true
        } else {
          try {
            cleanEvent.data = this.state.web3.utils.hexToUtf8(cleanEvent.data)
          } catch(e) {}
        }
      }
      updatedTxs = this.addTxIfAccountMatches(recentTxs,transactionsByAddress,cleanEvent) || updatedTxs
    }
    return updatedTxs
  }

  syncFullTransactions(account) {
    let [recentTxs, transactionsByAddress] = this.initRecentTxs(account);

    let updatedTxs = false
    updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferTo) || updatedTxs
    updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferFrom) || updatedTxs
    updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferToWithData) || updatedTxs
    updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferFromWithData) || updatedTxs

    if(updatedTxs || !this.state.fullRecentTxs || !this.state.fullTransactionsByAddress){
      recentTxs.sort(sortByBlockNumber)
      for(let t in transactionsByAddress){
        transactionsByAddress[t].sort(sortByBlockNumberDESC)
      }
      recentTxs = recentTxs.slice(0,12)
      //console.log("FULLRECENT",recentTxs)
      this.setState({ fullRecentTxs: recentTxs, fullTransactionsByAddress: transactionsByAddress })
    }
  }

  resetTransactionStore = (account) => {
    this.setState({
      transactionsByAddress: {},
      recentTxs: [],
      fullTransactionsByAddress: {},
      fullRecentTxs: [],
    });
    localStorage.setItem(account + "recentTxs", "[]");
    localStorage.setItem(account + "transactionsByAddress", "{}");
  }


  render() {
    const {children} = this.props;
    const { transactionsByAddress, recentTxs, fullTransactionsByAddress, fullRecentTxs } = this.state
    const { resetTransactionStore, sortAndSaveTransactions, addTxIfAccountMatches } = this;

    // App component that provides initial context values
    return (
      <Provider value={{
        resetTransactionStore,
        sortAndSaveTransactions,
        addTxIfAccountMatches,

        transactionsByAddress,
        recentTxs,
        fullTransactionsByAddress,
        fullRecentTxs,
      }}>
        {children}
      </Provider>
    );
  }
}

export const withTransactionStore = WrappedComponent => props => (
  <Consumer>
    {(store) => <WrappedComponent {...store} {...props} />}
  </Consumer>
);
