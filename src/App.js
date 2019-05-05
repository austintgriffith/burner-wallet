import React, { Component } from 'react';
import { ContractLoader, Dapparatus, Transactions, Gas, Address, Events } from "dapparatus";
import Web3 from 'web3';
import axios from 'axios';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import gasless from 'tabookey-gasless';
import './App.scss';
import Header from './components/Header';
import NavCard from './components/NavCard';
import SendByScan from './components/SendByScan';
import SendToAddress from './components/SendToAddress';
import SendBadge from './components/SendBadge';
import WithdrawFromPrivate from './components/WithdrawFromPrivate';
import RequestFunds from './components/RequestFunds';
import Receive from './components/Receive';
import Balance from "./components/Balance";
import Badges from "./components/Badges";
import Ruler from "./components/Ruler";
import Receipt from "./components/Receipt";
import MainCard from './components/MainCard';
import Advanced from './components/Advanced';
import BottomLinks from './components/BottomLinks';
import MoreButtons from './components/MoreButtons';
import RecentTransactions from './components/RecentTransactions';
import Footer from './components/Footer';
import Loader from './components/Loader';
import BurnWallet from './components/BurnWallet'
import Bottom from './components/Bottom';
import customRPCHint from './customRPCHint.png';
import namehash from 'eth-ens-namehash'

//https://github.com/lesnitsky/react-native-webview-messaging/blob/v1/examples/react-native/web/index.js
//import RNMessageChannel from 'react-native-webview-messaging';


import xdai from './xdai.jpg';

let base64url = require('base64url')

//const POA_XDAI_NODE = "https://dai-b.poa.network"
const POA_XDAI_NODE = "https://dai.poa.network"

let XDAI_PROVIDER = POA_XDAI_NODE

let WEB3_PROVIDER
let CLAIM_RELAY
let ERC20TOKEN
let ERC20VENDOR
let ERC20IMAGE
let ERC20NAME
let LOADERIMAGE = false
let HARDCODEVIEW// = "loader"// = "receipt"
let FAILCOUNT = 0

let mainStyle = {
  width:"100%",
  height:"100%",
  //backgroundImage:"linear-gradient(#292929, #191919)",
  //backgroundColor:"#191919",
  hotColor:"#ff2c5e",
  mainColorAlt:"#130094",
  mainColor:"#371bb5",
}

/*
mainColorAlt:"#81379d",
mainColor:"#fc1051",
 */
/*
mainColorAlt:"#5041b9",
mainColor:"#20c797",
 */


let title = i18n.t('app_name')
let titleImage = (
  <span style={{paddingRight:20,paddingLeft:16}}><i className="fas fa-fire" /></span>
)

//<i className="fas fa-fire" />
if (window.location.hostname.indexOf("localhost") >= 0 || window.location.hostname.indexOf("10.0.0.107") >= 0) {
  XDAI_PROVIDER = "http://localhost:8545"
  WEB3_PROVIDER = "http://localhost:8545";
  CLAIM_RELAY = 'http://localhost:18462'
  if(false){
    ERC20NAME = false
    ERC20IMAGE = false
  }else{
    ERC20NAME = "RAD"
    ERC20VENDOR = 'VendingMachine'
    ERC20TOKEN = 'ERC20Vendable'
    ERC20IMAGE = "🍕"
    XDAI_PROVIDER = "http://localhost:8545"
    WEB3_PROVIDER = "http://localhost:8545";
    LOADERIMAGE = ""
  }
}
else if (window.location.hostname.indexOf("radwallet.io") >= 0) {
  WEB3_PROVIDER = POA_XDAI_NODE;
  ERC20NAME = "RAD"
  ERC20VENDOR = 'VendingMachine'
  ERC20TOKEN = 'ERC20Vendable'
  ERC20IMAGE = "🍕"
  XDAI_PROVIDER = POA_XDAI_NODE
  LOADERIMAGE = ""
}

let innerStyle = {
  maxWidth:740,
  margin:'0 auto',
  textAlign:'left'
}

let buttonStyle = {
  primary: {
    paddingTop:16,
    paddingBottom:16,
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

const invLogoStyle = {
  maxWidth:50,
  maxHeight:50,
}

let metaReceiptTracker = {}


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
  let floatAmount = parseFloat(amount)
  amount = Math.floor(amount*1000)/1000
  return convertFromDollar(amount).toFixed(0)
}
let dollarDisplayCash = (amount)=>{
  let floatAmount = parseFloat(amount)
  amount = Math.floor(amount*100)/100
  return dollarSymbol+convertFromDollar(amount).toFixed(2)
}
let interval
let intervalLong
let originalStyle = {}

class App extends Component {
  constructor(props) {


    console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[["+title+"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
    let view = 'main'
    let cachedView = localStorage.getItem("view")
    let cachedViewSetAge = Date.now() - localStorage.getItem("viewSetTime")
    if(HARDCODEVIEW){
      view = HARDCODEVIEW
    }else if(cachedViewSetAge < 300000 && cachedView&&cachedView!=0){
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
      badges: {},
      selectedBadge: false,
    };
    this.alertTimeout = null;

    /*try{
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
    }catch(e){console.log(e)}*/

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
  selectBadge(id){
    this.setState({selectedBadge:id},()=>{
      this.changeView('send_badge')
    })
  }
  openScanner(returnState){
    this.setState({returnState:returnState,view:"send_by_scan"})
  }
  returnToState(scannerState){
    let updateState = Object.assign({scannerState:scannerState}, this.state.returnState);
    updateState.returnState = false
    console.log("UPDATE FROM RETURN STATE",updateState)
    this.setState(updateState)
  }
  clearBadges() {
    this.setState({badges:{}},()=>{
      console.log("BADGES CLEARED",this.state.badges)
    })
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
    /*incogDetect((result)=>{
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
          var contextElement = document.getElementById("context")
          contextElement.innerHTML = 'METAMASK';
        } else if(this.state.account && !this.state.metaAccount) {
          console.log("~~~*** WEB3",this.state.metaAccount,result)
          document.getElementById("main").style.backgroundImage = "linear-gradient(#234063, #305582)"
          document.body.style.backgroundColor = "#305582"
          var contextElement = document.getElementById("context")
          contextElement.innerHTML = 'WEB3';
        }
      }
    })*/
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
      }else if(window.location.pathname.length==43){
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
    intervalLong = setInterval(this.longPoll.bind(this),45000)
    setTimeout(this.longPoll.bind(this),150)

    let mainnetweb3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/e0ea6e73570246bbb3d4bd042c4b5dac'))
    let ensContract = new mainnetweb3.eth.Contract(require("./contracts/ENS.abi.js"),require("./contracts/ENS.address.js"))
    let daiContract
    try{
      daiContract = new mainnetweb3.eth.Contract(require("./contracts/StableCoin.abi.js"),"0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359")
    }catch(e){
      console.log("ERROR LOADING DAI Stablecoin Contract",e)
    }
    let xdaiweb3 = new Web3(new Web3.providers.HttpProvider(XDAI_PROVIDER))
    this.setState({mainnetweb3,ensContract,xdaiweb3,daiContract})
  }
  componentWillUnmount() {
    clearInterval(interval)
    clearInterval(intervalLong)
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }
  async poll() {

    let badgeBalance = 0
    if(this.state.contracts&&(this.state.network=="xDai"||this.state.network=="Unknown") && this.state.contracts.Badges){
      //check for badges for this user
      badgeBalance = await this.state.contracts.Badges.balanceOf(this.state.account).call()
      if(badgeBalance>0){
        let update = false
        for(let b = 0;b<badgeBalance;b++){
          let thisBadgeId = await this.state.contracts.Badges.tokenOfOwnerByIndex(this.state.account,b).call()
          if(!this.state.badges[thisBadgeId]){

            let thisBadgeData = await this.state.contracts.Badges.tokenURI(thisBadgeId).call()
            //console.log("BADGE",b,thisBadgeId,thisBadgeData)
            if(!this.state.badges[thisBadgeId]){
              console.log("Getting badge data ",thisBadgeData)
              let response = axios.get(thisBadgeData).then((response)=>{
                console.log("RESPONSE:",response)
                if(response && response.data){
                  this.state.badges[thisBadgeId] = response.data
                  this.state.badges[thisBadgeId].id = thisBadgeId
                  update=true
                }
              })

            }
          }
        }
        if(update){
          //console.log("Saving badges state...")
          this.setState({badges:this.state.badges})
        }

      }

    }


    //console.log(">>>>>>> <<< >>>>>> Looking into iframe...")
    //console.log(document.getElementById('galleassFrame').contentWindow['web3'])

    if(ERC20TOKEN&&this.state.contracts&&(this.state.network=="xDai"||this.state.network=="Unknown")){
      let gasBalance = await this.state.web3.eth.getBalance(this.state.account)
      gasBalance = this.state.web3.utils.fromWei(""+gasBalance,'ether')
      //console.log("Getting balanceOf "+this.state.account+" in contract ",this.state.contracts[ERC20TOKEN])
      let tokenBalance = await this.state.contracts[ERC20TOKEN].balanceOf(this.state.account).call()
      //console.log("balance is ",tokenBalance)
      tokenBalance = this.state.web3.utils.fromWei(""+tokenBalance,'ether')

      //console.log("Getting admin from ",this.state.contracts[ERC20VENDOR])
      let isAdmin = await this.state.contracts[ERC20VENDOR].isAdmin(this.state.account).call()
      //console.log("ISADMIN",this.state.account,isAdmin)
      let isVendor = await this.state.contracts[ERC20VENDOR].vendors(this.state.account).call()
      //console.log("isVendor",isVendor)

      let vendorObject = this.state.vendorObject
      let products = []//this.state.products
      if(isVendor.isAllowed){
        //console.log("LOADING VENDOR PRODUCTS")
        let id = 0
        if(!vendorObject){
          let vendorData = await this.state.contracts[ERC20VENDOR].vendors(this.state.account).call()
          //console.log("vendorData",vendorData)
          vendorData.name = this.state.web3.utils.hexToUtf8(vendorData.name)
          vendorObject = vendorData
        }
        //console.log("Looking up products for vendor ",this.state.account)
        if(!products){
          products = []
        }
        let found = true
        while(found){
          let nextProduct = await this.state.contracts[ERC20VENDOR].products(this.state.account,id).call()
          if(nextProduct.exists){
            products[id++] = nextProduct
          }else{
            found=false
          }
        }
      }
      //console.log("isVendor",isVendor,"SAVING PRODUCTS",products)

      this.setState({gasBalance:gasBalance,balance:tokenBalance,isAdmin:isAdmin,isVendor:isVendor,hasUpdateOnce:true,vendorObject,products})
    }


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
        }



      }
      if(this.state.xdaiweb3){
        xdaiBalance = await this.state.xdaiweb3.eth.getBalance(this.state.account)
        xdaiBalance = this.state.xdaiweb3.utils.fromWei(""+xdaiBalance,'ether')
      }

      this.setState({ethBalance,daiBalance,xdaiBalance,badgeBalance,hasUpdateOnce:true})
    }


  }
  longPoll() {
    axios.get("https://api.coinmarketcap.com/v2/ticker/1027/")
     .then((response)=>{
       let ethprice = response.data.data.quotes.USD.price
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
      if(this.state.metaAccount && this.state.metaAccount.privateKey.replace("0x","") == this.state.possibleNewPrivateKey.replace("0x","")){
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
  async ensLookup(name){
    let hash = namehash.hash(name)
    console.log("namehash",name,hash)
    let resolver = await this.state.ensContract.methods.resolver(hash).call()
    if(resolver=="0x0000000000000000000000000000000000000000") return "0x0000000000000000000000000000000000000000"
    console.log("resolver",resolver)
    let ensResolver = new this.state.mainnetweb3.eth.Contract(require("./contracts/ENSResolver.abi.js"),resolver)
    console.log("ensResolver:",ensResolver)
    return ensResolver.methods.addr(hash).call()
  }
  async chainClaim(tx, contracts) {
    console.log("DOING CLAIM ONCHAIN", this.state.claimId, this.state.claimKey, this.state.account);
    this.setState({sending: true})

    let fund = await contracts.Links.funds(this.state.claimId).call()
    console.log("FUND FOR "+this.state.claimId+" IS: ", fund)
    if (parseInt(fund[5].toString())>0) {
      this.setState({fund: fund})


      let claimHash = this.state.web3.utils.soliditySha3(
        {type: 'bytes32', value: this.state.claimId}, // fund id
        {type: 'address', value: this.state.account}, // destination address
        {type: 'uint256', value: fund[5]}, // nonce
        {type: 'address', value: contracts.Links._address} // contract address
      )
      console.log("claimHash", claimHash)
      console.log("this.state.claimKey", this.state.claimKey)
      let sig = this.state.web3.eth.accounts.sign(claimHash, this.state.claimKey);
      sig = sig.signature;

      console.log("CLAIM TX:", this.state.claimId, sig, claimHash, this.state.account)
      tx(contracts.Links.claim(this.state.claimId, sig, claimHash, this.state.account), 250000, false, 0, (result) => {
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
      .catch((error) => {
        console.log(error);
      });
    }else{
      console.log("FUND IS NOT READY YET, WAITING...")
      if(FAILCOUNT++>1){
        this.changeAlert({type: 'danger', message: 'Sorry. Failed to claim. Already claimed?'})
        setTimeout(() => {
          this.setState({sending: false}, () => {
            //alert("DONE")
            window.location = "/"
          })
        }, 2000)
      }
      setTimeout(()=>{
        this.chainClaim(tx, contracts)
      },3000)
    }

    this.forceUpdate();
  }
  async relayClaim() {
    console.log("DOING CLAIM THROUGH RELAY")
    let fund = await this.state.contracts.Links.funds(this.state.claimId).call()
      if (parseInt(fund[5].toString())>0) {
        this.setState({fund: fund})
        console.log("FUND: ", fund)

        let claimHash = this.state.web3.utils.soliditySha3(
          {type: 'bytes32', value: this.state.claimId}, // fund id
          {type: 'address', value: this.state.account}, // destination address
          {type: 'uint256', value: fund[5]}, // nonce
          {type: 'address', value: this.state.contracts.Links._address} // contract address
        )
        console.log("claimHash", claimHash)
        console.log("this.state.claimKey", this.state.claimKey)
        let sig = this.state.web3.eth.accounts.sign(claimHash, this.state.claimKey);
        sig = sig.signature
        /* getGasPrice() is not implemented on Metamask, leaving the code as reference. */
        //this.state.web3.eth.getGasPrice()
        //.then((gasPrice) => {

          console.log("CLAIM TX:", this.state.claimId, sig, claimHash, this.state.account)

          this.setState({sending: true})
        let relayClient = new gasless.RelayClient(this.state.web3);

        if(this.state.metaAccount && this.state.metaAccount.privateKey){
          relayClient.useKeypairForSigning(this.state.metaAccount)
        }
        console.log("Calling encodeABU on Links.claim() ",this.state.claimId, sig, claimHash, this.state.account)
        let claimData = this.state.contracts.Links.claim(this.state.claimId, sig, claimHash, this.state.account).encodeABI()
        //let network_gas_price = await this.state.web3.eth.getGasPrice();
        // Sometimes, xDai network returns '0'
        //if (!network_gas_price || network_gas_price == 0) {
        //  network_gas_price = 222222222222; // 222.(2) gwei
        //}
        let options = {
          from: this.state.account,
          to: this.state.contracts.Links._address,
          txfee: 12,
          gas_limit: 150000,
          gas_price: Math.trunc(1000000000 * 25)
        }
        console.log("Hitting relayClient with relayTransaction()",claimData, options)
        relayClient.relayTransaction(claimData, options).then((transaction) => {
            console.log("TX REALYED: ", transaction)
            this.setState({claimed: true})
            setTimeout(() => {
              this.setState({sending: false}, () => {
                //alert("DONE")
                window.location = "/"
              })
            }, 2000)
          })
      //})
      //.catch((error) => {
      //  console.log(error); //Get Gas price promise
      //});
    }else{
      this.changeAlert({type: 'danger', message: 'Sorry. Failed to claim. Already claimed?'})
      setTimeout(() => {
        this.setState({sending: false}, () => {
          //alert("DONE")
          window.location = "/"
        })
      }, 2000)
      console.log("Fund is not valid yet, trying again....")
      setTimeout(this.relayClaim,2000)
    }
  }
  setReceipt = (obj)=>{
    this.setState({receipt:obj})
  }
  changeView = (view,cb) => {
    if(view=="exchange"||view=="main"/*||view.indexOf("account_")==0*/){
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
        //let parsedData = EthCrypto.cipher.parse(input.substring(2))
        //const endMessage = await EthCrypto.decryptWithPrivateKey(
        //  this.state.metaAccount.privateKey, // privateKey
        //  parsedData // encrypted-data
        //);
        //return  endMessage
        return this.state.web3.utils.hexToUtf8(input)
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
  if(web3 && !this.checkNetwork() && view!="exchange"){
    networkOverlay = (
      <div>
        <input style={{zIndex:13,position:'absolute',opacity:0.95,right:48,top:192,width:194}} value="https://dai.poa.network" />
        <img style={{zIndex:12,position:'absolute',opacity:0.95,right:0,top:0,maxHeight:370}} src={customRPCHint} />
      </div>
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
        this.setState({contracts: contracts,customLoader: customLoader}, async () => {
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
          state.nativeSend = state.send
          //delete state.send
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


  let extraHead = ""
  if(this.state.extraHeadroom){
    extraHead = (
      <div style={{marginTop:this.state.extraHeadroom}}>
      </div>
    )
  }

  let totalBalance = parseFloat(this.state.ethBalance) * parseFloat(this.state.ethprice) + parseFloat(this.state.daiBalance) + parseFloat(this.state.xdaiBalance)
  if(ERC20TOKEN){
    totalBalance += parseFloat(this.state.balance)
  }

  let header = (
    <div style={{height:50}}>
    </div>
  )
  if(web3){
    header = (
      <Header
        openScanner={this.openScanner.bind(this)}
        network={this.state.network}
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


          if(ERC20TOKEN){
              moreButtons = (
                <div>
                  <MoreButtons
                    buttonStyle={buttonStyle}
                    changeView={this.changeView}
                    isVendor={false}
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
                    contract={this.state.contracts[ERC20VENDOR]}
                    eventName={"UpdateVendor"}
                    block={this.state.block}
                    onUpdate={(vendor, all)=>{
                      let {vendors} = this.state
                      console.log("VENDOR",vendor)
                      if(!vendors[vendor.vendor] || vendors[vendor.vendor].blockNumber<vendor.blockNumber){
                        vendors[vendor.vendor] = {
                          name: this.state.web3.utils.hexToUtf8(vendor.name),
                          isAllowed: vendor.isAllowed,
                          isActive: vendor.isActive,
                          vendor: vendor.vendor,
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




          let selected = "xDai"
          let extraTokens = ""

          let defaultBalanceDisplay = (
            <div>
              <Balance icon={"⛽"} selected={false} text={"xdai"} amount={this.state.xdaiBalance} address={account} dollarDisplay={dollarDisplayCash} />
              <Ruler/>
            </div>
          )

          if(ERC20TOKEN){
            selected = ERC20NAME
            extraTokens = (
              <div>
                <Balance icon={ERC20IMAGE} selected={selected} text={ERC20NAME} amount={this.state.balance} address={account} dollarDisplay={dollarDisplay} />
                <Ruler/>
              </div>
            )
            defaultBalanceDisplay = extraTokens
          }

          let badgeDisplay = ""
          if(this.state.badgeBalance>0){
            badgeDisplay = (
              <div>
                <Badges
                  badges={this.state.badges}
                  address={account}
                  selectBadge={this.selectBadge.bind(this)}
                />
                <Ruler/>
              </div>
            )
          }

          switch(view) {
            case 'main':
            return (
              <div>
                <div className="main-card card w-100" style={{zIndex:1}}>


                  {extraTokens}

                  <Balance icon={"⛽"} selected={selected} text={"xDai"} amount={this.state.xdaiBalance} address={account} dollarDisplay={dollarDisplayCash}/>
                  <Ruler/>

                  {badgeDisplay}

                  <MainCard
                    subBalanceDisplay={subBalanceDisplay}
                    buttonStyle={buttonStyle}
                    address={account}
                    balance={balance}
                    changeAlert={this.changeAlert}
                    changeView={this.changeView}
                    dollarDisplay={dollarDisplay}
                    ERC20TOKEN={ERC20TOKEN}
                  />
                  {moreButtons}
                  <RecentTransactions
                    dollarDisplay={dollarDisplay}
                    view={this.state.view}
                    buttonStyle={buttonStyle}
                    ERC20TOKEN={ERC20TOKEN}
                    transactionsByAddress={ERC20TOKEN?this.state.fullTransactionsByAddress:this.state.transactionsByAddress}
                    changeView={this.changeView}
                    address={account}
                    block={this.state.block}
                    recentTxs={ERC20TOKEN?this.state.fullRecentTxs:this.state.recentTxs}
                  />
                </div>
                <Bottom
                  icon={"wrench"}
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
                <div className="main-card card w-100" style={{zIndex:1}}>

                  <NavCard title={i18n.t('advance_title')} goBack={this.goBack.bind(this)}/>
                  <Advanced
                    isVendor={this.state.isVendor && this.state.isVendor.isAllowed}
                    buttonStyle={buttonStyle}
                    address={account}
                    balance={balance}
                    changeView={this.changeView}
                    privateKey={metaAccount.privateKey}
                    changeAlert={this.changeAlert}
                    goBack={this.goBack.bind(this)}
                    setPossibleNewPrivateKey={this.setPossibleNewPrivateKey.bind(this)}
                  />
                </div>
                <Bottom
                  action={()=>{
                    this.changeView('main')
                  }}
                />
              </div>
            )
            case 'send_by_scan':
            return (
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
            );
            case 'withdraw_from_private':


              return (
                <div>
                  <div className="send-to-address card w-100" style={{zIndex:1}}>
                    <NavCard title={i18n.t('withdraw')} goBack={this.goBack.bind(this)}/>
                    {defaultBalanceDisplay}
                    <WithdrawFromPrivate
                      ERC20TOKEN={ERC20TOKEN}
                      products={this.state.products}
                      buttonStyle={buttonStyle}
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
                  <Bottom
                    action={()=>{
                      this.changeView('main')
                    }}
                  />
                </div>
              );
            case 'send_badge':
            return (
              <div>
                <div className="send-to-address card w-100" style={{zIndex:1}}>
                  <NavCard title={this.state.badges[this.state.selectedBadge].name} titleLink={this.state.badges[this.state.selectedBadge].external_url} goBack={this.goBack.bind(this)}/>
                  <SendBadge
                    changeView={this.changeView}
                    ensLookup={this.ensLookup.bind(this)}
                    ERC20TOKEN={ERC20TOKEN}
                    buttonStyle={buttonStyle}
                    balance={balance}
                    web3={this.state.web3}
                    contracts={this.state.contracts}
                    address={account}
                    scannerState={this.state.scannerState}
                    tx={this.state.tx}
                    goBack={this.goBack.bind(this)}
                    openScanner={this.openScanner.bind(this)}
                    setReceipt={this.setReceipt}
                    changeAlert={this.changeAlert}
                    dollarDisplay={dollarDisplay}
                    badge={this.state.badges[this.state.selectedBadge]}
                    clearBadges={this.clearBadges.bind(this)}
                  />
                </div>
                <Bottom
                  text={i18n.t('done')}
                  action={this.goBack.bind(this)}
                />
              </div>
            )
            case 'send_to_address':
            return (
              <div>
                <div className="send-to-address card w-100" style={{zIndex:1}}>
                  <NavCard title={i18n.t('send_to_address_title')} goBack={this.goBack.bind(this)}/>
                  {defaultBalanceDisplay}
                  <SendToAddress
                    convertToDollar={convertToDollar}
                    dollarSymbol={dollarSymbol}
                    parseAndCleanPath={this.parseAndCleanPath.bind(this)}
                    openScanner={this.openScanner.bind(this)}
                    scannerState={this.state.scannerState}
                    ensLookup={this.ensLookup.bind(this)}
                    ERC20TOKEN={ERC20TOKEN}
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
                  />
                </div>
                <Bottom
                  text={i18n.t('cancel')}
                  action={this.goBack.bind(this)}
                />
              </div>
            );
            case 'receipt':
            return (
              <div>
                <div className="main-card card w-100" style={{zIndex:1}}>

                  <NavCard title={i18n.t('receipt_title')} goBack={this.goBack.bind(this)}/>
                  <Receipt
                    receipt={this.state.receipt}
                    view={this.state.view}
                    block={this.state.block}
                    ensLookup={this.ensLookup.bind(this)}
                    ERC20TOKEN={ERC20TOKEN}
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
                </div>
                <Bottom
                  action={this.goBack.bind(this)}
                />
              </div>
            );
            case 'receive':
            return (
              <div>
                <div className="main-card card w-100" style={{zIndex:1}}>

                  <NavCard title={i18n.t('receive_title')} goBack={this.goBack.bind(this)}/>
                  {defaultBalanceDisplay}
                  <Receive
                    dollarDisplay={dollarDisplay}
                    view={this.state.view}
                    block={this.state.block}
                    ensLookup={this.ensLookup.bind(this)}
                    ERC20TOKEN={ERC20TOKEN}
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
                </div>
                <Bottom
                  action={this.goBack.bind(this)}
                />
              </div>
            );
            case 'request_funds':
            return (
              <div>
                <div className="main-card card w-100" style={{zIndex:1}}>

                  <NavCard title={i18n.t('request_funds_title')} goBack={this.goBack.bind(this)}/>
                  {defaultBalanceDisplay}
                  <RequestFunds
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
                    dollarSymbol={dollarSymbol}
                    transactionsByAddress={this.state.transactionsByAddress}
                    fullTransactionsByAddress={this.state.fullTransactionsByAddress}
                    fullRecentTxs={this.state.fullRecentTxs}
                    recentTxs={this.state.recentTxs}
                  />
                </div>
                <Bottom
                  action={this.goBack.bind(this)}
                />
              </div>
            );


            case 'burn-wallet':
            return (
              <div>
                <div className="main-card card w-100" style={{zIndex:1}}>

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
                <Bottom
                  text={i18n.t('cancel')}
                  action={this.goBack.bind(this)}
                />
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
        fallbackWeb3Provider={WEB3_PROVIDER}
        onUpdate={async (state) => {
          //console.log("DAPPARATUS UPDATE",state)
          if(ERC20TOKEN){
            delete state.balance
          }
          if (state.web3Provider) {
            state.web3 = new Web3(state.web3Provider)
            this.setState(state,()=>{
              this.detectContext()
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

        <div id="context" style={{position:"absolute",right:5,top:-15,opacity:0.2,zIndex:100,fontSize:60,color:'#FFFFFF'}}>
        </div>

        {eventParser}
      </div>
    </div>
    </I18nextProvider>
  )
}
}

//<iframe id="galleassFrame" style={{zIndex:99,position:"absolute",left:0,top:0,width:800,height:600}} src="https://galleass.io" />


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
        if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
          metaReceiptTracker[receipt.transactionHash] = true
          cb(receipt)
        }
      }).on('error',(error)=>{
        console.log("ERRROROROROROR",error)
        let errorString = error.toString()
        if(errorString.indexOf("have enough funds")>=0){
          this.changeAlert({type: 'danger', message: 'Not enough funds to send message.'})
        }else{
          this.changeAlert({type: 'danger', message: errorString})
        }
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
      gasPrice: Math.round(this.state.gwei * 1010101010)
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

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
