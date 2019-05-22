import React, { Component } from 'react';
import { Tx, Input, Output, Util } from 'leap-core';
import { Dapparatus, Transactions, Gas } from "dapparatus";
import { equal, bi } from 'jsbi-utils';
import Web3 from 'web3';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './App.scss';
import Header from './components/Header';
import NavCard from './components/NavCard';
import SendByScan from './components/SendByScan';
import SendToAddress from './components/SendToAddress';
import WithdrawFromPrivate from './components/WithdrawFromPrivate';
import RequestFunds from './components/RequestFunds';
import Receive from './components/Receive'
import Share from './components/Share'
import ShareLink from './components/ShareLink'
import Balance from "./components/Balance";
import Receipt from "./components/Receipt";
import MainCard from './components/MainCard';
import History from './components/History';
import Advanced from './components/Advanced';
import MoreButtons from './components/MoreButtons';
import RecentTransactions from './components/RecentTransactions';
import Footer from './components/Footer';
import Loader from './components/Loader';
import burnerlogo from './burnerwallet.png';
import BurnWallet from './components/BurnWallet'
import Exchange from './components/Exchange'
import Bottom from './components/Bottom';
import incogDetect from './services/incogDetect.js'
import { Card, Box, ThemeProvider } from 'rimble-ui';
import theme from "./theme";
import getConfig from "./config";
//https://github.com/lesnitsky/react-native-webview-messaging/blob/v1/examples/react-native/web/index.js
import RNMessageChannel from 'react-native-webview-messaging';
import eth from './ethereum.png';
import dai from './dai.jpg';
import xdai from './xdai.png';
import base64url from 'base64url';
import EthCrypto from 'eth-crypto';

let LOADERIMAGE = burnerlogo
let HARDCODEVIEW// = "loader"// = "receipt"

const CONFIG = getConfig();

// TODO: Consolidate this with theme.js
let mainStyle = {
  width:"100%",
  height:"100%",
  backgroundImage:"linear-gradient(#292929, #191919)",
  backgroundColor:"#191919",
  hotColor:"white",
  mainColorAlt:"white",
  mainColor:"white",
}

let title = i18n.t('app_name')
let titleImage = (
  <span style={{paddingRight:20,paddingLeft:16}}><i className="fas fa-fire" /></span>
)

// TODO: Consolidate this with theme.js
let innerStyle = {
  maxWidth:740,
  margin:'0 auto',
  textAlign:'left'
}

// TODO: Consolidate this with theme.js
let buttonStyle = {
  primary: {
    backgroundImage:"linear-gradient("+mainStyle.mainColorAlt+","+mainStyle.mainColor+")",
    backgroundColor:mainStyle.mainColor,
    color:"#FFFFFF",
    whiteSpace:"nowrap",
    cursor:"pointer",
  },
  secondary: {
    border:"2px solid "+mainStyle.mainColor,
    color:mainStyle.mainColor,
    whiteSpace:"nowrap",
    cursor:"pointer",
  }
}

// TODO: Make this part of config.js. Tim didn't do it yet because he doesn't
// understand what these constants do :/
const BLOCKS_TO_PARSE_PER_BLOCKTIME = 32
const MAX_BLOCK_TO_LOOK_BACK = 512//don't look back more than 512 blocks

let dollarSymbol = "$"
let dollarConversion = 1.0
//let dollarSymbol = "€"
//let dollarConversion = 0.88
let convertToDollar = (amount)=>{
  return (parseFloat(amount)/dollarConversion)
}
let convertFromDollar = (amount)=>{
  return (parseFloat(amount)*dollarConversion)
}
let dollarDisplay = (amount)=>{
  amount = Math.floor(amount*100)/100
  return dollarSymbol+convertFromDollar(amount).toFixed(2)
}

let interval
let intervalLong

export default class App extends Component {
  constructor(props) {


    console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[["+title+"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
    let view = 'main'
    let cachedView = localStorage.getItem("view")
    let cachedViewSetAge = Date.now() - localStorage.getItem("viewSetTime")
    if(HARDCODEVIEW){
      view = HARDCODEVIEW
    }else if(cachedViewSetAge < 300000 && cachedView&&cachedView!==0){
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
      title: title,
      extraHeadroom:0,
      balance: 0.00,
      vendors: {},
      ethprice: 0.00,
      hasUpdateOnce: false,
    };
    this.alertTimeout = null;

    try{
      RNMessageChannel.on('json', update => {
        try{
          let safeUpdate = {}
          if(update.title) safeUpdate.title = update.title
          if(update.extraHeadroom) safeUpdate.extraHeadroom = update.extraHeadroom
          if(update.possibleNewPrivateKey) safeUpdate.possibleNewPrivateKey = update.possibleNewPrivateKey
          this.setState(safeUpdate,()=>{
            if(this.state.possibleNewPrivateKey){
              this.dealWithPossibleNewPrivateKey()
            }
          })
        }catch(e){console.log(e)}
      })
    }catch(e){console.log(e)}

  }
  parseAndCleanPath(path){
    let parts = path.split(";")
    //console.log("PARTS",parts)
    let state = {}
    if(parts.length>0){
      state.toAddress = parts[0].replace("/","")
    }
    if(parts.length>=2){
      state.amount = parts[1]
    }
    if(parts.length>2){
      state.message = decodeURI(parts[2]).replaceAll("%23","#").replaceAll("%3B",";").replaceAll("%3A",":").replaceAll("%2F","/")
    }
    if(parts.length>3){
      state.extraMessage = decodeURI(parts[3]).replaceAll("%23","#").replaceAll("%3B",";").replaceAll("%3A",":").replaceAll("%2F","/")
    }
    //console.log("STATE",state)
    return state;
  }
  openScanner(returnState){
    this.setState({returnState:returnState, scannerOpen: true})
  }
  returnToState(scannerState){
    let updateState = Object.assign({scannerState}, this.state.returnState);
    updateState.scannerOpen = false
    updateState.returnState = false
    console.log("UPDATE FROM RETURN STATE",updateState)
    this.setState(updateState)
  }
  updateDimensions() {
    //force it to rerender when the window is resized to make sure qr fits etc
    this.forceUpdate();
  }
  saveKey(update){
    this.setState(update)
  }
  detectContext(){
    console.log("DETECTING CONTEXT....")
    //snagged from https://stackoverflow.com/questions/52759238/private-incognito-mode-detection-for-ios-12-safari
    incogDetect((result)=>{
      if(result){
        console.log("INCOG")
        document.getElementById("main").style.backgroundImage = "linear-gradient(#862727, #671c1c)"
        document.body.style.backgroundColor = "#671c1c"
        var contextElement = document.getElementById("context")
        contextElement.innerHTML = 'INCOGNITO';
      }else if (typeof web3 !== 'undefined') {
        console.log("NOT INCOG",this.state.metaAccount)
        if (window.web3.currentProvider.isMetaMask === true) {
          document.getElementById("main").style.backgroundImage = "linear-gradient(#553319, #ca6e28)"
          document.body.style.backgroundColor = "#ca6e28"
          contextElement = document.getElementById("context")
          contextElement.innerHTML = 'METAMASK';
        } else if(this.state.account && !this.state.metaAccount) {
          console.log("~~~*** WEB3",this.state.metaAccount,result)
          document.getElementById("main").style.backgroundImage = "linear-gradient(#234063, #305582)"
          document.body.style.backgroundColor = "#305582"
          contextElement = document.getElementById("context")
          contextElement.innerHTML = 'WEB3';
        }
      }
    })
  }
  componentDidMount(){

    document.body.style.backgroundColor = mainStyle.backgroundColor

    this.detectContext()

    console.log("document.getElementsByClassName('className').style",document.getElementsByClassName('.btn').style)
    window.addEventListener("resize", this.updateDimensions.bind(this));
    if(window.location.pathname){
      console.log("PATH",window.location.pathname,window.location.pathname.length,window.location.hash)
      if(window.location.pathname.indexOf("/pk")>=0){
        let tempweb3 = new Web3();
        let base64encodedPK = window.location.hash.replace("#","")
        let rawPK = tempweb3.utils.bytesToHex(base64url.toBuffer(base64encodedPK))
        this.setState({possibleNewPrivateKey:rawPK})
        window.history.pushState({},"", "/");
      }else if(window.location.pathname.length===43){
        this.changeView('send_to_address')
        console.log("CHANGE VIEW")
      }else if(window.location.pathname.length===134){
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
        if(privateKey.indexOf("0x")!==0){
          privateKey="0x"+privateKey
        }
        //console.log("!!! possibleNewPrivateKey",privateKey)
        this.setState({possibleNewPrivateKey:privateKey})
        window.history.pushState({},"", "/");
      }else if(window.location.pathname.indexOf("/vendors;")===0){
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
          if((parseFloat(sendToAmount)>0 || extraData) && sendToAddress.length===42){
            this.changeView('send_to_address')
          }
        }
      }
    }
    this.poll.bind(this)();
    interval = setInterval(this.poll.bind(this),1500)
    intervalLong = setInterval(this.longPoll.bind(this),45000)
    setTimeout(this.longPoll.bind(this),150)

    this.connectToRPC()
  }
  connectToRPC(){
    const mainnetweb3 = new Web3(CONFIG.ROOTCHAIN.RPC);
    let daiContract, bridgeContract;
    try{
      daiContract = new mainnetweb3.eth.Contract(require("./contracts/StableCoin.abi.js"),CONFIG.ROOTCHAIN.DAI_ADDRESS)
      bridgeContract = new mainnetweb3.eth.Contract(require("./contracts/Bridge.abi.js"), CONFIG.SIDECHAIN.BRIDGE_ADDRESS)
    }catch(e){
      console.log("ERROR LOADING DAI Stablecoin Contract",e)
    }
    this.setState({mainnetweb3,daiContract,bridgeContract})
  }
  componentWillUnmount() {
    clearInterval(interval)
    clearInterval(intervalLong)
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }


  async poll() {
    if(this.state.account){
      let ethBalance = 0.00
      let daiBalance = 0.00
      let xdaiBalance = 0.00

      if(this.state.mainnetweb3){

        try{
          ethBalance = await this.state.mainnetweb3.eth.getBalance(this.state.account)
          ethBalance = this.state.mainnetweb3.utils.fromWei(""+ethBalance,'ether')

          if(this.state.daiContract){
            daiBalance = await this.state.daiContract.methods.balanceOf(this.state.account).call()
            daiBalance = this.state.mainnetweb3.utils.fromWei(""+daiBalance,'ether')
          }
        }catch(e){
          console.log(e)
          this.connectToRPC()
        }
      }
      if(this.state.xdaiweb3 && this.state.pdaiContract){
        xdaiBalance = await this.state.pdaiContract.methods.balanceOf(this.state.account).call();
        xdaiBalance = this.state.xdaiweb3.utils.fromWei(""+xdaiBalance,'ether')
      }

      this.setState({ethBalance,daiBalance,xdaiBalance,balance:xdaiBalance,hasUpdateOnce:true})
    }


  }
  longPoll() {
    fetch("https://api.coinmarketcap.com/v2/ticker/1027/")
      .then(r => r.json())
      .then((response)=>{
        const ethprice = response.data.quotes.USD.price
        this.setState({ethprice})
      })
  }
  setPossibleNewPrivateKey(value){
    this.setState({possibleNewPrivateKey:value},()=>{
      this.dealWithPossibleNewPrivateKey()
    })
  }
  async dealWithPossibleNewPrivateKey(){
    //this happens as page load and you need to wait until
    if(this.state && this.state.hasUpdateOnce){
      if(this.state.metaAccount && this.state.metaAccount.privateKey.replace("0x","") === this.state.possibleNewPrivateKey.replace("0x","")){
        this.setState({possibleNewPrivateKey:false})
        this.changeAlert({
          type: 'warning',
          message: 'Imported identical private key.',
        });
      }else{

        console.log("Checking on pk import...")
        console.log("this.state.balance",this.state.balance)
        console.log("this.state.metaAccount",this.state.metaAccount)
        console.log("this.state.xdaiBalance",this.state.xdaiBalance)
        console.log("this.state.daiBalance",this.state.daiBalance)
        console.log("this.state.isVendor",this.state.isVendor)


        console.log(!this.state.metaAccount || this.state.balance>=0.05 || this.state.xdaiBalance>=0.05 || this.state.ethBalance>=0.0005 || this.state.daiBalance>=0.05 || (this.state.isVendor&&this.state.isVendor.isAllowed))
        if(!this.state.metaAccount || this.state.balance>=0.05 || this.state.xdaiBalance>=0.05 || this.state.ethBalance>=0.0005 || this.state.daiBalance>=0.05 || (this.state.isVendor&&this.state.isVendor.isAllowed)){
          this.setState({possibleNewPrivateKey:false,withdrawFromPrivateKey:this.state.possibleNewPrivateKey},()=>{
            this.changeView('withdraw_from_private')
          })
        }else{
          this.setState({possibleNewPrivateKey:false,newPrivateKey:this.state.possibleNewPrivateKey})
          localStorage.setItem(this.state.account+"loadedBlocksTop","")
          localStorage.setItem(this.state.account+"recentTxs","")
          localStorage.setItem(this.state.account+"transactionsByAddress","")
          this.setState({recentTxs:[],transactionsByAddress:{},fullRecentTxs:[],fullTransactionsByAddress:{}})
        }
      }
    }else{
      setTimeout(this.dealWithPossibleNewPrivateKey.bind(this),500)
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
  setReceipt = (obj)=>{
    this.setState({receipt:obj})
  }
  changeView = (view,cb) => {
    if(view==="exchange"||view==="main"/*||view.indexOf("account_")===0*/){
      localStorage.setItem("view",view)//some pages should be sticky because of metamask reloads
      localStorage.setItem("viewSetTime",Date.now())
    }
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
  this.setState({ view, scannerState:false },cb);
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
  goBack(view="main"){
    console.log("GO BACK")
    this.changeView(view)
    this.setState({scannerOpen: false })
    setTimeout(()=>{window.scrollTo(0,0)},60)
  }
  async parseBlocks(parseBlock,recentTxs,transactionsByAddress){
    let web3;
    if (this.state.xdaiweb3) {
      web3 = this.state.xdaiweb3
    } else {
      web3 = this.state.web3
    }
    let block = await web3.eth.getBlock(parseBlock)
    let updatedTxs = false
    if(block){
      let transactions = block.transactions

      //console.log("transactions",transactions)
      for(let t in transactions){
        //console.log("TX",transactions[t])
        let tx = await web3.eth.getTransaction(transactions[t])
        // NOTE: NST information is encoded in a transaction's values. Hence if
        // we don't filter out NST transactions, they'll show up as huge
        // transfers in the UI.
        if(tx && tx.to && tx.from && !Util.isNST(tx.color)){
          //console.log("EEETRTTTTERTETETET",tx)
          let smallerTx = {
            hash:tx.hash,
            to:tx.to.toLowerCase(),
            from:tx.from.toLowerCase(),
            value:web3.utils.fromWei(""+tx.value,"ether"),
            blockNumber:tx.blockNumber
          }


          if(smallerTx.from===this.state.account || smallerTx.to===this.state.account){
            if(tx.input&&tx.input!=="0x"){

              let decrypted = await this.decryptInput(tx.input)

              if(decrypted){
                smallerTx.data = decrypted
                smallerTx.encrypted = true
              }

              try{
                smallerTx.data = web3.utils.hexToUtf8(tx.input)
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
    if(smallerTx.to===this.state.account){
      otherAccount = smallerTx.from
    }
    if(!transactionsByAddress[otherAccount]){
      transactionsByAddress[otherAccount] = []
    }

    let found = false
    if(parseFloat(smallerTx.value)>0.005){
      for(let r in recentTxs){
        if(recentTxs[r].hash===smallerTx.hash/* && (!smallerTx.data || recentTxs[r].data === smallerTx.data)*/){
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
      if(transactionsByAddress[otherAccount][t].hash===smallerTx.hash/* && (!smallerTx.data || recentTxs[r].data === smallerTx.data)*/){
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
    this.setState({recentTxs:recentTxs,transactionsByAddress:transactionsByAddress})
  }
  async addAllTransactionsFromList(recentTxs,transactionsByAddress,theList){
    let updatedTxs = false

    for(let e in theList){
      let thisEvent = theList[e]
      let cleanEvent = Object.assign({},thisEvent)
      cleanEvent.to = cleanEvent.to.toLowerCase()
      cleanEvent.from = cleanEvent.from.toLowerCase()
      cleanEvent.value = this.state.web3.utils.fromWei(""+cleanEvent.value,'ether')
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
      web3, account, gwei, block, avgBlockTime, etherscan, balance, metaAccount, burnMetaAccount, view, alert, send
    } = this.state;

    let networkOverlay = ""
    // if(web3 && !this.checkNetwork() && view!=="exchange"){
    //   networkOverlay = (
    //     <div>
    //       <input style={{zIndex:13,position:'absolute',opacity:0.95,right:48,top:192,width:194}} value="https://dai.poa.network" />
    //       <img style={{zIndex:12,position:'absolute',opacity:0.95,right:0,top:0,maxHeight:370}} src={customRPCHint} />
    //     </div>
    //   )
    // }


    let web3_setup = ""
    if(web3){
      web3_setup = (
        <div>
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
          state.nativeSend = tokenSend.bind(this)
          //delete state.send
          state.send = tokenSend.bind(this)
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


    let extraHead = ""
    if(this.state.extraHeadroom){
      extraHead = (
        <div style={{marginTop:this.state.extraHeadroom}}>
        </div>
      )
    }

    let totalBalance = parseFloat(this.state.ethBalance) * parseFloat(this.state.ethprice) + parseFloat(this.state.daiBalance) + parseFloat(this.state.xdaiBalance)
    let header = (
      <div style={{height:50}}>
      </div>
    )
    if(web3){
      header = (
        <Header
          openScanner={this.openScanner.bind(this)}
          network={CONFIG.SIDECHAIN.NAME || this.state.network}
          total={totalBalance}
          ens={this.state.ens}
          title={this.state.title}
          titleImage={titleImage}
          mainStyle={mainStyle}
          address={this.state.account}
          changeView={this.changeView}
          balance={balance}
          view={this.state.view}
          dollarDisplay={dollarDisplay}
        />
      )
    }

    return (
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <div id="main" style={mainStyle}>
            <div style={innerStyle}>
              {extraHead}
              {networkOverlay}
              {web3_setup}

              <div>
                {header}



              {web3 /*&& this.checkNetwork()*/ && (() => {
                //console.log("VIEW:",view)

                let moreButtons = (
                  <MoreButtons
                    buttonStyle={buttonStyle}
                    changeView={this.changeView}
                    isVendor={this.state.isVendor&&this.state.isVendor.isAllowed}
                  />
                )

                let selected = "xDai"
                let extraTokens = ""

                let defaultBalanceDisplay = (
                  <div>
                    <Balance icon={xdai} selected={false} text={"MNY"} amount={this.state.xdaiBalance} address={account} dollarDisplay={dollarDisplay} />
                  </div>
                )

                if(view.indexOf("account_")===0) {

                  let targetAddress = view.replace("account_","")
                  console.log("TARGET",targetAddress)
                  return (
                    <div>
                      <Card>

                        <NavCard title={(
                          <div>
                            {i18n.t('history_chat')}
                          </div>
                        )} goBack={this.goBack.bind(this)}/>
                        {defaultBalanceDisplay}
                        <History
                          buttonStyle={buttonStyle}
                          saveKey={this.saveKey.bind(this)}
                          metaAccount={this.state.metaAccount}
                          transactionsByAddress={this.state.transactionsByAddress}
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
                      </Card>

                      <Bottom
                        action={()=>{
                          this.changeView('main')
                        }}
                      />
                    </div>

                  )
                }

                const sendByScan = (
                  <SendByScan
                    parseAndCleanPath={this.parseAndCleanPath.bind(this)}
                    returnToState={this.returnToState.bind(this)}
                    returnState={this.state.returnState}
                    mainStyle={mainStyle}
                    goBack={this.goBack.bind(this)}
                    changeView={this.changeView}
                    onError={(error) =>{
                      this.changeAlert("danger",error)
                    }}
                  />
                )

                switch(view) {
                  case 'main':
                  return (
                    <div>
                      {this.state.scannerOpen ? sendByScan : null}
                      <Card p={3}>
                        {extraTokens}

                        <Balance icon={xdai} selected={selected} text={"MNY"} amount={this.state.xdaiBalance} address={account} dollarDisplay={dollarDisplay}/>

                        <Balance icon={dai} selected={selected} text={"DAI"} amount={this.state.daiBalance} address={account} dollarDisplay={dollarDisplay}/>

                        <Balance icon={eth} selected={selected} text={"ETH"} amount={parseFloat(this.state.ethBalance) * parseFloat(this.state.ethprice)} address={account} dollarDisplay={dollarDisplay}/>

                        <MainCard
                          buttonStyle={buttonStyle}
                          address={account}
                          balance={balance}
                          changeAlert={this.changeAlert}
                          changeView={this.changeView}
                          dollarDisplay={dollarDisplay}
                        />

                        <Box>
                          {moreButtons}
                        </Box>

                        <RecentTransactions
                          dollarDisplay={dollarDisplay}
                          view={this.state.view}
                          buttonStyle={buttonStyle}
                          transactionsByAddress={this.state.transactionsByAddress}
                          changeView={this.changeView}
                          address={account}
                          block={this.state.block}
                          recentTxs={this.state.recentTxs}
                        />

                      </Card>
                      <Bottom
                        icon={"Settings"}
                        text={i18n.t('advance_title')}
                        action={()=>{
                          this.changeView('advanced')
                        }}
                      />
                    </div>
                  );
                  case 'advanced':
                  return (
                    <div>
                      {this.state.scannerOpen ? sendByScan : null}
                      <Card p={3}>
                        <NavCard title={i18n.t('advance_title')} goBack={this.goBack.bind(this)}/>
                        <Advanced
                          isVendor={this.state.isVendor && this.state.isVendor.isAllowed}
                          buttonStyle={buttonStyle}
                          address={account}
                          balance={balance}
                          changeView={this.changeView}
                          privateKey={metaAccount.privateKey}
                          changeAlert={this.changeAlert}
                          dollarDisplay={dollarDisplay}
                          tokenSendV2={tokenSendV2.bind(this)}
                          metaAccount={this.state.metaAccount}
                        />
                      </Card>
                      <Bottom
                        text={i18n.t('done')}
                        action={this.goBack.bind(this)}
                      />
                    </div>
                  )
                  case 'withdraw_from_private':
                    return (
                      <div>
                        {this.state.scannerOpen ? sendByScan : null}
                        <Card p={3} style={{zIndex:1}}>
                          <NavCard title={i18n.t('withdraw')} goBack={this.goBack.bind(this)}/>
                          {defaultBalanceDisplay}
                          <WithdrawFromPrivate
                            products={this.state.products}
                            buttonStyle={buttonStyle}
                            balance={balance}
                            address={account}
                            web3={this.state.web3}
                            xdaiweb3={this.state.xdaiweb3}
                            pdaiContract={this.state.pdaiContract}
                            daiTokenAddr={CONFIG.SIDECHAIN.DAI}
                            //amount={false}
                            privateKey={this.state.withdrawFromPrivateKey}
                            goBack={this.goBack.bind(this)}
                            changeView={this.changeView}
                            changeAlert={this.changeAlert}
                            block={this.state.block}
                            send={this.state.send}
                            dollarDisplay={dollarDisplay}
                            tokenSendV2={tokenSendV2.bind(this)}
                          />
                        </Card>
                        <Bottom
                          action={()=>{
                            this.changeView('main')
                          }}
                        />
                      </div>
                    );
                  case 'send_to_address':
                  return (
                    <div>
                      {this.state.scannerOpen ? sendByScan : null}
                      <Card p={3} style={{zIndex:1}}>
                        <NavCard title={i18n.t('send_to_address_title')} goBack={this.goBack.bind(this)}/>
                        {defaultBalanceDisplay}
                        <SendToAddress
                          parseAndCleanPath={this.parseAndCleanPath.bind(this)}
                          openScanner={this.openScanner.bind(this)}
                          scannerState={this.state.scannerState}
                          buttonStyle={buttonStyle}
                          balance={balance}
                          web3={this.state.web3}
                          address={account}
                          send={send}
                          goBack={this.goBack.bind(this)}
                          changeView={this.changeView}
                          setReceipt={this.setReceipt}
                          changeAlert={this.changeAlert}
                          dollarDisplay={dollarDisplay}
                          convertToDollar={convertToDollar}
                        />
                      </Card>
                      <Bottom
                        text={i18n.t('cancel')}
                        action={this.goBack.bind(this)}
                      />
                    </div>
                  );
                  case 'receipt':
                  return (
                    <div>
                      {this.state.scannerOpen ? sendByScan : null}
                      <Card p={3}>
                        <NavCard title={i18n.t('receipt_title')} goBack={this.goBack.bind(this)}/>
                        <Receipt
                          receipt={this.state.receipt}
                          view={this.state.view}
                          block={this.state.block}
                          buttonStyle={buttonStyle}
                          balance={balance}
                          web3={this.state.web3}
                          address={account}
                          send={send}
                          goBack={this.goBack.bind(this)}
                          changeView={this.changeView}
                          changeAlert={this.changeAlert}
                          dollarDisplay={dollarDisplay}
                          transactionsByAddress={this.state.transactionsByAddress}
                          fullTransactionsByAddress={this.state.fullTransactionsByAddress}
                          fullRecentTxs={this.state.fullRecentTxs}
                          recentTxs={this.state.recentTxs}
                        />
                      </Card>
                      <Bottom
                        action={this.goBack.bind(this)}
                      />
                    </div>
                  );
                  case 'receive':
                  return (
                    <div>
                      {this.state.scannerOpen ? sendByScan : null}
                      <Card p={3}>
                        <NavCard title={i18n.t('receive_title')} goBack={this.goBack.bind(this)}/>
                        {defaultBalanceDisplay}
                        <Receive
                          view={this.state.view}
                          block={this.state.block}
                          buttonStyle={buttonStyle}
                          balance={balance}
                          web3={this.state.web3}
                          address={account}
                          send={send}
                          goBack={this.goBack.bind(this)}
                          changeView={this.changeView}
                          changeAlert={this.changeAlert}
                          dollarDisplay={dollarDisplay}
                          transactionsByAddress={this.state.transactionsByAddress}
                          fullTransactionsByAddress={this.state.fullTransactionsByAddress}
                          fullRecentTxs={this.state.fullRecentTxs}
                          recentTxs={this.state.recentTxs}
                        />
                      </Card>
                      <Bottom
                        action={this.goBack.bind(this)}
                      />
                    </div>
                  );
                    case 'request_funds':
                    return (
                      <div>
                        {this.state.scannerOpen ? sendByScan : null}
                        <Card p={3}>
                          <NavCard title={i18n.t('request_funds_title')} goBack={this.goBack.bind(this)}/>
                          {defaultBalanceDisplay}
                          <RequestFunds
                            block={this.state.block}
                            view={this.state.view}
                            mainStyle={mainStyle}
                            buttonStyle={buttonStyle}
                            balance={balance}
                            address={account}
                            send={send}
                            goBack={this.goBack.bind(this)}
                            changeView={this.changeView}
                            changeAlert={this.changeAlert}
                            dollarDisplay={dollarDisplay}
                            transactionsByAddress={this.state.transactionsByAddress}
                            fullTransactionsByAddress={this.state.fullTransactionsByAddress}
                            fullRecentTxs={this.state.fullRecentTxs}
                            recentTxs={this.state.recentTxs}
                          />
                        </Card>
                        <Bottom
                          action={()=>{
                            this.changeView('main')
                          }}
                        />
                      </div>
                    );
                    case 'share':

                      let url = window.location.protocol+"//"+window.location.hostname
                      if(window.location.port&&window.location.port!==80&&window.location.port!==443){
                        url = url+":"+window.location.port
                      }

                      return (
                        <div>
                          {this.state.scannerOpen ? sendByScan : null}
                          <Card p={3}>
                            <NavCard title={url} goBack={this.goBack.bind(this)} />
                            <Share
                              title={url}
                              url={url}
                              mainStyle={mainStyle}
                              sendKey={this.state.sendKey}
                              sendLink={this.state.sendLink}
                              balance={balance}
                              address={account}
                              web3={web3}
                              //amount={false}
                              privateKey={this.state.withdrawFromPrivateKey}
                              goBack={this.goBack.bind(this)}
                              changeView={this.changeView}
                              changeAlert={this.changeAlert}
                              dollarDisplay={dollarDisplay}
                            />
                          </Card>
                          <Bottom
                            action={this.goBack.bind(this)}
                          />
                        </div>
                      );
                    case 'share-link':
                      return (
                        <div>
                          {this.state.scannerOpen ? sendByScan : null}
                          <Card p={3}>
                            <NavCard title={'Share Link'} goBack={this.goBack.bind(this)} />
                              <ShareLink
                                sendKey={this.state.sendKey}
                                sendLink={this.state.sendLink}
                                balance={balance}
                                address={account}
                                changeAlert={this.changeAlert}
                                goBack={this.goBack.bind(this)}
                              />
                          </Card>
                          <Bottom
                            action={this.goBack.bind(this)}
                          />
                        </div>
                      );
                    case 'burn-wallet':
                    return (
                      <div>
                        {this.state.scannerOpen ? sendByScan : null}
                        <Card p={3}>
                          <NavCard title={"Burn Private Key"} goBack={this.goBack.bind(this)}/>
                          {defaultBalanceDisplay}
                          <BurnWallet
                          mainStyle={mainStyle}
                          address={account}
                          balance={balance}
                          goBack={this.goBack.bind(this)}
                          dollarDisplay={dollarDisplay}
                          burnWallet={()=>{
                            burnMetaAccount()
                            if(RNMessageChannel){
                              RNMessageChannel.send("burn")
                            }
                            if(localStorage&&typeof localStorage.setItem === "function"){
                              localStorage.setItem(this.state.account+"loadedBlocksTop","")
                              localStorage.setItem(this.state.account+"metaPrivateKey","")
                              localStorage.setItem(this.state.account+"recentTxs","")
                              localStorage.setItem(this.state.account+"transactionsByAddress","")
                              this.setState({recentTxs:[],transactionsByAddress:{}})
                            }
                          }}
                          />
                        </Card>
                        <Bottom
                          text={i18n.t('cancel')}
                          action={this.goBack.bind(this)}
                        />
                    </div>
                  );

                  case 'exchange':
                  return (
                    <div>
                      {this.state.scannerOpen ? sendByScan : null}
                      <Card>

                        <NavCard title={i18n.t('exchange_title')} goBack={this.goBack.bind(this)}/>
                        <Exchange
                          eth={eth}
                          dai={dai}
                          xdai={xdai}
                          ethprice={this.state.ethprice}
                          ethBalance={this.state.ethBalance}
                          daiBalance={this.state.daiBalance}
                          xdaiBalance={this.state.xdaiBalance}
                          mainnetweb3={this.state.mainnetweb3}
                          xdaiweb3={this.state.xdaiweb3}
                          daiContract={this.state.daiContract}
                          pdaiContract={this.state.pdaiContract}
                          bridgeContract={this.state.bridgeContract}
                          isVendor={this.state.isVendor}
                          isAdmin={this.state.isAdmin}
                          buttonStyle={buttonStyle}
                          changeAlert={this.changeAlert}
                          setGwei={this.setGwei}
                          network={this.state.network}
                          tx={this.state.tx}
                          pTx={this.state.pTx}
                          web3={this.state.web3}
                          send={this.state.send}
                          nativeSend={this.state.nativeSend}
                          address={account}
                          balance={balance}
                          goBack={this.goBack.bind(this)}
                          dollarDisplay={dollarDisplay}
                          tokenSendV2={tokenSendV2.bind(this)}
                        />
                      </Card>
                    </div>
                  );
                  case 'loader':
                  return (
                    <div>
                      <div style={{zIndex:1,position:"relative",color:"#dddddd"}}>

                        <NavCard title={"Sending..."} goBack={this.goBack.bind(this)} darkMode={true}/>
                      </div>
                      <Loader loaderImage={LOADERIMAGE} mainStyle={mainStyle}/>
                    </div>
                  );
                  case 'reader':
                  return (
                    <div>
                      <div style={{zIndex:1,position:"relative",color:"#dddddd"}}>
                        <NavCard title={"Reading QRCode..."} goBack={this.goBack.bind(this)} darkMode={true}/>
                      </div>
                      <Loader loaderImage={LOADERIMAGE}  mainStyle={mainStyle}/>
                    </div>
                  );
                  case 'claimer':
                  return (
                    <div>
                      <div style={{zIndex:1,position:"relative",color:"#dddddd"}}>
                        <NavCard title={"Claiming..."} goBack={this.goBack.bind(this)} darkMode={true}/>
                      </div>
                    <Loader loaderImage={LOADERIMAGE} mainStyle={mainStyle}/>
                    </div>
                  );
                  default:
                  return (
                    <div>unknown view</div>
                  )
                  }
          })()}
          { ( false ||  !web3 /*|| !this.checkNetwork() */) &&
            <div>
              <Loader loaderImage={LOADERIMAGE} mainStyle={mainStyle}/>
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
              fallbackWeb3Provider={CONFIG.ROOTCHAIN.RPC}
              network="LeapTestnet"
              xdaiProvider={CONFIG.SIDECHAIN.RPC}
              onUpdate={async (state) => {
                //console.log("DAPPARATUS UPDATE",state)
                if (state.xdaiweb3) {
                  let pdaiContract;
                  try {
                    pdaiContract = new state.xdaiweb3.eth.Contract(require("./contracts/StableCoin.abi.js"), CONFIG.SIDECHAIN.DAI_ADDRESS)
                  } catch(err) {
                    console.log("Error loading PDAI contract");
                  }
                  this.setState({pdaiContract});
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

                        if(localStorage&&typeof localStorage.setItem === "function"){

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
                            console.log(" +++++++======== Parsing recent blocks ~"+this.state.block)
                            //first, if we are still back parsing, we need to look at *this* block too
                            if(upperBoundOfSearch<this.state.block){
                              for(let b=this.state.block;b>this.state.block-6;b--){
                                //console.log(" ++ Parsing *CURRENT BLOCK* Block "+b+" for transactions...")
                                updatedTxs = (await this.parseBlocks(b,recentTxs,transactionsByAddress)) || updatedTxs
                              }
                            }
                            console.log(" +++++++======== Parsing from "+loadedBlocksTop+" to "+upperBoundOfSearch+"....")
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
                const gwei = (state.gwei || this.state.gwei) + 0.1;
                console.log("GWEI set:",gwei);
                this.setState({
                  ...state,
                  gwei
                })
              }}
              />
              <div
                id="context"
                style={{position:"absolute",right:5,top:-15,opacity:0.2,zIndex:100,fontSize:60,color:'#FFFFFF'}}>
              </div>
              {eventParser}
            </div>
          </div>
        </I18nextProvider>
      </ThemeProvider>
    )
  }
}

//<iframe id="galleassFrame" style={{zIndex:99,position:"absolute",left:0,top:0,width:800,height:600}} src="https://galleass.io" />

// NOTE: This function is used heavily by legacy code. We've reimplemented it's
// body though.
async function tokenSend(to, value, gasLimit, txData, cb) {
  let { account, web3, xdaiweb3, metaAccount } = this.state
  if(typeof gasLimit === "function"){
    cb = gasLimit
  }

  if(typeof txData === "function"){
    cb = txData
  }

  value = xdaiweb3.utils.toWei(""+value, "ether")
  const color = await xdaiweb3.getColor(CONFIG.SIDECHAIN.DAI);
  try {
    const receipt = await tokenSendV2(
      account,
      to,
      value,
      color,
      xdaiweb3,
      web3,
      metaAccount && metaAccount.privateKey
    )

    cb(null, receipt);
  } catch(err) {
    cb({
      error: err,
      request: { account, to, value, color },
    });
    // NOTE: The callback cb of tokenSend is not used correctly in the expected
    // format cb(error, receipt) throughout the app. We hence cannot send
    // errors in the callback :( When no receipt is returned (e.g. null), the
    // burner wallet will react with not resolving the "sending" view. This is
    // not ideal and should be changed in the future. We opened an issue on the
    // upstream repo: https://github.com/austintgriffith/burner-wallet/issues/157
  }
}

async function tokenSendV2(from, to, value, color, xdaiweb3, web3, privateKey) {
  const unspent = await xdaiweb3.getUnspent(from)

  let transaction;
  if (Util.isNST(color)) {
    const { outpoint, output: { data }} = unspent.find(
      ({ output }) =>
        Number(output.color) === Number(color) &&
        equal(bi(output.value), bi(value))
    );
    const inputs = [new Input(outpoint)];
    const outputs = [new Output(value, to, color, data)];
    transaction = Tx.transfer(inputs, outputs);
  } else {
    transaction = Tx.transferFromUtxos(unspent, from, to, value, color)
  }

  const signedTx = privateKey ? await transaction.signAll(privateKey) : await transaction.signWeb3(web3);
  const rawTx = signedTx.hex();

  // NOTE: Leapdao's Plasma implementation currently doesn't return receipts.
  // We hence have to periodically query the leap node to check whether our
  // transaction has been included into the chain. We assume that if it hasn't
  // been included after 5000ms (50 rounds at a 100ms timeout), it failed.
  // Unfortunately, at this point we cannot provide an error message for why

  let receipt;
  let rounds = 50;

  while (rounds--) {
    // redundancy rules ✊
    try {
      // web3 hangs here on invalid txs, trying to get receipt?
      // await this.web3.eth.sendSignedTransaction(tx.hex());
      await new Promise(
        (resolve, reject) => {
          xdaiweb3.currentProvider.send(
            { jsonrpc: '2.0', id: 42, method: 'eth_sendRawTransaction', 'params': [rawTx] },
            (err, res) => { if (err) { return reject(err); } resolve(res); }
          );
        }
      );
    } catch(err) {
      // ignore for now
      console.log(err);
      // NOTE: Leap's node currently doesn't implement the "newBlockHeaders"
      // JSON-RPC call. When a transaction is rejected by a node,
      // sendSignedTransaction hence throws an error. We simply ignore this
      // error here and use the polling tactic below. For more details see:
      // https://github.com/leapdao/leap-node/issues/255

      // const messageToIgnore = "Failed to subscribe to new newBlockHeaders to confirm the transaction receipts.";
      // NOTE: In the case where we want to ignore web3's error message, there's
      // "\r\n {}" included in the error message, which is why we cannot
      // compare with the equal operator, but have to use String.includes.
      // if (!err.message.includes(messageToIgnore)) {
      //  throw err;
      // }
    }

    let res = await xdaiweb3.eth.getTransaction(signedTx.hash())

    if (res && res.blockHash) {
      receipt = res;
      break;
    }

    // wait ~100ms
    await new Promise((resolve) => setTimeout(() => resolve(), 100));
  }

  if (receipt) {
    return receipt;
  }

  throw new Error("Transaction wasn't included into a block.");
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

// ToDo: do not mutate native prototypes
/* eslint-disable no-extend-native */
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
