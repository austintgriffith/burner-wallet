import React, { Component } from 'react';
import { ContractLoader, Dapparatus, Transactions } from "dapparatus";
import Web3 from 'web3';
import axios from 'axios';
import './App.scss';
import Header from './components/Header';
import NavCard from './components/NavCard';
import SendByScan from './components/SendByScan';
import SendToAddress from './components/SendToAddress';
import WithdrawFromPrivate from './components/WithdrawFromPrivate';
import RequestFunds from './components/RequestFunds';
import SendWithLink from './components/SendWithLink';
import ShareLink from './components/ShareLink'
import MainCard from './components/MainCard';
import BottomLinks from './components/BottomLinks';
import MoreButtons from './components/MoreButtons';
import RecentTransactions from './components/RecentTransactions';
import Footer from './components/Footer';
import Loader from './components/Loader';
import BurnWallet from './components/BurnWallet'

let WEB3_PROVIDER = 'http://0.0.0.0:8545', CLAIM_RELAY = 'http://0.0.0.0:18462';
if (window.location.hostname.indexOf("qreth") >= 0) {
  WEB3_PROVIDER = "https://mainnet.infura.io/v3/e59c464c322f47e2963f5f00638be2f8"
}
else if (window.location.hostname.indexOf("xdai") >= 0) {
  WEB3_PROVIDER = "https://dai.poa.network";
  CLAIM_RELAY = 'https://x.xdai.io'
}

const BLOCKS_TO_PARSE_PER_BLOCKTIME = 15

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 1.1,
      view: 'main',
      sendLink: "",
      sendKey: "",
      alert: null,
      loadingTitle:'loading...'
    };
    this.alertTimeout = null;
  }

  componentDidMount(){
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        this.changeView('send_to_address')
      }else if(window.location.pathname.length==134){
        let parts = window.location.pathname.split(";")
        let claimId = parts[0].replace("/","")
        let claimKey = parts[1]
        console.log("DO CLAIM",claimId,claimKey)
        this.setState({claimId,claimKey})
      }else if(window.location.pathname.length>=65&&window.location.pathname.length<=67){
        console.log("incoming private key")
        let privateKey = window.location.pathname.replace("/","")
        if(privateKey.indexOf("0x")!=0){
          privateKey="0x"+privateKey
        }
        console.log("!!! possibleNewPrivateKey",privateKey)
        this.setState({possibleNewPrivateKey:privateKey})
        window.history.pushState({},"", "/");
      }else{
        let parts = window.location.pathname.split(";")
        console.log("PARTS",parts)
        if(parts.length>=2){
          let sendToAddress = parts[0].replace("/","")
          let sendToAmount = parts[1]
          if(parseFloat(sendToAmount)>0 && sendToAddress.length==42){
            this.changeView('send_to_address')
          }
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    let { network, web3 } = this.state;
    if (web3 && network !== prevState.network && !this.checkNetwork()) {
      console.log("WEB3 DETECTED BUT NOT RIGHT NETWORK",web3, network, prevState.network);
      this.changeAlert({
        type: 'danger',
        message: 'Wrong Network. Please use Custom RPC endpoint: https://dai.poa.network or turn off MetaMask.'
      }, false)
    }
  };

  checkNetwork() {
    let { network } = this.state;
    return network === "xDai" || network === "Unknown";
  }

  checkClaim(tx, contracts) {
    //check if we are trying to claim
    if (this.state.claimId && this.state.claimKey) {
      this.changeView('claimer')
      if (this.state.balance > 0.005) {
        this.chainClaim(tx, contracts);
      } else {
        this.relayClaim();
      }
    }
  }

  chainClaim(tx, contracts) {
    console.log("DOING CLAIM ONCHAIN", this.state.claimId, this.state.claimKey, this.state.account);
    this.setState({sending: true})

    contracts.Links.funds(this.state.claimId).call().then((fund) => {
      if (fund) {
        this.setState({fund: fund})
        console.log("FUND: ", fund)

        let hashOfDestination = this.state.web3.utils.soliditySha3(
          {type: 'bytes32', value: this.state.claimId}, // fund id
          {type: 'address', value: this.state.account}, // destination address
          {type: 'uint256', value: fund[3]}, // nonce
          {type: 'address', value: contracts.Links._address} // contract address
        )
        console.log("hashOfDestination", hashOfDestination)
        console.log("this.state.claimKey", this.state.claimKey)
        let sig = this.state.web3.eth.accounts.sign(hashOfDestination, this.state.claimKey);
        sig = sig.signature;
        console.log("CLAIM TX:", this.state.claimId, sig, this.state.account)
        tx(contracts.Links.claim(this.state.claimId, sig, this.state.account), 150000, false, 0, (result) => {
          if (result) {
            console.log("CLAIMED!!!", result)
            this.setState({claimed: true})
            setTimeout(() => {
              this.setState({sending: false}, () => {
                //alert("DONE")
                window.location = "/"
              })
            }, 2000)
          }
        })
      }
    })
  }

  relayClaim() {
    console.log("DOING CLAIM THROUGH RELAY")
    this.state.contracts.Links.funds(this.state.claimId).call().then((fund) => {
      if (fund) {
        this.setState({fund: fund})
        console.log("FUND: ", fund)

        let hashOfDestination = this.state.web3.utils.soliditySha3(
          {type: 'bytes32', value: this.state.claimId}, // fund id
          {type: 'address', value: this.state.account}, // destination address
          {type: 'uint256', value: fund[3]}, // nonce
          {type: 'address', value: this.state.contracts.Links._address} // contract address
        )
        console.log("hashOfDestination", hashOfDestination)
        console.log("this.state.claimKey", this.state.claimKey)
        let sig = this.state.web3.eth.accounts.sign(hashOfDestination, this.state.claimKey);
        sig = sig.signature
        console.log("CLAIM TX:", this.state.claimId, sig, this.state.account)

        this.setState({sending: true})
        let postData = {
          id: this.state.claimId,
          sig: sig,
          dest: this.state.account
        }
        console.log("CLAIM_RELAY:", CLAIM_RELAY)
        axios.post(CLAIM_RELAY + "/link", postData, {
          headers: {
            'Content-Type': 'application/json',
          }
        }).then((response) => {
          console.log("TX RESULT", response.data.transactionHash)
          this.setState({claimed: true})
          setTimeout(() => {
            this.setState({sending: false}, () => {
              //alert("DONE")
              window.location = "/"
            })
          }, 2000)
        })
          .catch((error) => {
            console.log(error);
          });
      }
    })
  }


  changeView = (view) => {
    if (view.startsWith('send_with_link')||view.startsWith('send_to_address')) {
      console.log("This is a send...")
      if (this.state.balance <= 0) {
        console.log("no funds...")
        this.changeAlert({
          type: 'danger',
          message: 'Insufficient funds',
        });
        return;
      }
    }
    this.changeAlert(null);
    console.log("Setting state",view)
    this.setState({ view });
  };

  changeAlert = (alert, hide=true) => {
    clearTimeout(this.alertTimeout);
    this.setState({ alert });
    if (alert && hide) {
      this.alertTimeout = setTimeout(() => {
        this.setState({ alert: null });
      }, 2000);
    }
  };
  goBack(){
    console.log("GO BACK")
    this.changeView('main')
    setTimeout(()=>{window.scrollTo(0,0)},60)
  }
  async parseBlocks(parseBlock,recentTxs){
    let block = await this.state.web3.eth.getBlock(parseBlock)
    let transactions = block.transactions
    let updatedTxs = false
    //console.log("transactions",transactions)
    for(let t in transactions){
      //console.log("TX",transactions[t])
      let tx = await this.state.web3.eth.getTransaction(transactions[t])
      if(tx.to && tx.from){
        let smallerTx = {
          hash:tx.hash,
          to:tx.to.toLowerCase(),
          from:tx.from.toLowerCase(),
          value:this.state.web3.utils.fromWei(""+tx.value,"ether"),
          blockNumber:tx.blockNumber
        }
        //console.log(smallerTx)
        if(smallerTx.from==this.state.account || smallerTx.to==this.state.account){
          let found = false
          for(let r in recentTxs){
            if(recentTxs[r].hash==smallerTx.hash){
              found=true
              break
            }
          }
          if(!found){
            console.log("+TX",smallerTx)
            //console.log("recentTxs length is ",recentTxs.length)
            recentTxs.push(smallerTx)
            updatedTxs=true
          }
        }
      }
    }
    return {recentTxs,updatedTxs}
  }
  render() {
    let {
      web3, account, tx, gwei, block, avgBlockTime, etherscan, balance, metaAccount, burnMetaAccount, view, alert,
      send
    } = this.state;


    let web3_setup = ""
    if(web3){
      web3_setup = (
        <div>
          <ContractLoader
            key="ContractLoader"
            config={{DEBUG: true}}
            web3={web3}
            require={path => {
              return require(`${__dirname}/${path}`)
            }}
            onReady={(contracts, customLoader) => {
              console.log("contracts loaded", contracts)
              this.setState({contracts: contracts}, async () => {
                console.log("Contracts Are Ready:", contracts)
                this.checkClaim(tx, contracts);
              })
            }}
          />
          <Transactions
            key="Transactions"
            config={{DEBUG: false, hide: true}}
            account={account}
            gwei={gwei}
            web3={web3}
            block={block}
            avgBlockTime={avgBlockTime}
            etherscan={etherscan}
            metaAccount={metaAccount}
            onReady={(state) => {
              console.log("Transactions component is ready:", state);
              this.setState(state)

            }}
            onReceipt={(transaction, receipt) => {
              // this is one way to get the deployed contract address, but instead I'll switch
              //  to a more straight forward callback system above
              console.log("Transaction Receipt", transaction, receipt)
            }}
          />
        </div>
      )
    }
    return (
      <div>
        {web3_setup}

        <div className="container-fluid">
          <Header
            changeView={this.changeView}
            balance={balance}
          />
          {web3 && this.checkNetwork() && (() => {
            console.log("VIEW:",view)
            switch(view) {
              case 'main':
                return (
                  <div>
                    <MainCard
                      address={account}
                      balance={balance}
                      changeAlert={this.changeAlert}
                      changeView={this.changeView}
                    />
                    <RecentTransactions
                      address={account}
                      block={this.state.block}
                      recentTxs={this.state.recentTxs}
                    />
                    <MoreButtons
                      balance={balance}
                      changeView={this.changeView}
                      privateKey={metaAccount.privateKey}
                      changeAlert={this.changeAlert}
                    />
                    <BottomLinks/>
                  </div>
                );
              case 'send_by_scan':
                return (
                  <SendByScan
                    goBack={this.goBack.bind(this)}
                    changeView={this.changeView}
                    onError={(error) =>{
                      this.changeAlert("danger",error)
                    }}
                  />
                );
              case 'withdraw_from_private':
                return (
                  <div>
                    <NavCard title={'Withdraw'} goBack={this.goBack.bind(this)}/>
                    <WithdrawFromPrivate
                      balance={balance}
                      address={account}
                      web3={web3}
                      //amount={false}
                      privateKey={this.state.withdrawFromPrivateKey}
                      goBack={this.goBack.bind(this)}
                      changeView={this.changeView}
                      changeAlert={this.changeAlert}
                    />
                  </div>
                );
              case 'send_to_address':
                return (
                  <div>
                    <NavCard title={'Send to Address'} goBack={this.goBack.bind(this)}/>
                    <SendToAddress
                      balance={balance}
                      address={account}
                      send={send}
                      goBack={this.goBack.bind(this)}
                      changeView={this.changeView}
                      changeAlert={this.changeAlert}
                    />
                  </div>
                );
              case 'request_funds':
                return (
                  <div>
                    <NavCard title={'Request Funds'} goBack={this.goBack.bind(this)}/>
                    <RequestFunds
                      balance={balance}
                      address={account}
                      send={send}
                      goBack={this.goBack.bind(this)}
                      changeView={this.changeView}
                      changeAlert={this.changeAlert}
                    />
                  </div>
                );
              case 'share-link':
                return (
                  <div>
                    <NavCard title={'Share Link'} goBack={this.goBack.bind(this)} />
                    <ShareLink
                      sendKey={this.state.sendKey}
                      sendLink={this.state.sendLink}
                      balance={balance}
                      address={account}
                      changeAlert={this.changeAlert}
                      goBack={this.goBack.bind(this)}
                    />
                  </div>
                );
              case 'send_with_link':
                return (
                  <div>
                    <NavCard title={'Send with Link'} goBack={this.goBack.bind(this)} />
                    <SendWithLink balance={balance}
                      changeAlert={this.changeAlert}
                      sendWithLink={(amount,cb)=>{
                        let randomHash = this.state.web3.utils.sha3(""+Math.random())
                        let randomWallet = this.state.web3.eth.accounts.create()
                        let sig = this.state.web3.eth.accounts.sign(randomHash, randomWallet.privateKey);
                        console.log("STATE",this.state,this.state.contracts)
                        this.state.tx(this.state.contracts.Links.send(randomHash,sig.signature),140000,false,amount*10**18,async (receipt)=>{
                          this.setState({sendLink: randomHash,sendKey: randomWallet.privateKey},()=>{
                            console.log("STATE SAVED",this.state)
                          })
                          cb(receipt)
                        })
                      }}
                      address={account}
                      changeView={this.changeView}
                      goBack={this.goBack.bind(this)}
                    />
                  </div>
                );
              case 'burn-wallet':
                return (
                  <div>
                    <NavCard title={"Burn Private Key"} goBack={this.goBack.bind(this)}/>
                    <BurnWallet
                      address={account}
                      balance={balance}
                      goBack={this.goBack.bind(this)}
                      burnWallet={()=>{
                        burnMetaAccount()
                        if(localStorage&&typeof localStorage.setItem == "function"){
                          localStorage.setItem("loadedBlocksTop","")
                          localStorage.setItem("metaPrivateKey","")
                          localStorage.setItem("recentTxs","")
                        }
                      }}
                    />
                  </div>
                );
              case 'loader':
                return (
                  <div>
                    <NavCard title={"Sending..."} goBack={this.goBack.bind(this)}/>
                    <Loader />
                  </div>
                );
              case 'reader':
                return (
                  <div>
                    <NavCard title={"Reading QRCode..."} goBack={this.goBack.bind(this)}/>
                    <Loader />
                  </div>
                );
              case 'claimer':
                return (
                  <div>
                    <NavCard title={"Claiming..."} goBack={this.goBack.bind(this)}/>
                    <Loader />
                  </div>
                );
              default:
                return (
                  <div>unknown view</div>
                )
            }
          })()}
          { ( !web3 || !this.checkNetwork() ) &&
            <div>
              <Loader />
            </div>
          }
          { alert && <Footer alert={alert} changeAlert={this.changeAlert}/> }
        </div>

        <Dapparatus
          config={{
            DEBUG: false,
            hide: true,
            requiredNetwork: ['Unknown', 'xDai'],
            metatxAccountGenerator: false,
          }}
          //used to pass a private key into Dapparatus
          newPrivateKey={this.state.newPrivateKey}
          fallbackWeb3Provider={WEB3_PROVIDER}
          onUpdate={async (state) => {
            console.log("Dapparatus state update:", state)
            if (state.web3Provider) {
              state.web3 = new Web3(state.web3Provider)
              this.setState(state,()=>{
                console.log("state set:",this.state)
                if(this.state.possibleNewPrivateKey){
                  console.log("possibleNewPrivateKey",this.state.possibleNewPrivateKey,this.state)
                  //only import pks over empty metaaccounts
                  if(this.state.balance>=0.10 || !this.state.metaAccount){
                    console.log("Can't import private key, so ask to withdraw")
                    this.setState({possibleNewPrivateKey:false,withdrawFromPrivateKey:this.state.possibleNewPrivateKey},()=>{
                      this.changeView('withdraw_from_private')
                    })
                  }else{
                    this.setState({possibleNewPrivateKey:false,newPrivateKey:this.state.possibleNewPrivateKey})
                  }
                }
                if(!this.state.parsingTheChain){
                  this.setState({parsingTheChain:true},async ()=>{
                    let upperBoundOfSearch = this.state.block
                    //parse through recent transactions and store in local storage
                    if(localStorage&&typeof localStorage.setItem == "function"){
                      let recentTxs = this.state.recentTxs
                      if(!recentTxs){
                        //console.log("no recent tx found, checking storage")
                        recentTxs = localStorage.getItem("recentTxs")
                        //console.log("recentTxs txt is",recentTxs)
                        try{
                          recentTxs=JSON.parse(recentTxs)
                        }catch(e){
                          recentTxs=[]
                        }
                      }
                      if(!recentTxs){
                        recentTxs=[]
                      }
                      //console.log("Starting with recentTxs",recentTxs)
                      //console.log("recentTxs length is ",recentTxs.length)

                      let loadedBlocksTop = this.state.loadedBlocksTop
                      if(!loadedBlocksTop){
                        loadedBlocksTop = localStorage.getItem("loadedBlocksTop")
                      }

                      /*
                          Look back through previous blocks since this account
                          was last online... this could be bad. We might need a
                          central server keeping track of all these and delivering
                          a list of recent transactions
                       */

                      let updatedTxs = false
                      if(!loadedBlocksTop || loadedBlocksTop<this.state.block){
                        if(!loadedBlocksTop) loadedBlocksTop = Math.max(2,this.state.block-5)
                        let paddedLoadedBlocks = parseInt(loadedBlocksTop)+BLOCKS_TO_PARSE_PER_BLOCKTIME
                        //console.log("choosing the min of ",paddedLoadedBlocks,"and",this.state.block)
                        let parseBlock=Math.min(paddedLoadedBlocks,this.state.block)
                        //console.log("MIN:",parseBlock)
                        upperBoundOfSearch = parseBlock
                        //first, if we are still back parsing, we need to look at *this* block too
                        if(upperBoundOfSearch<this.state.block){
                          console.log(" +++++++======= Parsing recent blocks ~"+this.state.block)
                          for(let b=this.state.block;b>this.state.block-6;b--){
                            //console.log(" ++ Parsing *CURRENT BLOCK* Block "+b+" for transactions...")
                            let result = await this.parseBlocks(b,recentTxs)
                            //console.log(" result of parse: ",result)
                            recentTxs =  result.recentTxs
                            updatedTxs = updatedTxs||result.updatedTxs
                            //console.log("updatedTxs",updatedTxs)
                          }
                        }
                        console.log(" +++++++======= Parsing from "+loadedBlocksTop+" to "+upperBoundOfSearch+"....")
                        while(loadedBlocksTop<parseBlock){
                          //console.log(" ++ Parsing Block "+parseBlock+" for transactions...")
                          let result = await this.parseBlocks(parseBlock,recentTxs)
                          //console.log(" result of parse: ",result)
                          recentTxs =  result.recentTxs
                          updatedTxs = updatedTxs||result.updatedTxs
                          parseBlock--
                        }

                      }

                      if(updatedTxs||!this.state.recentTxs){
                        //console.log("!!!! TX UPDATE, SORT AND SLICE")
                        //console.log("BEFORE",JSON.stringify(recentTxs))
                        recentTxs.sort((a,b)=>{
                          if(b.blockNumber<a.blockNumber){
                            return -1;
                          }
                          if(b.blockNumber>a.blockNumber){
                            return 1;
                          }
                          return 0;
                        })
                        //console.log("AFTER",JSON.stringify(recentTxs))
                        recentTxs = recentTxs.slice(0,12)
                        //console.log("ending with recentTxs",recentTxs)

                        localStorage.setItem("recentTxs",JSON.stringify(recentTxs))
                        this.setState({recentTxs:recentTxs})
                      }

                      localStorage.setItem("loadedBlocksTop",upperBoundOfSearch)
                      this.setState({parsingTheChain:false,loadedBlocksTop:upperBoundOfSearch})
                    }

                  })
                }


              })
            }
          }}
        />
      </div>
    )
  }
}

export default App;
