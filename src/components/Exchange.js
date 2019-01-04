import React from 'react';
import Ruler from "./Ruler";
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import eth from '../ethereum.png';
import dai from '../dai.jpg';
import xdai from '../xdai.jpg';
import dendai from '../bufficorn.png';
import wyre from '../wyre.jpg';
import coinbase from '../coinbase.jpg';
import localeth from '../localeth.png';

import Web3 from 'web3';
import axios from "axios"

const GASBOOSTPRICE = 0.1

const logoStyle = {
  maxWidth:50,
}

const colStyle = {
  textAlign:"center",
  whiteSpace:"nowrap"
}

const daiContractObject = {
  address:"0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359",
  abi:require("../contracts/StableCoin.abi.js"),
  blocknumber:4752008,
}

const dendaiToxDaiEstimatedTime = 12000
const xdaiToDaiEstimatedTime = 160000
const daiToxDaiEstimatedTime = 330000

const sendDaiEstimatedTime = 160000

const exchangeEstimatedTime = 300000

const toXdaiBridgeAccount = "0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016"
const toDaiBridgeAccount = "0x7301cfa0e1756b71869e93d4e4dca5c7d0eb0aa6"

const uniswapExchangeAccount = "0x09cabec1ead1c0ba254b09efb3ee13841712be14"
const uniswapContractObject = {
  address:uniswapExchangeAccount,
  abi:require("../contracts/Exchange.abi.js"),
  blocknumber:6627956,
}

let interval
let intervalLong

export default class Exchange extends React.Component {

  constructor(props) {
    super(props);

    let xdaiweb3
    //make it easier for local debugging...
    if(false && window.location.hostname.indexOf("localhost")>=0){
      console.log("WARNING, USING LOCAL RPC")
      xdaiweb3 = new Web3(new Web3.providers.HttpProvider("http://0.0.0.0:8545"))
    } else {
      xdaiweb3 = new Web3(new Web3.providers.HttpProvider("https://dai.poa.network"))
    }

    //let mainnetweb3 = new Web3("https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac")
    let mainnetweb3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/e0ea6e73570246bbb3d4bd042c4b5dac'))
    let pk = localStorage.getItem('metaPrivateKey')
    let mainnetMetaAccount = false
    let xdaiMetaAccount = false
    let daiAddress = false
    let xdaiAddress = false
    if(pk&&pk!="0"){
      mainnetMetaAccount =  mainnetweb3.eth.accounts.privateKeyToAccount(pk)
      daiAddress = mainnetMetaAccount.address.toLowerCase();
      xdaiMetaAccount = xdaiweb3.eth.accounts.privateKeyToAccount(pk)
      xdaiAddress = xdaiMetaAccount.address.toLowerCase();
    }else{
      daiAddress = this.props.address
      xdaiAddress = this.props.address
    }
    let daiContract
    try{
      console.log("Loading DAI Stablecoin Contract...")
      daiContract = new mainnetweb3.eth.Contract(daiContractObject.abi,daiContractObject.address)
    }catch(e){
      console.log("ERROR LOADING DAI Stablecoin Contract",e)
    }

    let dendaiContract
    if(props.ERC20TOKEN){
      try{
        console.log("Loading DenDai Contract...")
        dendaiContract = new xdaiweb3.eth.Contract(require("../contracts/DenDai.abi.js"),require("../contracts/DenDai.address.js"))
      }catch(e){
        console.log("ERROR LOADING dendaiContract Contract",e)
      }
    }

    this.state = {
      ethBalance: 0,
      daiBalance: 0,
      daiAddress: daiAddress,
      xdaiBalance: 0,
      xdaiAddress: xdaiAddress,
      wyreBalance: 0,
      ethprice: 0,
      denDaiBalance:0,
      mainnetweb3: mainnetweb3,
      mainnetMetaAccount: mainnetMetaAccount,
      xdaiweb3:xdaiweb3,
      xdaiMetaAccount: xdaiMetaAccount,
      daiContract: daiContract,
      dendaiContract: dendaiContract,
      daiToXdaiMode: false,
      ethToDaiMode: false,
      loaderBarStatusText:"loading...",
      loaderBarStartTime:Date.now(),
      loaderBarPercent: 2,
      loaderBarColor: "#aaaaaa",
      gwei: 5
    }
  }
  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth() })
    });
  };
  async componentDidMount(){
    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth() })
    interval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
    intervalLong = setInterval(this.longPoll.bind(this),45000)
    setTimeout(this.longPoll.bind(this),150)
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  async poll(){
    let { daiContract, dendaiContract, mainnetweb3, xdaiweb3, xdaiAddress} = this.state
    if(daiContract){
      let daiBalance = await daiContract.methods.balanceOf(this.state.daiAddress).call()
      daiBalance = mainnetweb3.utils.fromWei(daiBalance,"ether")
      if(daiBalance!=this.state.daiBalance){
        this.setState({daiBalance})
      }
    }
    if(this.props.ERC20TOKEN){
      let denDaiBalance = await dendaiContract.methods.balanceOf(this.state.daiAddress).call()
      denDaiBalance = mainnetweb3.utils.fromWei(denDaiBalance,"ether")
      if(denDaiBalance!=this.state.denDaiBalance){
        this.setState({denDaiBalance})
      }

      //dendaiToxDaiEstimatedTime
      if(this.state.xdaiToDendaiMode=="withdrawing"){
        let txAge = Date.now() - this.state.loaderBarStartTime
        let percentDone = Math.min(100,((txAge * 100) / dendaiToxDaiEstimatedTime)+5)

        let xdaiBalanceShouldBe = parseFloat(this.state.xdaiBalanceShouldBe)-0.0005
        console.log("watching for ",this.state.xdaiBalance,"to be ",xdaiBalanceShouldBe)
        if(this.state.xdaiBalance>=(xdaiBalanceShouldBe)){
          this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Transferred!",loaderBarColor:"#62f54a"})
          setTimeout(()=>{
            this.setState({
              xdaiToDendaiMode: false,
              loaderBarStatusText:"Loading...",
              loaderBarStartTime:0,
              loaderBarPercent: 1,
              loaderBarColor: "#FFFFFF"
            })
          },3500)
        }else{
          this.setState({loaderBarPercent:percentDone})
        }

      }else if(this.state.xdaiToDendaiMode=="depositing"){
        let txAge = Date.now() - this.state.loaderBarStartTime
        let percentDone = Math.min(100,((txAge * 100) / daiToxDaiEstimatedTime)+5)

        //console.log("watching for ",this.state.xdaiBalance,"to be ",this.state.xdaiBalanceShouldBe-0.0005)
        if(this.state.xdaiBalance<=(this.state.xdaiBalanceShouldBe+0.00005)){
          this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Bridged!",loaderBarColor:"#62f54a"})
          setTimeout(()=>{
            this.setState({
              xdaiToDendaiMode: false,
              loaderBarStatusText:"Loading...",
              loaderBarStartTime:0,
              loaderBarPercent: 1,
              loaderBarColor: "#FFFFFF"
            })
          },3500)
        }else{
          this.setState({loaderBarPercent:percentDone})
        }
      }

    }
    this.setState({ethBalance:mainnetweb3.utils.fromWei(await mainnetweb3.eth.getBalance(this.state.daiAddress),'ether') })
    if(xdaiweb3){
      //console.log("xdaiweb3:",xdaiweb3,"xdaiAddress",xdaiAddress)
      let xdaiBalance = await xdaiweb3.eth.getBalance(this.state.daiAddress)
      //console.log("!! xdaiBalance:",xdaiBalance)
      this.setState({xdaiBalance:xdaiweb3.utils.fromWei(xdaiBalance,'ether')})
    }
    if(this.state.daiToXdaiMode=="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / xdaiToDaiEstimatedTime)+5)

      console.log("watching for ",this.state.daiBalance,"to be ",this.state.daiBalanceShouldBe-0.0005)
      if(this.state.daiBalance>=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Bridged!",loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText:"Loading...",
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }

    }else if(this.state.daiToXdaiMode=="depositing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / daiToxDaiEstimatedTime)+5)

      //console.log("watching for ",this.state.xdaiBalance,"to be ",this.state.xdaiBalanceShouldBe-0.0005)
      if(this.state.xdaiBalance>=(this.state.xdaiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Bridged!",loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText:"Loading...",
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }
    }else if(this.state.daiToXdaiMode=="sending"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / sendDaiEstimatedTime)+5)

      console.log("watching for ",this.state.daiBalance,"to be ",this.state.daiBalanceShouldBe-0.0005)
      if(this.state.daiBalance<=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Bridged!",loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText:"Loading...",
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }
    }


    if(this.state.ethToDaiMode=="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / exchangeEstimatedTime) + 5)
      //ethBalanceAtStart:this.state.ethBalance,
      //ethBalanceShouldBe:this.state.ethBalance+amountOfChange,
      console.log("watching for ",this.state.ethBalance,"to be ",this.state.ethBalanceShouldBe-0.001)
      if(parseFloat(this.state.ethBalance)>=(this.state.ethBalanceShouldBe-0.001)){
        this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Exchanged!",loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText:"Loading...",
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }

    }else if(this.state.ethToDaiMode=="depositing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / exchangeEstimatedTime)+5)

      //console.log("watching for ",this.state.xdaiBalance,"to be ",this.state.xdaiBalanceShouldBe-0.0005)
      if(this.state.daiBalance>=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Exchanged!",loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText:"Loading...",
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }
    }else if(this.state.ethToDaiMode=="sending"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / exchangeEstimatedTime) + 5)
      //ethBalanceAtStart:this.state.ethBalance,
      //ethBalanceShouldBe:this.state.ethBalance+amountOfChange,
      console.log("watching for ",this.state.ethBalance,"to be ",this.state.ethBalanceShouldBe-0.001)
      if(parseFloat(this.state.ethBalance)<=(this.state.ethBalanceShouldBe-0.001)){
        this.setState({loaderBarPercent:100,loaderBarStatusText:"Funds Exchanged!",loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText:"Loading...",
            loaderBarStartTime:0,
            loaderBarPercent: 1,
            loaderBarColor: "#FFFFFF"
          })
        },3500)
      }else{
        this.setState({loaderBarPercent:percentDone})
      }

    }

  }
  longPoll() {
    axios.get("https://api.coinmarketcap.com/v2/ticker/1027/")
     .then((response)=>{
       let ethprice = response.data.data.quotes.USD.price
       this.setState({ethprice})
     })
  }
  sendDai(){
    if(parseFloat(this.state.daiBalance)<parseFloat(this.state.daiSendAmount)){
      this.props.changeAlert({type: 'warning',message: 'Insufficient funds'});
    }else if(!this.state.daiSendToAddress || !this.state.daiSendToAddress.length === 42){
      this.props.changeAlert({type: 'warning',message: 'Please enter a valid to address'});
    }else if(!(parseFloat(this.state.daiSendAmount) > 0)){
      this.props.changeAlert({type: 'warning',message: 'Please enter a valid amount to send'});
    }else{
      this.setState({
        daiToXdaiMode:"sending",
        daiBalanceAtStart:this.state.daiBalance,
        daiBalanceShouldBe:parseFloat(this.state.daiBalance)-parseFloat(this.state.daiSendAmount),
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText:"Calculating best gas price...",
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert("go to etherscan?")
        }
      })
      this.setState({sendDai:false})
      this.transferDai(this.state.daiSendToAddress,this.state.daiSendAmount,"Sending "+this.state.daiSendAmount+" DAI to "+this.state.daiSendToAddress+"...",()=>{
        this.props.changeAlert({type: 'success',message: "Sent "+this.state.daiSendAmount+" DAI to "+this.state.daiSendToAddress});
        this.setState({
          daiToXdaiMode:false,
          daiSendAmount:"",
          daiSendToAddress:"",
          loaderBarColor:"#FFFFFF",
          loaderBarStatusText:"",
        })
      })

    }
  }
  canSendDai() {
    return (this.state.daiSendToAddress && this.state.daiSendToAddress.length === 42 && parseFloat(this.state.daiSendAmount)>0 && parseFloat(this.state.daiSendAmount) <= parseFloat(this.state.daiBalance))
  }
  transferDai(destination,amount,message,cb) {
    axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
    .catch((err)=>{
      console.log("Error getting gas price",err)
    })
    .then((response)=>{
      if(response && response.data.average>0&&response.data.average<200){

        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        })

        response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
        let gwei = Math.round(response.data.average*100)/1000
        if(this.state.mainnetMetaAccount){
          //send funds using metaaccount on mainnet
          let mainDaiContract = new this.state.mainnetweb3.eth.Contract(daiContractObject.abi,daiContractObject.address)


          let paramsObject = {
            from: this.state.daiAddress,
            value: 0,
            gas: 100000,
            gasPrice: Math.round(gwei * 1000000000)
          }
          console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

          paramsObject.to = mainDaiContract._address
          paramsObject.data = mainDaiContract.methods.transfer(
            destination,
            this.state.mainnetweb3.utils.toWei(amount,"ether")
          ).encodeABI()

          console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

          this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
            console.log("========= >>> SIGNED",signed)
              this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                console.log("META RECEIPT",receipt)
                cb(receipt)
              }).on('error', (err)=>{
                console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
              }).then(console.log)
          });

        }else{
          //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
          console.log("Depositing to ",toDaiBridgeAccount)
          let mainDaiContract = new this.props.web3.eth.Contract(daiContractObject.abi,daiContractObject.address)
          this.setState({
            loaderBarColor:"#f5eb4a",
            loaderBarStatusText:message,
          })
          this.props.tx(mainDaiContract.methods.transfer(
            destination,
            this.state.mainnetweb3.utils.toWei(amount,"ether")
            ///TODO LET ME PASS IN A CERTAIN AMOUNT OF GAS INSTEAD OF LEANING BACK ON THE <GAS> COMPONENT!!!!!
          ),120000,0,0,(receipt)=>{
            if(receipt){
              console.log("SESSION WITHDRAWN:",receipt)
              cb(receipt)
            }
          })
        }
      }else{
        console.log("ERRORed RESPONSE FROM ethgasstation",response)
      }
    })
  }
  sendEth(){

    let actualEthSendAmount = parseFloat(this.state.ethSendAmount)/parseFloat(this.state.ethprice)

    if(parseFloat(this.state.ethBalance)<actualEthSendAmount){
      this.props.changeAlert({type: 'warning',message: 'Insufficient funds'});
    }else if(!this.state.ethSendToAddress || !this.state.ethSendToAddress.length === 42){
      this.props.changeAlert({type: 'warning',message: 'Please enter a valid to address'});
    }else if(!(actualEthSendAmount>0)){
      this.props.changeAlert({type: 'warning',message: 'Please enter a valid amount to send'});
    }else{
      this.setState({
        ethToDaiMode:"sending",
        ethBalanceAtStart:this.state.ethBalance,
        ethBalanceShouldBe:parseFloat(this.state.ethBalance)-actualEthSendAmount,
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText:"Calculating best gas price...",
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert("go to etherscan?")
        }
      })
      this.setState({sendEth:false})
      this.transferEth(this.state.ethSendToAddress,false,actualEthSendAmount,"Sending $"+this.state.ethSendAmount+" of ETH to "+this.state.ethSendToAddress+"...",()=>{
        this.props.changeAlert({type: 'success',message: "Sent $"+this.state.ethSendAmount+" of ETH to "+this.state.ethSendToAddress});
        this.setState({
          ethToDaiMode:false,
          ethSendAmount:"",
          ethSendToAddress:"",
          loaderBarColor:"#FFFFFF",
          loaderBarStatusText:"",
        })
      })

    }
  }
  canSendEth() {
    let actualEthSendAmount = parseFloat(this.state.ethSendAmount)/parseFloat(this.state.ethprice)
    return (this.state.ethSendToAddress && this.state.ethSendToAddress.length === 42 && actualEthSendAmount>0 && actualEthSendAmount <= parseFloat(this.state.ethBalance))
  }
  transferEth(destination,call,amount,message,cb){
    if(this.state.mainnetMetaAccount){
      //send funds using metaaccount on mainnet

      axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
      .catch((err)=>{
        console.log("Error getting gas price",err)
      })
      .then((response)=>{
        if(response && response.data.average>0&&response.data.average<200){

          this.setState({
            loaderBarColor:"#f5eb4a",
            loaderBarStatusText:message,
          })

          response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
          let gwei = Math.round(response.data.average*100)/1000
          let paramsObject = {
            from: this.state.daiAddress,
            value: amount,
            gas: 240000,
            gasPrice: Math.round(gwei * 1000000000)
          }
          console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

          paramsObject.to = destination
          if(call){
            paramsObject.data = call.encodeABI()
          }else{
            paramsObject.data = "0x0"
          }

          console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

          this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
            console.log("========= >>> SIGNED",signed)
              this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                console.log("META RECEIPT",receipt)
                cb(receipt)
              }).on('error', (err)=>{
                console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
              }).then(console.log)
          });

        }else{
          console.log("ERRORed RESPONSE FROM ethgasstation",response)
        }
      })

    }else{
      console.log("Using uniswap exchange to move ETH to DAI")


      //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
      this.setState({
        amount:"",
        loaderBarColor:"#4ab3f5",
        loaderBarStatusText:message,
        loaderBarClick:()=>{
          alert("idk where to go from here? something that explains the bridge?")
        }
      })
      if(call){
        this.props.tx(
          call
        ,240000,0,amount,(receipt)=>{
          if(receipt){
            console.log("EXCHANGE COMPLETE?!?",receipt)
            cb(receipt)
          }
        })
      }else{
        this.props.send(
          destination,
          amount,
          240000,
          (receipt)=>{
          if(receipt){
            console.log("SEND COMPLETE?!?",receipt)
            cb(receipt)
          }
        })
      }

    }
  }
  render() {
    let {xdaiToDendaiMode,daiToXdaiMode,ethToDaiMode} = this.state

    let ethCancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({ethToDaiMode:false})
        }}>
          <i className="fas fa-times"/> cancel
        </a>
      </span>
    )
    let daiCancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({daiToXdaiMode:false})
        }}>
          <i className="fas fa-times"/> cancel
        </a>
      </span>
    )
    let xdaiCancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({xdaiToDendaiMode:false})
        }}>
          <i className="fas fa-times"/> cancel
        </a>
      </span>
    )

    let buttonsDisabled = (
      xdaiToDendaiMode=="sending" || xdaiToDendaiMode=="withdrawing" || xdaiToDendaiMode=="depositing" ||
      daiToXdaiMode=="sending" || daiToXdaiMode=="withdrawing" || daiToXdaiMode=="depositing" ||
      ethToDaiMode=="sending" || ethToDaiMode=="depositing" || ethToDaiMode=="withdrawing"
    )

    let adjustedFontSize = Math.round((Math.min(document.documentElement.clientWidth,600)/600)*24)
    let adjustedTop = Math.round((Math.min(document.documentElement.clientWidth,600)/600)*-20)+9

    let xdaiToDendaiDisplay = "loading..."

    let tokenDisplay = ""
    if(this.props.ERC20TOKEN){
      if(xdaiToDendaiMode=="sending" || xdaiToDendaiMode=="withdrawing" || xdaiToDendaiMode=="depositing"){
        xdaiToDendaiDisplay = (
          <div className="content ops row" style={{position:"relative"}}>
            <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
              className="btn btn-large"
            >
            </button>
            <div style={{position:'absolute',left:"50%",width:"100%",marginLeft:"-50%",fontSize:adjustedFontSize,top:adjustedTop,opacity:0.95,textAlign:"center"}}>
              {this.state.loaderBarStatusText}
            </div>
          </div>
        )

      }else if(xdaiToDendaiMode=="deposit"){
        console.log("CHECKING META ACCOUNT ",this.state.xdaiMetaAccount,this.props.network)
        if(!this.state.xdaiMetaAccount && (this.props.network!="xDai"&&this.props.network!="Unknown")){
          xdaiToDendaiDisplay = (
            <div className="content ops row" style={{textAlign:'center'}}>
              <div className="col-12 p-1">
                Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>dai.poa.network</span>
                <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                  <i className="fas fa-times"/> dismiss
                </a>
              </div>
            </div>
          )
        }else{
          xdaiToDendaiDisplay = (
            <div className="content ops row">

              <div className="col-1 p-1"  style={colStyle}>
                <i className="fas fa-arrow-up"  />
              </div>
              <div className="col-5 p-1" style={colStyle}>
                <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">$</div>
                  </div>
                  <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                         onChange={event => this.updateState('amount', event.target.value)} />
                </div>
                </Scaler>
              </div>
              <div className="col-3 p-1"  style={colStyle}>
                <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
                {xdaiCancelButton}
                </Scaler>
              </div>
              <div className="col-3 p-1">
                <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={{whiteSpace:"nowrap",backgroundColor:this.props.mainStyle.mainColor}} onClick={async ()=>{

                  let amountOfxDaiToDeposit = this.state.xdaiweb3.utils.toWei(""+this.state.amount,'ether')
                  console.log("Using DenDai contract to deposit "+amountOfxDaiToDeposit+" xDai")

                  this.setState({
                    xdaiToDendaiMode:"depositing",
                    xdaiBalanceAtStart:this.state.xdaiBalance,
                    xdaiBalanceShouldBe:parseFloat(this.state.xdaiBalance)-parseFloat(this.state.amount),
                    loaderBarColor:"#3efff8",
                    loaderBarStatusText:"Depositing xDai into DenDai...",
                    loaderBarPercent:0,
                    loaderBarStartTime: Date.now(),
                    loaderBarClick:()=>{
                      alert("go to etherscan?")
                    }
                  })

                  if(this.state.xdaiMetaAccount){
                    //send funds using metaaccount on mainnet

                    let paramsObject = {
                      from: this.state.daiAddress,
                      value: amountOfxDaiToDeposit,
                      gas: 120000,
                      gasPrice: Math.round(1.1 * 1000000000)
                    }
                    console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                    paramsObject.to = this.state.dendaiContract._address
                    paramsObject.data = this.state.dendaiContract.methods.deposit().encodeABI()

                    console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                    this.state.xdaiweb3.eth.accounts.signTransaction(paramsObject, this.state.xdaiMetaAccount.privateKey).then(signed => {
                      console.log("========= >>> SIGNED",signed)
                        this.state.xdaiweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                          console.log("META RECEIPT",receipt)
                          this.setState({
                            amount:"",

                          })
                        }).on('error', (err)=>{
                          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                        }).then(console.log)
                    });

                  }else{
                    console.log("Use MetaMask to withdraw DenDai to xDai")
                    this.props.tx(
                      this.props.contracts.DenDai.deposit()
                    ,120000,0,amountOfxDaiToDeposit,(receipt)=>{
                      if(receipt){
                        console.log("EXCHANGE COMPLETE?!?",receipt)
                        //window.location = "/"+receipt.contractAddress
                      }
                    })
                  }

                }}>
                  <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                    <i className="fas fa-arrow-up" /> Send
                  </Scaler>
                </button>

              </div>
            </div>
          )
        }
      }else if(xdaiToDendaiMode=="withdraw"){
        console.log("CHECKING META ACCOUNT ",this.state.xdaiMetaAccount,this.props.network)
        if(!this.state.xdaiMetaAccount && (this.props.network!="xDai"&&this.props.network!="Unknown")){
          xdaiToDendaiDisplay = (
            <div className="content ops row" style={{textAlign:'center'}}>
              <div className="col-12 p-1">
                Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>dai.poa.network</span>
                <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                  <i className="fas fa-times"/> dismiss
                </a>
              </div>
            </div>
          )
        }else{
          xdaiToDendaiDisplay = (
            <div className="content ops row">

              <div className="col-1 p-1"  style={colStyle}>
                <i className="fas fa-arrow-down"  />
              </div>
              <div className="col-5 p-1" style={colStyle}>
                <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">$</div>
                  </div>
                  <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                         onChange={event => this.updateState('amount', event.target.value)} />
                </div>
                </Scaler>
              </div>
              <div className="col-3 p-1"  style={colStyle}>
                <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
                {xdaiCancelButton}
                </Scaler>
              </div>
              <div className="col-3 p-1">
                <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={{whiteSpace:"nowrap",backgroundColor:this.props.mainStyle.mainColor}} onClick={async ()=>{

                  let amountOfxDaiToWithdraw = this.state.xdaiweb3.utils.toWei(""+this.state.amount,'ether')
                  console.log("Using DenDai contract to withdraw "+amountOfxDaiToWithdraw+" xDai")

                  this.setState({
                    xdaiToDendaiMode:"withdrawing",
                    xdaiBalanceAtStart:this.state.xdaiBalance,
                    xdaiBalanceShouldBe:parseFloat(this.state.xdaiBalance)+parseFloat(this.state.amount),
                    loaderBarColor:"#3efff8",
                    loaderBarStatusText:"Withdrawing DenDai to xDai...",
                    loaderBarPercent:0,
                    loaderBarStartTime: Date.now(),
                    loaderBarClick:()=>{
                      alert("go to etherscan?")
                    }
                  })

                  if(this.state.xdaiMetaAccount){
                    //send funds using metaaccount on mainnet

                    let paramsObject = {
                      from: this.state.daiAddress,
                      value: 0,
                      gas: 120000,
                      gasPrice: Math.round(1.1 * 1000000000)
                    }
                    console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                    paramsObject.to = this.state.dendaiContract._address
                    paramsObject.data = this.state.dendaiContract.methods.withdraw(""+amountOfxDaiToWithdraw).encodeABI()

                    console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                    this.state.xdaiweb3.eth.accounts.signTransaction(paramsObject, this.state.xdaiMetaAccount.privateKey).then(signed => {
                      console.log("========= >>> SIGNED",signed)
                        this.state.xdaiweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                          console.log("META RECEIPT",receipt)
                          this.setState({
                            amount:"",

                          })
                        }).on('error', (err)=>{
                          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                        }).then(console.log)
                    });

                  }else{
                    console.log("Use MetaMask to withdraw DenDai to xDai")
                    this.props.tx(
                      this.props.contracts.DenDai.withdraw(""+amountOfxDaiToWithdraw)
                    ,120000,0,0,(receipt)=>{
                      if(receipt){
                        console.log("EXCHANGE COMPLETE?!?",receipt)
                        //window.location = "/"+receipt.contractAddress
                      }
                    })
                  }

                }}>
                  <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                    <i className="fas fa-arrow-down" /> Send
                  </Scaler>
                </button>

              </div>
            </div>
          )
        }
      }else{
        xdaiToDendaiDisplay = (
           <div className="content ops row">

             <div className="col-6 p-1">
               <button className="btn btn-large w-100"  style={{backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled}  onClick={()=>{
                 this.setState({xdaiToDendaiMode:"deposit"})
               }}>
                 <i className="fas fa-arrow-up"  />
               </button>
             </div>

             <div className="col-6 p-1">
               <button className="btn btn-large w-100"  style={{backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled}  onClick={()=>{
                 this.setState({xdaiToDendaiMode:"withdraw"})
               }}>
                 <i className="fas fa-arrow-down" />
               </button>
             </div>
           </div>
        )
      }

      tokenDisplay = (
        <div>
          <div className="main-card card w-100">
            <div className="content ops row">
              <div className="col-2 p-1">
                <img style={logoStyle} src={dendai} />
              </div>
              <div className="col-3 p-1" style={{marginTop:8}}>
                DenDai
              </div>
              <div className="col-5 p-1" style={{marginTop:8,whiteSpace:"nowrap"}}>
                  <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                    ${this.props.dollarDisplay(this.state.denDaiBalance)}
                  </Scaler>
              </div>
              <div className="col-2 p-1" style={{marginTop:8}}>
                <button className="btn btn-large w-100" disabled={buttonsDisabled} style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} onClick={this.props.goBack}>
                  <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                    <i className="fas fa-arrow-right"></i>
                  </Scaler>
                </button>
              </div>

            </div>
          </div>
          <div className="main-card card w-100">
            {xdaiToDendaiDisplay}
          </div>
        </div>
      )
    }

    let daiToXdaiDisplay = "loading..."
    //console.log("daiToXdaiMode",daiToXdaiMode)
    if(daiToXdaiMode=="sending" || daiToXdaiMode=="withdrawing" || daiToXdaiMode=="depositing"){
      daiToXdaiDisplay = (
        <div className="content ops row" style={{position:"relative"}}>
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
          >
          </button>
          <div style={{position:'absolute',left:"50%",width:"100%",marginLeft:"-50%",fontSize:adjustedFontSize,top:adjustedTop,opacity:0.95,textAlign:"center"}}>
            {this.state.loaderBarStatusText}
          </div>
        </div>
      )

    }else if(daiToXdaiMode=="deposit"){
      if(!this.state.mainnetMetaAccount && this.props.network!="Mainnet"){
        daiToXdaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>Mainnet</span>
              <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        daiToXdaiDisplay = (
          <div className="content ops row">
            <div className="col-1 p-1"  style={colStyle}>
              <i className="fas fa-arrow-up"  />
            </div>
            <div className="col-5 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
              </Scaler>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {daiCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">

              <button className="btn btn-large w-100"  disabled={buttonsDisabled}
                style={{whiteSpace:"nowrap",backgroundColor:this.props.mainStyle.mainColor}}
                onClick={()=>{
                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.state.daiBalance)

                this.setState({
                  daiToXdaiMode:"depositing",
                  xdaiBalanceAtStart:this.state.xdaiBalance,
                  xdaiBalanceShouldBe:parseFloat(this.state.xdaiBalance)+parseFloat(this.state.amount),
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText:"Calculating best gas price...",
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert("go to etherscan?")
                  }
                })
                //send ERC20 DAI to 0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016 (toXdaiBridgeAccount)
                this.transferDai(toXdaiBridgeAccount,this.state.amount,"Sending funds to bridge...",()=>{
                  this.setState({
                    amount:"",
                    loaderBarColor:"#4ab3f5",
                    loaderBarStatusText:"Waiting for bridge...",
                    loaderBarClick:()=>{
                      alert("idk where to go from here? something that explains the bridge?")
                    }
                  })
                })
              }}>
                <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                  <i className="fas fa-arrow-up" /> Send
                </Scaler>
              </button>

            </div>
          </div>
        )
      }
    } else if(daiToXdaiMode=="withdraw"){
      console.log("CHECKING META ACCOUNT ",this.state.xdaiMetaAccount,this.props.network)
      if(!this.state.xdaiMetaAccount && this.props.network!="xDai"){
        daiToXdaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>dai.poa.network</span>
              <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        daiToXdaiDisplay = (
          <div className="content ops row">

            <div className="col-1 p-1"  style={colStyle}>
              <i className="fas fa-arrow-down"  />
            </div>
            <div className="col-5 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
              </Scaler>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {daiCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={{whiteSpace:"nowrap",backgroundColor:this.props.mainStyle.mainColor}} onClick={()=>{
                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.state.daiBalance)
                this.setState({
                  daiToXdaiMode:"withdrawing",
                  daiBalanceAtStart:this.state.daiBalance,
                  daiBalanceShouldBe:parseFloat(this.state.daiBalance)+parseFloat(this.state.amount),
                  loaderBarColor:"#f5eb4a",
                  loaderBarStatusText:"Sending funds to bridge...",
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert("go to etherscan?")
                  }
                })
                console.log("Withdrawing to ",toDaiBridgeAccount)
                this.props.send(toDaiBridgeAccount, this.state.amount, 120000, (result) => {
                  console.log("RESUTL!!!!",result)
                  if(result && result.transactionHash){
                    this.setState({
                      amount:"",
                      loaderBarColor:"#4ab3f5",
                      loaderBarStatusText:"Waiting for bridge...",
                      loaderBarClick:()=>{
                        alert("idk where to go from here? something that explains the bridge?")
                      }
                    })
                  }
                })
              }}>
                <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                  <i className="fas fa-arrow-down" /> Send
                </Scaler>
              </button>

            </div>
          </div>
        )
      }
    } else {
      daiToXdaiDisplay = (
        <div className="content ops row">

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={{backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled} onClick={()=>{
              this.setState({daiToXdaiMode:"deposit"})
            }} >
              <i className="fas fa-arrow-up"  />
            </button>
          </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={{backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled}  onClick={()=>{
              this.setState({daiToXdaiMode:"withdraw"})
            }} >
              <i className="fas fa-arrow-down"  />
            </button>
          </div>
        </div>
      )
    }

    let ethToDaiDisplay = "loading..."

    if(ethToDaiMode=="sending" || ethToDaiMode=="depositing" || ethToDaiMode=="withdrawing"){
      ethToDaiDisplay = (
        <div className="content ops row" style={{position:"relative"}}>
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
          >
          </button>
          <div style={{position:'absolute',left:"50%",width:"100%",marginLeft:"-50%",fontSize:adjustedFontSize,top:adjustedTop,opacity:0.95,textAlign:"center"}}>
            {this.state.loaderBarStatusText}
          </div>
        </div>
      )

    }else if(ethToDaiMode=="deposit"){
      if(!this.state.mainnetMetaAccount && this.props.network!="Mainnet"){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>Mainnet</span>
              <a href="#" onClick={()=>{this.setState({ethToDaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        ethToDaiDisplay = (
          <div className="content ops row">

            <div className="col-1 p-1"  style={colStyle}>
              <i className="fas fa-arrow-up"  />
            </div>
            <div className="col-5 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
              </Scaler>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {ethCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={{whiteSpace:"nowrap",backgroundColor:this.props.mainStyle.mainColor}} onClick={async ()=>{

                console.log("Using uniswap exchange to move ETH to DAI")

                let webToUse = this.props.web3
                if(this.state.mainnetMetaAccount){
                  webToUse = this.state.mainnetweb3
                }

                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.state.daiBalance)

                let uniswapContract = new webToUse.eth.Contract(uniswapContractObject.abi,uniswapContractObject.address)
                console.log(uniswapContract)

                let amountOfEth = this.state.amount / this.state.ethprice
                amountOfEth = webToUse.utils.toWei(""+Math.round(amountOfEth*10000)/10000,'ether')
                console.log("amountOfEth",amountOfEth)

                let output = await uniswapContract.methods.getTokenToEthOutputPrice(amountOfEth).call()
                output = parseFloat(output)
                output = output - (output*0.0333)
                console.log("Expected amount of DAI: ",webToUse.utils.fromWei(""+Math.round(output),'ether'))

                let currentBlockNumber = await webToUse.eth.getBlockNumber()
                let currentBlock = await webToUse.eth.getBlock(currentBlockNumber)
                let timestamp = currentBlock.timestamp
                console.log("timestamp",timestamp)

                let deadline = timestamp+300
                let mintokens = output
                console.log("ethToTokenSwapInput",mintokens,deadline)


                let amountOfChange = parseFloat(webToUse.utils.fromWei(""+mintokens,'ether'))



                this.setState({
                  ethToDaiMode:"depositing",
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText:"Calculating best gas price...",
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert("go to etherscan?")
                  }
                })

                this.setState({
                  daiBalanceAtStart:this.state.daiBalance,
                  daiBalanceShouldBe:parseFloat(this.state.daiBalance)+amountOfChange,
                })

                ///TRANSFER ETH
                this.transferEth(
                  uniswapContract._address,
                  uniswapContract.methods.ethToTokenSwapInput(""+mintokens,""+deadline),
                  amountOfEth,
                  "Sending funds to 🦄 exchange...",
                  (receipt)=>{
                    this.setState({
                      amount:"",
                      loaderBarColor:"#4ab3f5",
                      loaderBarStatusText:"Waiting for 🦄 exchange...",
                      loaderBarClick:()=>{
                        alert("idk where to go from here? something that explains the bridge?")
                      }
                    })
                  }
                )


              }}>
                <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                  <i className="fas fa-arrow-up" /> Send
                </Scaler>
              </button>

            </div>
          </div>
        )
      }

    }else if(ethToDaiMode=="withdraw"){
      if(!this.state.mainnetMetaAccount && this.props.network!="Mainnet"){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>Mainnet</span>
              <a href="#" onClick={()=>{this.setState({ethToDaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        )
      }else{
        ethToDaiDisplay = (
          <div className="content ops row">

            <div className="col-1 p-1"  style={colStyle}>
              <i className="fas fa-arrow-down"  />
            </div>
            <div className="col-5 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
              </Scaler>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {ethCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={{whiteSpace:"nowrap",backgroundColor:this.props.mainStyle.mainColor}} onClick={async ()=>{

                console.log("Using uniswap exchange to move DAI to ETH")



                let webToUse = this.props.web3
                if(this.state.mainnetMetaAccount){
                  webToUse = this.state.mainnetweb3
                }

                console.log("AMOUNT:",this.state.amount,"ETH BALANCE:",this.state.ethBalance)

                let uniswapContract = new webToUse.eth.Contract(uniswapContractObject.abi,uniswapContractObject.address)
                console.log(uniswapContract)

                let amountOfDai = webToUse.utils.toWei(""+this.state.amount,'ether')
                console.log("amountOfDai",amountOfDai)

                let output = await uniswapContract.methods.getEthToTokenOutputPrice(amountOfDai).call()
                output = parseFloat(output)
                output = output - (output*0.0333)
                console.log("Expected amount of ETH: ",output,webToUse.utils.fromWei(""+Math.round(output),'ether'))

                let currentBlockNumber = await webToUse.eth.getBlockNumber()
                let currentBlock = await webToUse.eth.getBlock(currentBlockNumber)
                let timestamp = currentBlock.timestamp
                console.log("timestamp",timestamp)

                let deadline = timestamp+300
                let mineth = output
                console.log("tokenToEthSwapInput",amountOfDai,mineth,deadline)


                let amountOfChange = parseFloat(webToUse.utils.fromWei(""+mineth,'ether'))
                console.log("ETH should change by ",amountOfChange)

                let eventualEthBalance = parseFloat(this.state.ethBalance)+parseFloat(amountOfChange)
                console.log("----- WATCH FOR ETH BALANCE TO BE ",eventualEthBalance)



                this.setState({
                  ethToDaiMode:"withdrawing",
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText:"Calculating best gas price...",
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert("go to etherscan?")
                  }
                })


                //let's check the approval on the DAI contract
                let daiContract = new webToUse.eth.Contract(daiContractObject.abi,daiContractObject.address)

                let approval = await daiContract.methods.allowance(this.state.daiAddress,uniswapExchangeAccount).call()


                if(this.state.mainnetMetaAccount){
                  //send funds using metaaccount on mainnet

                  axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
                  .catch((err)=>{
                    console.log("Error getting gas price",err)
                  })
                  .then((response)=>{
                    if(response && response.data.average>0&&response.data.average<200){
                      response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
                      let gwei = Math.round(response.data.average*100)/1000

                      if(approval<amountOfDai){
                        console.log("approval",approval)
                        this.setState({
                          loaderBarColor:"#f5eb4a",
                          loaderBarStatusText:"Approving 🦄 exchange...",
                        })

                        let paramsObject = {
                          from: this.state.daiAddress,
                          value: 0,
                          gas: 100000,
                          gasPrice: Math.round(gwei * 1000000000)
                        }
                        console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                        paramsObject.to = daiContract._address
                        paramsObject.data = daiContract.methods.approve(uniswapExchangeAccount,""+(amountOfDai)).encodeABI()

                        console.log("APPROVE TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                        this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                          console.log("========= >>> SIGNED",signed)
                            this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', async (receipt)=>{
                              console.log("META RECEIPT",receipt)
                              this.setState({
                                loaderBarColor:"#4ab3f5",
                                loaderBarStatusText:"Waiting for 🦄 exchange...",
                                ethBalanceAtStart:this.state.ethBalance,
                                ethBalanceShouldBe:eventualEthBalance,
                              })



                              let manualNonce = await this.state.mainnetweb3.eth.getTransactionCount(this.state.daiAddress)
                              console.log("manually grabbed nonce as ",manualNonce)
                              paramsObject = {
                                nonce: manualNonce,
                                from: this.state.daiAddress,
                                value: 0,
                                gas: 240000,
                                gasPrice: Math.round(gwei * 1000000000)
                              }
                              console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                              paramsObject.to = uniswapContract._address
                              paramsObject.data = uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline).encodeABI()

                              console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                              this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                                console.log("========= >>> SIGNED",signed)
                                  this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                                    console.log("META RECEIPT",receipt)
                                    this.setState({
                                      amount:"",

                                    })
                                  }).on('error', (err)=>{
                                    console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                                  }).then(console.log)
                              });



                            }).on('error', (err)=>{
                              console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                            }).then(console.log)
                        });

                      }else{
                        this.setState({
                          loaderBarColor:"#f5eb4a",
                          loaderBarStatusText:"Waiting for 🦄 exchange...",
                          ethBalanceAtStart:this.state.ethBalance,
                          ethBalanceShouldBe:eventualEthBalance,
                        })

                        let paramsObject = {
                          from: this.state.daiAddress,
                          value: 0,
                          gas: 240000,
                          gasPrice: Math.round(gwei * 1000000000)
                        }
                        console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                        paramsObject.to = uniswapContract._address
                        paramsObject.data = uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline).encodeABI()

                        console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                        this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                          console.log("========= >>> SIGNED",signed)
                            this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                              console.log("META RECEIPT",receipt)
                              this.setState({
                                amount:"",
                                loaderBarColor:"#4ab3f5",

                              })
                            }).on('error', (err)=>{
                              console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                            }).then(console.log)
                        });

                      }




                    }else{
                      console.log("ERRORed RESPONSE FROM ethgasstation",response)
                    }
                  })

                }else{
                  console.log("Using uniswap exchange to move ETH to DAI")



                  if(approval<amountOfDai){
                    console.log("approval",approval)

                    //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
                    this.setState({
                      amount:"",
                      loaderBarColor:"#42ceb2",
                      loaderBarStatusText:"Approving 🦄 exchange...",
                      loaderBarClick:()=>{
                        alert("idk where to go from here? something that explains the bridge?")
                      }
                    })


                    this.props.tx(
                      daiContract.methods.approve(uniswapExchangeAccount,""+(amountOfDai))//do 1000x so we don't have to waste gas doing it again
                    ,100000,0,0,(receipt)=>{
                      if(receipt){
                        console.log("APPROVE COMPLETE?!?",receipt)
                        this.setState({
                          amount:"",
                          ethBalanceAtStart:this.state.ethBalance,
                          ethBalanceShouldBe:eventualEthBalance,
                          loaderBarColor:"#4ab3f5",
                          loaderBarStatusText:"Sending funds to 🦄 Exchange...",
                          loaderBarClick:()=>{
                            alert("idk where to go from here? something that explains the bridge?")
                          }
                        })

                        this.props.tx(
                          uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline)
                        ,240000,0,0,(receipt)=>{
                          if(receipt){
                            console.log("EXCHANGE COMPLETE?!?",receipt)
                            //window.location = "/"+receipt.contractAddress
                          }
                        })
                        //window.location = "/"+receipt.contractAddress
                      }
                    })
                  }else{
                    this.setState({
                      amount:"",
                      ethBalanceAtStart:this.state.ethBalance,
                      ethBalanceShouldBe:eventualEthBalance,
                      loaderBarColor:"#4ab3f5",
                      loaderBarStatusText:"Sending funds to 🦄 Exchange...",
                      loaderBarClick:()=>{
                        alert("idk where to go from here? something that explains the bridge?")
                      }
                    })

                    this.props.tx(
                      uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline)
                    ,240000,0,0,(receipt)=>{
                      if(receipt){
                        console.log("EXCHANGE COMPLETE?!?",receipt)
                        //window.location = "/"+receipt.contractAddress
                      }
                    })
                  }



                  //(0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359).approve(address guy, uint256 wad)
                  //tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline)
                  /*this.props.tx(
                    uniswapContract.methods.tokenToEthSwapInput(""+amountOfDai,""+mineth,""+deadline)
                  ,240000,0,0,(receipt)=>{
                    if(receipt){
                      console.log("EXCHANGE COMPLETE?!?",receipt)
                      //window.location = "/"+receipt.contractAddress
                    }
                  })*/
                }


              }}>
                <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                  <i className="fas fa-arrow-down" /> Send
                </Scaler>
              </button>
            </div>
          </div>
        )
      }

    }else{
      ethToDaiDisplay = (
         <div className="content ops row">

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  style={{backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"deposit"})
             }}>
               <i className="fas fa-arrow-up"  />
             </button>
           </div>

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  style={{backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"withdraw"})
             }}>
               <i className="fas fa-arrow-down" />
             </button>
           </div>
         </div>
       )

    }


    let sendDaiButton = (
      <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} disabled={buttonsDisabled} onClick={()=>{
        this.setState({sendDai:true})
      }}>
        <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
          <i className="fas fa-arrow-right"></i>
        </Scaler>
      </button>
    )


    let sendDaiRow = ""
    if(this.state.sendDai){
      sendDaiRow = (
        <div className="send-to-address card w-100" style={{marginTop:20}}>
        <div className="content ops row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">To Address</label>
              <input type="text" className="form-control" placeholder="0x..." value={this.state.daiSendToAddress}
                     onChange={event => this.updateState('daiSendToAddress', event.target.value)} />
            </div>
            <div>  { this.state.daiSendToAddress && this.state.daiSendToAddress.length==42 && <Blockies seed={this.state.daiSendToAddress.toLowerCase()} scale={10} /> }</div>
            <label htmlFor="amount_input">Send Amount</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              <input type="text" className="form-control" placeholder="0.00" value={this.state.daiSendAmount}
                     onChange={event => this.updateState('daiSendAmount', event.target.value)} />
            </div>
            <button style={{marginTop:40,backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled} className={`btn btn-success btn-lg w-100 ${this.state.canSendDai ? '' : 'disabled'}`}
                    onClick={this.sendDai.bind(this)}>
              Send
            </button>
          </div>
        </div>
        </div>
      )
      sendDaiButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendDai:false})
        }}>
          <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }





    let sendEthButton = (
      <button className="btn btn-large w-100" disabled={buttonsDisabled} style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} onClick={()=>{
        this.setState({sendEth:true})
      }}>
        <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
          <i className="fas fa-arrow-right"></i>
        </Scaler>
      </button>
    )


    let sendEthRow = ""
    if(this.state.sendEth){
      sendEthRow = (
        <div className="send-to-address card w-100" style={{marginTop:20}}>
        <div className="content ops row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">To Address</label>
              <input type="text" className="form-control" placeholder="0x..." value={this.state.ethSendToAddress}
                     onChange={event => this.updateState('ethSendToAddress', event.target.value)} />
            </div>
            <div>  { this.state.ethSendToAddress && this.state.ethSendToAddress.length==42 && <Blockies seed={this.state.ethSendToAddress.toLowerCase()} scale={10} /> }</div>
            <label htmlFor="amount_input">Send Amount</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              <input type="text" className="form-control" placeholder="0.00" value={this.state.ethSendAmount}
                     onChange={event => this.updateState('ethSendAmount', event.target.value)} />
            </div>
            <button style={{marginTop:40,backgroundColor:this.props.mainStyle.mainColor}} disabled={buttonsDisabled} className={`btn btn-success btn-lg w-100 ${this.state.canSendEth ? '' : 'disabled'}`}
                    onClick={this.sendEth.bind(this)}>
              Send
            </button>
          </div>
        </div>
        </div>
      )
      sendEthButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendEth:false})
        }}>
          <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }


    return (
      <div style={{marginTop:30}}>

        {tokenDisplay}

        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={xdai} />
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              xDai
            </div>
            <div className="col-5 p-1" style={{marginTop:8,whiteSpace:"nowrap"}}>
                <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                  ${this.props.dollarDisplay(this.state.xdaiBalance)}
                </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} onClick={this.props.goBack}>
                <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                  <i className="fas fa-arrow-right"></i>
                </Scaler>
              </button>
            </div>

          </div>
        </div>
        <div className="main-card card w-100">
          {daiToXdaiDisplay}
        </div>


        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={dai} />
            </div>
            <div className="col-3 p-1" style={{marginTop:9}}>
              DAI
            </div>
            <div className="col-5 p-1" style={{marginTop:9,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                ${this.props.dollarDisplay(this.state.daiBalance)}
              </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
              {sendDaiButton}
            </div>
          </div>
          {sendDaiRow}
        </div>

        <div className="main-card card w-100">
          {ethToDaiDisplay}
        </div>


        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={eth} />
            </div>
            <div className="col-3 p-1" style={{marginTop:10}}>
              ETH
            </div>
            <div className="col-5 p-1" style={{marginTop:10,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                ${this.props.dollarDisplay(this.state.ethBalance*this.state.ethprice)}
              </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
              {sendEthButton}
            </div>
          </div>
          {sendEthRow}
        </div>


        <div className="main-card card w-100" style={{opacity:0.333,padding:0}}>
          <div className="content ops row">
            <div className="col-12 p-1" style={{textAlign:"center",fontSize:16}}>
              Bank Account or Credit Card:
            </div>
          </div>
        </div>


        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-1 p-1">
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <img style={logoStyle} src={wyre} />
              </Scaler>
            </div>
            <div className="col-5 p-1" style={{marginTop:7,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:700,origin:"50% 50%"}}>
              Wyre
              </Scaler>
            </div>
            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} disabled={true}>
                <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                  <i className="fas fa-plug"></i> Create/Connect
                </Scaler>
              </button>
            </div>
          </div>
        </div>

        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-1 p-1">
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <img style={logoStyle} src={coinbase} />
              </Scaler>
            </div>
            <div className="col-5 p-1" style={{marginTop:7,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:750,origin:"50% 50%"}}>
              Coinbase
              </Scaler>
            </div>
            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} disabled={true}>
                <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                  <i className="fas fa-plug"></i> Create/Connect
                </Scaler>
              </button>
            </div>
          </div>
        </div>

        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-1 p-1">
              <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
              <img style={logoStyle} src={localeth} />
              </Scaler>
            </div>
            <div className="col-5 p-1" style={{marginTop:7,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:650,origin:"50% 50%"}}>
                LocalEth
              </Scaler>
            </div>
            <div className="col-6 p-1">

              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe",whiteSpace:"nowrap"}} disabled={true}>
                <Scaler config={{startZoomAt:500,origin:"10% 50%"}}>
                  <i className="fas fa-plug"></i> Create/Connect
                </Scaler>
              </button>

            </div>
          </div>
        </div>



        <div className="text-center bottom-text" style={{marginBottom:30}}>
          <Scaler config={{startZoomAt:380,origin:"0% 50%"}}>
            <span style={{padding:10,whiteSpace:"nowrap"}}>
              <a href="https://dai-bridge.poa.network" style={{color:"#FFFFFF"}} target="_blank">
                <i className="fas fa-credit-card"/> traditional bridge
              </a>
            </span>
            <span style={{padding:10,whiteSpace:"nowrap"}}>
              <a href="#" onClick={this.props.goBack} style={{color:"#FFFFFF"}}>
                <i className="fas fa-times"/> done
              </a>
            </span>
          </Scaler>
        </div>
      </div>
    )
  }
}
