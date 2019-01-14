import React, { Component } from 'react';
import { ContractLoader, Dapparatus, Transactions, Gas, Address, Events } from "dapparatus";
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
import History from './components/History';
import Advanced from './components/Advanced';
import BottomLinks from './components/BottomLinks';
import MoreButtons from './components/MoreButtons';
import Admin from './components/Admin';
import Vendor from './components/Vendor';
import Vendors from './components/Vendors';
import RecentTransactions from './components/RecentTransactions';
import Footer from './components/Footer';
import Loader from './components/Loader';
import BurnWallet from './components/BurnWallet'
import Exchange from './components/Exchange'
import customRPCHint from './customRPCHint.png';
import bufficorn from './bufficorn.png';
import cypherpunk from './cypherpunk.png';

const EthCrypto = require('eth-crypto');

let WEB3_PROVIDER
let CLAIM_RELAY
let ERC20TOKEN
let ERC20IMAGE


let mainStyle = {
  width:"100%",
  height:"100%",
  backgroundImage:"linear-gradient(#F69E4D, #F76B1C)",
  backgroundColor:"#F76B1C",
  hotColor:"#F69E4D",
  mainColor:"#8762A6"
}

let title = "Burner Wallet"
let titleImage = (
  <i className="fas fa-fire" />
)
if (window.location.hostname.indexOf("localhost") >= 0 || window.location.hostname.indexOf("10.0.0.107") >= 0) {
  WEB3_PROVIDER = "http://0.0.0.0:8545";
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = false//'BuffiDai'//false//'Burner'
  ERC20IMAGE = false//bufficorn
}
else if (window.location.hostname.indexOf("s.xdai.io") >= 0) {
  WEB3_PROVIDER = "https://dai.poa.network";
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = 'Burner'
}
else if (window.location.hostname.indexOf("qreth") >= 0) {
  WEB3_PROVIDER = "https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac"
  CLAIM_RELAY = false
  ERC20TOKEN = false
}
else if (window.location.hostname.indexOf("xdai") >= 0) {
  WEB3_PROVIDER = "https://dai.poa.network";
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = false
}
else if (window.location.hostname.indexOf("buffidai") >= 0) {
  WEB3_PROVIDER = "https://dai.poa.network";
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = 'BuffiDai'
  ERC20IMAGE = bufficorn
}
else if (window.location.hostname.indexOf("burnerwallet.io") >= 0) {
  WEB3_PROVIDER = "https://dai.poa.network";
  CLAIM_RELAY = 'https://x.xdai.io'
  ERC20TOKEN = 'Burner'
  ERC20IMAGE = cypherpunk
}


if(ERC20TOKEN=="BuffiDai"){
  mainStyle.backgroundImage = "linear-gradient(#540d48, #20012d)"
  mainStyle.backgroundColor = "#20012d"
  mainStyle.mainColor = "#b6299e"
  title = "BuffiDai.io"
  titleImage = (
    <img src={bufficorn} style={{
      maxWidth:50,
      maxHeight:50,
      marginTop:-24
    }}/>
  )
} else if(ERC20TOKEN=="Burner"){
  mainStyle.backgroundImage = "linear-gradient(#4923d8, #6c0664)"
  mainStyle.backgroundColor = "#6c0664"
  mainStyle.mainColor = "#e72da3"
  title = "Burner Wallet"
  titleImage = (
    <img src={cypherpunk} style={{
      maxWidth:50,
      maxHeight:50,
      marginTop:-24
    }}/>
  )
}

const BLOCKS_TO_PARSE_PER_BLOCKTIME = 32
const MAX_BLOCK_TO_LOOK_BACK = 512//don't look back more than 512 blocks

let dollarDisplay = (amount)=>{
  let floatAmount = parseFloat(amount)
  amount = Math.floor(amount*100)/100
  return amount.toFixed(2)
}

let interval

class App extends Component {
  constructor(props) {
    let view = 'main'
    let cachedView = localStorage.getItem("view")
    if(cachedView&&cachedView!=0){
      view = cachedView
    }
    console.log("CACHED VIEW",view)
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 1.1,
      view: view,
      sendLink: "",
      sendKey: "",
      alert: null,
      loadingTitle:'loading...',
      balance: 0.00,
      vendors: {}
    };
    this.alertTimeout = null;
  }
  updateDimensions() {
    //force it to rerender when the window is resized to make sure qr fits etc
    this.forceUpdate();
  }
  saveKey(update){
    this.setState(update)
  }
  componentDidMount(){
    document.body.style.backgroundColor = mainStyle.backgroundColor
    console.log("document.getElementsByClassName('className').style",document.getElementsByClassName('.btn').style)
    window.addEventListener("resize", this.updateDimensions.bind(this));
    if(window.location.pathname){
      console.log("PATH",window.location.pathname,window.location.pathname.length,window.location.hash)
      if(window.location.pathname.length==43){
        this.changeView('send_to_address')
        console.log("CHANGE VIEW")
      }else if(window.location.pathname.length==134){
        let parts = window.location.pathname.split(";")
        let claimId = parts[0].replace("/","")
        let claimKey = parts[1]
        console.log("DO CLAIM",claimId,claimKey)
        this.setState({claimId,claimKey})
        window.history.pushState({},"", "/");
      }else if(
        (window.location.pathname.length>=65&&window.location.pathname.length<=67&&window.location.pathname.indexOf(";")<0) ||
        (window.location.hash.length>=65 && window.location.hash.length <=67 && window.location.hash.indexOf(";")<0)
      ){
        console.log("incoming private key")
        let privateKey = window.location.pathname.replace("/","")
        if(window.location.hash){
          privateKey = window.location.hash
        }
        privateKey = privateKey.replace("#","")
        if(privateKey.indexOf("0x")!=0){
          privateKey="0x"+privateKey
        }
        //console.log("!!! possibleNewPrivateKey",privateKey)
        this.setState({possibleNewPrivateKey:privateKey})
        window.history.pushState({},"", "/");
      }else if(window.location.pathname.indexOf("/vendors;")==0){
        this.changeView('vendors')
      }else{
        let parts = window.location.pathname.split(";")
        console.log("PARTS",parts)
        if(parts.length>=2){
          let sendToAddress = parts[0].replace("/","")
          let sendToAmount = parts[1]
          let extraData = ""
          if(parts.length>=3){
            extraData = parts[2]
          }
          if((parseFloat(sendToAmount)>0 || extraData) && sendToAddress.length==42){
            this.changeView('send_to_address')
          }
        }
      }
    }
    setTimeout(this.poll.bind(this),150)
    setTimeout(this.poll.bind(this),650)
    interval = setInterval(this.poll.bind(this),1500)
  }
  componentWillUnmount() {
    clearInterval(interval)
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }
  async poll() {
    if(ERC20TOKEN&&this.state.contracts){
      let gasBalance = await this.state.web3.eth.getBalance(this.state.account)
      gasBalance = this.state.web3.utils.fromWei(""+gasBalance,'ether')
      let tokenBalance = await this.state.contracts[ERC20TOKEN].balanceOf(this.state.account).call()
      tokenBalance = this.state.web3.utils.fromWei(""+tokenBalance,'ether')
      let isAdmin = await this.state.contracts[ERC20TOKEN].admin(this.state.account).call()
      //console.log("ISADMIN",isAdmin)
      let isVendor = await this.state.contracts[ERC20TOKEN].vendors(this.state.account).call()
      //console.log("isVendor",isVendor)
      this.setState({gasBalance:gasBalance,balance:tokenBalance,isAdmin:isAdmin,isVendor:isVendor})
    }
  }
  setPossibleNewPrivateKey(value){
    this.setState({possibleNewPrivateKey:value},()=>{
      this.dealWithPossibleNewPrivateKey()
    })
  }
  dealWithPossibleNewPrivateKey(){
    //console.log("possibleNewPrivateKey",this.state.possibleNewPrivateKey,this.state)
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
  componentDidUpdate(prevProps, prevState) {
    let { network, web3 } = this.state;
    if (web3 && network !== prevState.network /*&& !this.checkNetwork()*/) {
      console.log("WEB3 DETECTED BUT NOT RIGHT NETWORK",web3, network, prevState.network);
      //this.changeAlert({
      //  type: 'danger',
      //  message: 'Wrong Network. Please use Custom RPC endpoint: https://dai.poa.network or turn off MetaMask.'
      //}, false)
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

        let claimHash = this.state.web3.utils.soliditySha3(
          {type: 'bytes32', value: this.state.claimId}, // fund id
          {type: 'address', value: this.state.account}, // destination address
          {type: 'uint256', value: fund[3]}, // nonce
          {type: 'address', value: contracts.Links._address} // contract address
        )
        console.log("claimHash", claimHash)
        console.log("this.state.claimKey", this.state.claimKey)
        let sig = this.state.web3.eth.accounts.sign(claimHash, this.state.claimKey);
        sig = sig.signature;
        console.log("CLAIM TX:", this.state.claimId, sig, claimHash, this.state.account)
        tx(contracts.Links.claim(this.state.claimId, sig, claimHash, this.state.account), 150000, false, 0, (result) => {
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
    this.forceUpdate();
  }
  relayClaim() {
    console.log("DOING CLAIM THROUGH RELAY")
    this.state.contracts.Links.funds(this.state.claimId).call().then((fund) => {
      if (fund) {
        this.setState({fund: fund})
        console.log("FUND: ", fund)

        let claimHash = this.state.web3.utils.soliditySha3(
          {type: 'bytes32', value: this.state.claimId}, // fund id
          {type: 'address', value: this.state.account}, // destination address
          {type: 'uint256', value: fund[3]}, // nonce
          {type: 'address', value: this.state.contracts.Links._address} // contract address
        )
        console.log("claimHash", claimHash)
        console.log("this.state.claimKey", this.state.claimKey)
        let sig = this.state.web3.eth.accounts.sign(claimHash, this.state.claimKey);
        sig = sig.signature
        console.log("CLAIM TX:", this.state.claimId, sig, claimHash, this.state.account)

        this.setState({sending: true})
        let postData = {
          id: this.state.claimId,
          sig: sig,
          claimHash: claimHash,
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
  changeView = (view,cb) => {
    if(view=="bridge"||view=="main"/*||view.indexOf("account_")==0*/) localStorage.setItem("view",view) //some pages should be sticky because of metamask reloads
    /*if (view.startsWith('send_with_link')||view.startsWith('send_to_address')) {
    console.log("This is a send...")
    console.log("BALANCE",this.state.balance)
    if (this.state.balance <= 0) {
    console.log("no funds...")
    this.changeAlert({
    type: 'danger',
    message: 'Insufficient funds',
  });
  return;
}
}
*/
this.changeAlert(null);
console.log("Setting state",view)
this.setState({ view },cb);
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
async parseBlocks(parseBlock,recentTxs,transactionsByAddress){
  let block = await this.state.web3.eth.getBlock(parseBlock)
  let updatedTxs = false
  if(block){
    let transactions = block.transactions

    //console.log("transactions",transactions)
    for(let t in transactions){
      //console.log("TX",transactions[t])
      let tx = await this.state.web3.eth.getTransaction(transactions[t])
      if(tx && tx.to && tx.from ){
        //console.log("EEETRTTTTERTETETET",tx)
        let smallerTx = {
          hash:tx.hash,
          to:tx.to.toLowerCase(),
          from:tx.from.toLowerCase(),
          value:this.state.web3.utils.fromWei(""+tx.value,"ether"),
          blockNumber:tx.blockNumber
        }


        if(smallerTx.from==this.state.account || smallerTx.to==this.state.account){
          if(tx.input&&tx.input!="0x"){

            let decrypted = await this.decryptInput(tx.input)

            if(decrypted){
              smallerTx.data = decrypted
              smallerTx.encrypted = true
            }

            try{
              smallerTx.data = this.state.web3.utils.hexToUtf8(tx.input)
            }catch(e){}
            //console.log("smallerTx at this point",smallerTx)
            if(!smallerTx.data){
              smallerTx.data = " *** unable to decrypt data *** "
            }
          }
          updatedTxs = this.addTxIfAccountMatches(recentTxs,transactionsByAddress,smallerTx) || updatedTxs
        }

      }
    }
  }
  return updatedTxs
}
async decryptInput(input){
  let key = input.substring(0,32)
  //console.log("looking in memory for key",key)
  let cachedEncrypted = this.state[key]
  if(!cachedEncrypted){
    //console.log("nothing found in memory, checking local storage")
    cachedEncrypted = localStorage.getItem(key)
  }
  if(cachedEncrypted){
    return cachedEncrypted
  }else{
    if(this.state.metaAccount){
      try{
        let parsedData = EthCrypto.cipher.parse(input.substring(2))
        const endMessage = await EthCrypto.decryptWithPrivateKey(
          this.state.metaAccount.privateKey, // privateKey
          parsedData // encrypted-data
        );
        return  endMessage
      }catch(e){}
    }else{
      //no meta account? maybe try to setup signing keys?
      //maybe have a contract that tries do decrypt? \
    }
  }
  return false
}
initRecentTxs(){
  let recentTxs = []
  if(this.state.recentTx) recentTxs = recentTxs.concat(this.state.recentTxs)
  let transactionsByAddress = Object.assign({},this.state.transactionsByAddress)
  if(!recentTxs||recentTxs.length<=0){
    recentTxs = localStorage.getItem(this.state.account+"recentTxs")
    try{
      recentTxs=JSON.parse(recentTxs)
    }catch(e){
      recentTxs=[]
    }
  }
  if(!recentTxs){
    recentTxs=[]
  }
  if(Object.keys(transactionsByAddress).length === 0){
    transactionsByAddress = localStorage.getItem(this.state.account+"transactionsByAddress")
    try{
      transactionsByAddress=JSON.parse(transactionsByAddress)
    }catch(e){
      transactionsByAddress={}
    }
  }
  if(!transactionsByAddress){
    transactionsByAddress={}
  }
  return [recentTxs,transactionsByAddress]
}
addTxIfAccountMatches(recentTxs,transactionsByAddress,smallerTx){
  let updatedTxs = false

  let otherAccount = smallerTx.to
  if(smallerTx.to==this.state.account){
    otherAccount = smallerTx.from
  }
  if(!transactionsByAddress[otherAccount]){
    transactionsByAddress[otherAccount] = []
  }

  let found = false
  if(parseFloat(smallerTx.value)>0.005){
    for(let r in recentTxs){
      if(recentTxs[r].hash==smallerTx.hash/* && (!smallerTx.data || recentTxs[r].data == smallerTx.data)*/){
        found = true
        if(!smallerTx.data || recentTxs[r].data == smallerTx.data){
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
    if(transactionsByAddress[otherAccount][t].hash==smallerTx.hash/* && (!smallerTx.data || recentTxs[r].data == smallerTx.data)*/){
      found = true
      if(!smallerTx.data || transactionsByAddress[otherAccount][t].data == smallerTx.data){
        // do nothing, it exists
      }else{
        transactionsByAddress[otherAccount][t].data = smallerTx.data
        if(smallerTx.encrypted) transactionsByAddress[otherAccount][t].encrypted = true
        updatedTxs=true
      }
    }
  }
  if(!found){
    updatedTxs=true
    transactionsByAddress[otherAccount].push(smallerTx)
  }

  return updatedTxs
}
sortAndSaveTransactions(recentTxs,transactionsByAddress){
  recentTxs.sort(sortByBlockNumber)

  for(let t in transactionsByAddress){
    transactionsByAddress[t].sort(sortByBlockNumberDESC)
  }
  recentTxs = recentTxs.slice(0,12)
  localStorage.setItem(this.state.account+"recentTxs",JSON.stringify(recentTxs))
  localStorage.setItem(this.state.account+"transactionsByAddress",JSON.stringify(transactionsByAddress))

  this.setState({recentTxs:recentTxs,transactionsByAddress:transactionsByAddress},()=>{
    if(ERC20TOKEN){
      this.syncFullTransactions()
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
      }else{
        try{
          cleanEvent.data = this.state.web3.utils.hexToUtf8(cleanEvent.data)
        }catch(e){}
      }
    }
    updatedTxs = this.addTxIfAccountMatches(recentTxs,transactionsByAddress,cleanEvent) || updatedTxs
  }
  return updatedTxs
}
syncFullTransactions(){
  let initResult = this.initRecentTxs()
  let recentTxs = []
  recentTxs = recentTxs.concat(initResult[0])
  let transactionsByAddress = Object.assign({},initResult[1])

  let updatedTxs = false
  updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferTo) || updatedTxs
  updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferFrom) || updatedTxs
  updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferToWithData) || updatedTxs
  updatedTxs = this.addAllTransactionsFromList(recentTxs,transactionsByAddress,this.state.transferFromWithData) || updatedTxs

  if(updatedTxs||!this.state.fullRecentTxs||!this.state.fullTransactionsByAddress){
    recentTxs.sort(sortByBlockNumber)
    for(let t in transactionsByAddress){
      transactionsByAddress[t].sort(sortByBlockNumberDESC)
    }
    recentTxs = recentTxs.slice(0,12)
    //console.log("FULLRECENT",recentTxs)
    this.setState({fullRecentTxs:recentTxs,fullTransactionsByAddress:transactionsByAddress})
  }
}
render() {
  let {
    web3, account, tx, gwei, block, avgBlockTime, etherscan, balance, metaAccount, burnMetaAccount, view, alert, send
  } = this.state;

  let networkOverlay = ""
  if(web3 && !this.checkNetwork() && view!="bridge"){
    networkOverlay = (
      <img style={{zIndex:12,position:'absolute',opacity:0.95,right:0,top:0}} src={customRPCHint} />
    )
  }


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
        if(ERC20TOKEN){
          delete state.send
          state.send = tokenSend.bind(this)
        }
        console.log(state)
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

  let eventParser = ""

  return (
    <div style={mainStyle}>
    {networkOverlay}
    {web3_setup}

    <div className="container-fluid">
    <Header
    ens={this.state.ens}
    title={title}
    titleImage={titleImage}
    mainStyle={mainStyle}
    address={this.state.account}
    changeView={this.changeView}
    balance={balance}
    view={this.state.view}
    />
    {web3 /*&& this.checkNetwork()*/ && (() => {
      //console.log("VIEW:",view)

      let moreButtons = (
        <MoreButtons
        mainStyle={mainStyle}
        changeView={this.changeView}
        />
      )

      let subBalanceDisplay = ""
      if(ERC20TOKEN){
        if(!this.state.gasBalance){
          subBalanceDisplay = ""
        }else{
          subBalanceDisplay = (
            <div style={{opacity:0.4,fontSize:12,position:'absolute',right:0,marginTop:5}}>
            {Math.round(this.state.gasBalance*10000)/10000}
            </div>
          )
        }


        if(this.state.isAdmin){
          moreButtons = (
            <div>
            <Admin
            ERC20TOKEN={ERC20TOKEN}
            vendors={this.state.vendors}
            mainStyle={mainStyle}
            changeView={this.changeView}
            contracts={this.state.contracts}
            tx={this.state.tx}
            web3={this.state.web3}
            />
            <MoreButtons
            mainStyle={mainStyle}
            changeView={this.changeView}
            />
            </div>
          )
        }else if(this.state.isVendor&&this.state.isVendor.isAllowed){
          moreButtons = (
            <div>
            <Vendor
            ERC20TOKEN={ERC20TOKEN}
            address={account}
            mainStyle={mainStyle}
            changeView={this.changeView}
            contracts={this.state.contracts}
            vendor={this.state.isVendor}
            tx={this.state.tx}
            web3={this.state.web3}
            dollarDisplay={dollarDisplay}
            />
            <MoreButtons
            mainStyle={mainStyle}
            changeView={this.changeView}
            />
            </div>
          )
        }else if(ERC20TOKEN=="Burner"){
          moreButtons = (
            <div>
            <MoreButtons
            mainStyle={mainStyle}
            changeView={this.changeView}
            />
            </div>
          )
        }else{
          moreButtons = ""
        }

        if(this.state.contracts){
          eventParser = (
            <div style={{color:"#000000"}}>
              <Events
                config={{hide:true}}
                contract={this.state.contracts[ERC20TOKEN]}
                eventName={"Transfer"}
                block={this.state.block}
                filter={{from:this.state.account}}
                onUpdate={(eventData,allEvents)=>{this.setState({transferFrom:allEvents},this.syncFullTransactions)}}
              />
              <Events
                config={{hide:true}}
                contract={this.state.contracts[ERC20TOKEN]}
                eventName={"Transfer"}
                block={this.state.block}
                filter={{to:this.state.account}}
                onUpdate={(eventData,allEvents)=>{this.setState({transferTo:allEvents},this.syncFullTransactions)}}
              />
              <Events
                config={{hide:true}}
                contract={this.state.contracts[ERC20TOKEN]}
                eventName={"TransferWithData"}
                block={this.state.block}
                filter={{from:this.state.account}}
                onUpdate={(eventData,allEvents)=>{this.setState({transferFromWithData:allEvents},this.syncFullTransactions)}}
              />
              <Events
                config={{hide:true}}
                contract={this.state.contracts[ERC20TOKEN]}
                eventName={"TransferWithData"}
                block={this.state.block}
                filter={{to:this.state.account}}
                onUpdate={(eventData,allEvents)=>{this.setState({transferToWithData:allEvents},this.syncFullTransactions)}}
              />
              <Events
                config={{hide:true}}
                contract={this.state.contracts[ERC20TOKEN]}
                eventName={"UpdateVendor"}
                block={this.state.block}
                onUpdate={(vendor, all)=>{
                  let {vendors} = this.state
                  console.log("VENDOR",vendor)
                  if(!vendors[vendor.wallet] || vendors[vendor.wallet].blockNumber<vendor.blockNumber){
                    vendors[vendor.wallet] = {
                      name: this.state.web3.utils.hexToUtf8(vendor.name),
                      isAllowed: vendor.isAllowed,
                      isActive: vendor.isActive,
                      wallet: vendor.wallet,
                      blockNumber: vendor.blockNumber
                    }
                  }
                  this.setState({vendors})
                }}
              />
            </div>
          )
        }
      }


      if(view.indexOf("account_")==0)
      {

        let targetAddress = view.replace("account_","")
        console.log("TARGET",targetAddress)
        return (
          <div>
          <NavCard title={(
            <div>
            History
            </div>
          )} goBack={this.goBack.bind(this)}/>
          <History
          mainStyle={mainStyle}
          saveKey={this.saveKey.bind(this)}
          metaAccount={this.state.metaAccount}
          transactionsByAddress={ERC20TOKEN?this.state.fullTransactionsByAddress:this.state.transactionsByAddress}
          address={account}
          balance={balance}
          changeAlert={this.changeAlert}
          changeView={this.changeView}
          target={targetAddress}
          block={this.state.block}
          send={this.state.send}
          web3={this.state.web3}
          goBack={this.goBack.bind(this)}
          dollarDisplay={dollarDisplay}
          />
          </div>

        )
      }

      switch(view) {
        case 'main':
        return (
          <div>
          <MainCard
          subBalanceDisplay={subBalanceDisplay}
          mainStyle={mainStyle}
          address={account}
          balance={balance}
          changeAlert={this.changeAlert}
          changeView={this.changeView}
          dollarDisplay={dollarDisplay}
          ERC20TOKEN={ERC20TOKEN}
          />
          {moreButtons}
          <RecentTransactions
            ERC20TOKEN={ERC20TOKEN}
            transactionsByAddress={ERC20TOKEN?this.state.fullTransactionsByAddress:this.state.transactionsByAddress}
            changeView={this.changeView}
            address={account}
            block={this.state.block}
            recentTxs={ERC20TOKEN?this.state.fullRecentTxs:this.state.recentTxs}
          />
          <BottomLinks
          changeView={this.changeView}
          />
          </div>
        );
        case 'advanced':
        return (
          <div>
          <NavCard title={'Advanced'} goBack={this.goBack.bind(this)}/>
          <Advanced
          mainStyle={mainStyle}
          address={account}
          balance={balance}
          changeView={this.changeView}
          privateKey={metaAccount.privateKey}
          changeAlert={this.changeAlert}
          goBack={this.goBack.bind(this)}
          setPossibleNewPrivateKey={this.setPossibleNewPrivateKey.bind(this)}
          />
          </div>
        )
        case 'send_by_scan':
        return (
          <SendByScan
          mainStyle={mainStyle}
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
          ERC20TOKEN={ERC20TOKEN}
          balance={balance}
          address={account}
          contracts={this.state.contracts}
          web3={web3}
          //amount={false}
          privateKey={this.state.withdrawFromPrivateKey}
          goBack={this.goBack.bind(this)}
          changeView={this.changeView}
          changeAlert={this.changeAlert}
          dollarDisplay={dollarDisplay}
          />
          </div>
        );
        case 'send_to_address':
        return (
          <div>
          <NavCard title={'Send to Address'} goBack={this.goBack.bind(this)}/>
          <SendToAddress
          mainStyle={mainStyle}
          balance={balance}
          web3={this.state.web3}
          address={account}
          send={send}
          goBack={this.goBack.bind(this)}
          changeView={this.changeView}
          changeAlert={this.changeAlert}
          dollarDisplay={dollarDisplay}
          />
          </div>
        );
        case 'request_funds':
        return (
          <div>
          <NavCard title={'Request Funds'} goBack={this.goBack.bind(this)}/>
          <RequestFunds
          mainStyle={mainStyle}
          balance={balance}
          address={account}
          send={send}
          goBack={this.goBack.bind(this)}
          changeView={this.changeView}
          changeAlert={this.changeAlert}
          dollarDisplay={dollarDisplay}
          />
          </div>
        );
        case 'share-link':
        return (
          <div>
          <NavCard title={'Share Link'} goBack={this.goBack.bind(this)} />
          <ShareLink
          mainStyle={mainStyle}
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
          mainStyle={mainStyle}
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
          dollarDisplay={dollarDisplay}
          />
          </div>
        );
        case 'burn-wallet':
        return (
          <div>
          <NavCard title={"Burn Private Key"} goBack={this.goBack.bind(this)}/>
          <BurnWallet
          mainStyle={mainStyle}
          address={account}
          balance={balance}
          goBack={this.goBack.bind(this)}
          dollarDisplay={dollarDisplay}
          burnWallet={()=>{
            burnMetaAccount()
            if(localStorage&&typeof localStorage.setItem == "function"){
              localStorage.setItem(this.state.account+"loadedBlocksTop","")
              localStorage.setItem(this.state.account+"metaPrivateKey","")
              localStorage.setItem(this.state.account+"recentTxs","")
              localStorage.setItem(this.state.account+"transactionsByAddress","")
              this.setState({recentTxs:[],transactionsByAddress:{}})
            }
          }}
          />
          </div>
        );
        case 'bridge':
        return (
          <div>
          <NavCard title={"Exchange"} goBack={this.goBack.bind(this)}/>
          <Exchange
          ERC20IMAGE={ERC20IMAGE}
          ERC20TOKEN={ERC20TOKEN}
          contracts={this.state.contracts}
          mainStyle={mainStyle}
          changeAlert={this.changeAlert}
          setGwei={this.setGwei}
          network={this.state.network}
          tx={this.state.tx}
          web3={this.state.web3}
          send={this.state.send}
          address={account}
          balance={balance}
          goBack={this.goBack.bind(this)}
          dollarDisplay={dollarDisplay}
          />
          </div>
        );
        case 'vendors':
        return (
          <div>
          <NavCard title={'Vendors'} goBack={this.goBack.bind(this)}/>
          <Vendors
          ERC20TOKEN={ERC20TOKEN}
          vendors={this.state.vendors}
          address={account}
          mainStyle={mainStyle}
          changeView={this.changeView}
          contracts={this.state.contracts}
          vendor={this.state.isVendor}
          tx={this.state.tx}
          web3={this.state.web3}
          block={this.state.block}
          goBack={this.goBack.bind(this)}
          dollarDisplay={dollarDisplay}
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
    { ( !web3 /*|| !this.checkNetwork() */) &&
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
      //console.log("DAPPARATUS UPDATE",state)
      if(ERC20TOKEN){
        delete state.balance
      }
      if (state.web3Provider) {
        state.web3 = new Web3(state.web3Provider)
        this.setState(state,()=>{
          //console.log("state set:",this.state)
          if(this.state.possibleNewPrivateKey){
            this.dealWithPossibleNewPrivateKey()
          }
          if(!this.state.parsingTheChain){
            this.setState({parsingTheChain:true},async ()=>{
              let upperBoundOfSearch = this.state.block
              //parse through recent transactions and store in local storage

              if(localStorage&&typeof localStorage.setItem == "function"){

                let initResult = this.initRecentTxs()
                let recentTxs = initResult[0]
                let transactionsByAddress = initResult[1]

                let loadedBlocksTop = this.state.loadedBlocksTop
                if(!loadedBlocksTop){
                  loadedBlocksTop = localStorage.getItem(this.state.account+"loadedBlocksTop")
                }

                //  Look back through previous blocks since this account
                //  was last online... this could be bad. We might need a
                //  central server keeping track of all these and delivering
                //  a list of recent transactions


                let updatedTxs = false
                if(!loadedBlocksTop || loadedBlocksTop<this.state.block){
                  if(!loadedBlocksTop) loadedBlocksTop = Math.max(2,this.state.block-5)

                  if(this.state.block - loadedBlocksTop > MAX_BLOCK_TO_LOOK_BACK){
                    loadedBlocksTop = this.state.block-MAX_BLOCK_TO_LOOK_BACK
                  }

                  let paddedLoadedBlocks = parseInt(loadedBlocksTop)+BLOCKS_TO_PARSE_PER_BLOCKTIME
                  //console.log("choosing the min of ",paddedLoadedBlocks,"and",this.state.block)
                  let parseBlock=Math.min(paddedLoadedBlocks,this.state.block)

                  //console.log("MIN:",parseBlock)
                  upperBoundOfSearch = parseBlock
                  console.log(" +++++++======= Parsing recent blocks ~"+this.state.block)
                  //first, if we are still back parsing, we need to look at *this* block too
                  if(upperBoundOfSearch<this.state.block){
                    for(let b=this.state.block;b>this.state.block-6;b--){
                      //console.log(" ++ Parsing *CURRENT BLOCK* Block "+b+" for transactions...")
                      updatedTxs = (await this.parseBlocks(b,recentTxs,transactionsByAddress)) || updatedTxs
                    }
                  }
                  console.log(" +++++++======= Parsing from "+loadedBlocksTop+" to "+upperBoundOfSearch+"....")
                  while(loadedBlocksTop<parseBlock){
                    //console.log(" ++ Parsing Block "+parseBlock+" for transactions...")
                    updatedTxs = (await this.parseBlocks(parseBlock,recentTxs,transactionsByAddress)) || updatedTxs
                    parseBlock--
                  }
                }

                if(updatedTxs||!this.state.recentTxs){
                  this.sortAndSaveTransactions(recentTxs,transactionsByAddress)
                }

                localStorage.setItem(this.state.account+"loadedBlocksTop",upperBoundOfSearch)
                this.setState({parsingTheChain:false,loadedBlocksTop:upperBoundOfSearch})
              }
              //console.log("~~ DONE PARSING SET ~~")
            })
          }
        })
      }
    }}
    />
    <Gas
    network={this.state.network}
    onUpdate={(state)=>{
      console.log("Gas price update:",state)
      this.setState(state,()=>{
        this.state.gwei += 0.1
        console.log("GWEI set:",this.state)
      })
    }}
    />
    {eventParser}
    </div>
  )
}
}
async function tokenSend(to,value,gasLimit,txData,cb){
  let {account,web3} = this.state

  console.log("tokenSend")

  let weiValue =  this.state.web3.utils.toWei(""+value, 'ether')

  let setGasLimit = 60000
  if(typeof gasLimit == "function"){
    cb=gasLimit
  }else if(gasLimit){
    setGasLimit=gasLimit
  }

  let data = false
  if(typeof txData == "function"){
    cb = txData
  }else{
    data = txData
  }

  console.log("DAPPARATUS TOKEN SENDING WITH GAS LIMIT",setGasLimit)

  let result
  if(this.state.metaAccount){
    console.log("sending with meta account:",this.state.metaAccount.address)

    let tx={
      to:this.state.contracts[ERC20TOKEN]._address,
      value: 0,
      gas: setGasLimit,
      gasPrice: Math.round(this.state.gwei * 1010101010)
    }
    if(data){
      tx.data = this.state.contracts[ERC20TOKEN].transferWithData(to,weiValue,data).encodeABI()
    }else{
      tx.data = this.state.contracts[ERC20TOKEN].transfer(to,weiValue).encodeABI()
    }
    console.log("TX SIGNED TO METAMASK:",tx)
    this.state.web3.eth.accounts.signTransaction(tx, this.state.metaAccount.privateKey).then(signed => {
      console.log("SIGNED:",signed)
      this.state.web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
        console.log("META RECEIPT",receipt)
        cb(receipt)
      })
    });

  }else{
    let data = false
    if(typeof txData == "function"){
      cb = txData
    }else{
      data = txData
    }
    let txObject = {
      from:this.state.account,
      to:this.state.contracts[ERC20TOKEN]._address,
      value: 0,
      gas: setGasLimit,
      gasPrice: Math.round(this.state.gwei * 1000000000)
    }

    if(data){
      txObject.data = this.state.contracts[ERC20TOKEN].transferWithData(to,weiValue,data).encodeABI()
    }else{
      txObject.data = this.state.contracts[ERC20TOKEN].transfer(to,weiValue).encodeABI()
    }

    console.log("sending with injected web3 account",txObject)
    result = await this.state.web3.eth.sendTransaction(txObject)

    console.log("RES",result)
    cb(result)
  }

}

let sortByBlockNumberDESC = (a,b)=>{
  if(b.blockNumber>a.blockNumber){
    return -1
  }
  if(b.blockNumber<a.blockNumber){
    return 1
  }
  return 0
}
let sortByBlockNumber = (a,b)=>{
  if(b.blockNumber<a.blockNumber){
    return -1
  }
  if(b.blockNumber>a.blockNumber){
    return 1
  }
  return 0
}

export default App;
