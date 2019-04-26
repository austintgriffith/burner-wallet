import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

//import wyre from '../wyre.jpg';
//import coinbase from '../coinbase.jpg';
//import localeth from '../localeth.png';

import Web3 from 'web3';
import i18n from '../i18n';

import Wyre from '../services/wyre';
import wyrelogo from '../wyre.png';

import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';

import {
  Flex,
  Box,
  Button,
  OutlineButton,
  Icon,
  Input as RInput,
  Field
} from 'rimble-ui'

import {
  Unspent,
  Tx,
  Input,
  Output,
  Outpoint,
  OutpointJSON,
  Type,
  LeapTransaction,
  helpers,
  Exit,
} from 'leap-core';

import { fromRpcSig } from 'ethereumjs-util';

import { bi, add, divide } from 'jsbi-utils';

const BN = Web3.utils.BN

const GASBOOSTPRICE = 0.25

const logoStyle = {
  maxWidth:50,
  maxHeight:50,
}

const colStyle = {
  textAlign:"center",
  whiteSpace:"nowrap"
}

const dendaiToxDaiEstimatedTime = 7000
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
let metaReceiptTracker = {}

/**
 * @returns gas price in gwei
 */
function gasPrice() {
  return fetch({
    url: 'https://ethgasstation.info/json/ethgasAPI.json',
    mode: 'cors',
    method: 'get',
  })
    .then(r => r.json())
    .then((response)=>{
      if(response.average > 0 && response.average < 200){
        const avg = response.average + (response.average*GASBOOSTPRICE)
        return Math.round(avg * 100) / 1000;
      }

      return Promise.reject('Average out of range (0–200)');
    });
}

export default class Exchange extends React.Component {

  constructor(props) {
    super(props);

    let xdaiweb3 = this.props.xdaiweb3
    //let mainnetweb3 = new Web3("https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac")
    let mainnetweb3 = props.mainnetweb3
    let pk = localStorage.getItem('metaPrivateKey')
    let mainnetMetaAccount = false
    let xdaiMetaAccount = false
    let daiAddress = false
    let xdaiAddress = false
    if(pk&&pk!="0"){
      mainnetMetaAccount = mainnetweb3.eth.accounts.privateKeyToAccount(pk)
      daiAddress = mainnetMetaAccount.address.toLowerCase();
      xdaiMetaAccount = xdaiweb3.eth.accounts.privateKeyToAccount(pk)
      xdaiAddress = xdaiMetaAccount.address.toLowerCase();
    }else{
      daiAddress = this.props.address
      xdaiAddress = this.props.address
    }

    let dendaiContract
    let vendorContract
    console.log("NETWORK:",this.props.network)
    if(props.ERC20TOKEN&&this.props.network=="xDai"){
      try{
        console.log("Loading "+props.ERC20TOKEN+" Contract...")
        dendaiContract = new this.props.web3.eth.Contract(require("../contracts/"+props.ERC20TOKEN+".abi.js"),require("../contracts/"+props.ERC20TOKEN+".address.js"))
        vendorContract = new this.props.web3.eth.Contract(require("../contracts/"+props.ERC20VENDOR+".abi.js"),require("../contracts/"+props.ERC20VENDOR+".address.js"))
        console.log("SET vendorContract",vendorContract)
      }catch(e){
        console.log("ERROR LOADING dendaiContract Contract",e)
      }
    }

    this.state = {
      extraGasUpDisplay: "",
      daiAddress: daiAddress,
      xdaiAddress: xdaiAddress,
      xdaiSendToAddress: "",
      wyreBalance: 0,
      denDaiBalance:0,
      mainnetweb3: mainnetweb3,
      mainnetMetaAccount: mainnetMetaAccount,
      xdaiweb3:xdaiweb3,
      xdaiMetaAccount: xdaiMetaAccount,
      dendaiContract: dendaiContract,
      vendorContract: vendorContract,
      daiToXdaiMode: false,
      ethToDaiMode: false,
      loaderBarStatusText: i18n.t('loading'),
      loaderBarStartTime:Date.now(),
      loaderBarPercent: 2,
      loaderBarColor: "#aaaaaa",
      gwei: 5,
      maxWithdrawlAmount: 0.00,
      withdrawalExplanation: i18n.t('exchange.withdrawal_explanation'),
      gettingGas:false,
      wyreFundAmount: 5,
      wyreWidgetOpen: false,
    }

    setInterval(() => this.updatePendingExits(daiAddress, xdaiweb3), 5000);
  }

  async maybeApprovePDai(amountWei) {
    
    const pDaiAllowance = await this.props.daiContract.methods.allowance(
      this.state.daiAddress,
      this.props.pdaiContract._address,
    ).call({ from: this.state.daiAddress })

    // Only trigger allowance dialogue when amount is more than allowance
    if (new BN(pDaiAllowance).lt(new BN(amountWei))) {
      this.setState({
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText: "Approving sunDai amount for Plasma bridge"
      })

      const metaMaskDaiContract = new this.props.web3.eth.Contract(this.props.daiContract._jsonInterface,this.props.daiContract._address)

      const receipt = await this.props.pTx(
        metaMaskDaiContract.methods.approve(this.props.pdaiContract._address, amountWei),
        150000, 0, 0,
      );

      console.log(receipt);
      return receipt;
    }
  }

  updatePendingExits(daiAddress, xdaiweb3) {
    const account = daiAddress;
    const tokenAddr = this.props.pdaiContract._address;
                    
    xdaiweb3.getColor(tokenAddr)
    .then(color => {
      return fetch(
      `https://yxygzjw6s4.execute-api.eu-west-1.amazonaws.com/testnet/exits/${account}/${color}`,
      { method: "GET", mode: "cors" }
      );
    })
    .then(response => response.json())
    .then(rsp => {
      console.log(rsp);
      const pendingValue = rsp.reduce((sum, v) => add(sum, bi(v.value)), bi(0));
      const pendingTokens = parseInt(String(divide(pendingValue, bi(10 ** 16)))) / 100;
      const pendingMsg = "Pending exits of " + pendingTokens.toString() + " sunDAI";
      this.setState({
        pendingMsg
      });
    });
  };


  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
    });
  };
  async componentDidMount(){
    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
    interval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
  }
  async getWrappedDaiBalance() {
    // not a sundai, return immediatelly
    if (this.state.notSundai) return true;

    const rootPdai = new this.state.mainnetweb3.eth.Contract(
      require("../contracts/SunDai.abi.js"),
      this.props.pdaiContract._address
    );

    try {
      const daiBalance = await rootPdai.methods.daiBalance(this.state.daiAddress).call();
      return parseInt(daiBalance);
    } catch (e) {
      // no daiBalance function = not a sundai contract, so skipping this check
      if (e.message.indexOf('Returned values aren\'t valid') >= 0) {
        this.setState({ notSundai: true });
        return 0;
      }
      throw e;
    }
  }
  async poll(){
    let { vendorContract, dendaiContract, mainnetweb3, xdaiweb3, xdaiAddress} = this.state
    /*let { daiContract } = this.props
    if(daiContract){
      let daiBalance = await daiContract.methods.balanceOf(this.state.daiAddress).call()
      daiBalance = mainnetweb3.utils.fromWei(daiBalance,"ether")
      if(daiBalance!=this.state.daiBalance){
        this.setState({daiBalance})
      }
    }*/


    if(this.state.gettingGas){
      if(this.state.ethBalanceShouldBe){
        console.log("ethBalanceShouldBe:",parseFloat(this.state.ethBalanceShouldBe)," needs to be less than ",parseFloat(this.props.ethBalance))
        if(parseFloat(this.state.ethBalanceShouldBe)<parseFloat(this.props.ethBalance)){
          this.setState({gettingGas:false,ethBalanceShouldBe:false})
        }
      }
    }
    const xDaiToEthGasStationEnabled = false;

    //console.log("checking extraGasUpDisplay",parseFloat(this.props.daiBalance),parseFloat(this.props.ethBalance),parseFloat(this.props.xdaiBalance))
    if(xDaiToEthGasStationEnabled && parseFloat(this.props.daiBalance)>0 && parseFloat(this.props.ethBalance)<=0.001 && parseFloat(this.props.xdaiBalance) > 0){
      let getGasText = (
        <div>
          ⛽ xDai -> ETH
        </div>
      )
      if(this.state.gettingGas){
        getGasText = (
          <div>
            ⛽ <i className="fas fa-cog fa-spin"></i>
          </div>
        )
      }


      let extraGasUpDisplay = (
        <div style={{padding:10,width:"100%",textAlign:'center',backgroundColor:"#ffdddd"}}>
          <div style={{padding:10}}>You have DAI but no ETH for gas:</div>
          <button style={this.props.buttonStyle.secondary}
            className="btn btn-large"
            onClick={()=>{
              if(this.state.gettingGas){
                this.props.changeAlert({type: 'warning',message: "Already trying to fuel up via xDai->ETH"});
              }else if(this.props.network!="xDai"&&this.props.network!="Unknown"){
                this.props.changeAlert({type: 'warning',message: "You must be on the xDai network to fuel xDai->ETH"});
              }else{
                this.setState({gettingGas:true,ethBalanceShouldBe:parseFloat(this.props.ethBalance)+0.001})
                gasPrice()
                .catch((err)=>{
                  console.log("Error getting gas price",err)
                })
                .then(gwei => {
                  let AMOUNTNEEDEDFORACOUPLETXS = Math.round(gwei*(1111000000*10) * 201000) // idk maybe enough for a couple transactions?

                  console.log("let's move ",AMOUNTNEEDEDFORACOUPLETXS,"from",this.props.xdaiBalance,"to",this.props.ethBalance)

                  let gasInEth = this.props.web3.utils.fromWei(""+AMOUNTNEEDEDFORACOUPLETXS,'ether')
                  console.log("gasInEth",gasInEth)
                  let gasInXDai = Math.floor(this.props.ethprice*gasInEth*100)/100

                  if(gasInXDai>0.5) gasInXDai = 0.5
                  if(this.props.xdaiBalance < gasInXDai) gasInXDai = this.props.xdaiBalance-0.005

                  console.log("gasInXDai",gasInXDai)
                  let gasEmitterContract
                  if(this.props.network=="xDai"){
                    try{
                      gasEmitterContract = new this.props.web3.eth.Contract(require("../contracts/Emitter.abi.js"),require("../contracts/Emitter.address.js"))
                    }catch(e){
                      console.log("ERROR LOADING Emitter Contract",e)
                    }
                  }
                  if(gasEmitterContract){
                    let amountInWei = this.props.web3.utils.toWei(""+gasInXDai,'ether')

                    if(this.state.xdaiMetaAccount){
                      //send funds using metaaccount on mainnet

                      let paramsObject = {
                        from: this.state.daiAddress,
                        value: amountInWei,
                        gas: 120000,
                        gasPrice: Math.round(1.1 * 1000000000)
                      }
                      console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                      paramsObject.to = gasEmitterContract._address
                      paramsObject.data = gasEmitterContract.methods.goToETH().encodeABI()

                      console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)


                      this.state.xdaiweb3.eth.accounts.signTransaction(paramsObject, this.state.xdaiMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                          this.state.xdaiweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                            console.log("META RECEIPT",receipt)
                            if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                              metaReceiptTracker[receipt.transactionHash] = true
                              //actually, let's wait for the eth balance to change
                              //this.setState({gettingGas:false})
                            }
                          }).on('error', (err)=>{
                            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                            this.props.changeAlert({type: 'danger',message: err.toString()});
                            this.setState({gettingGas:false})
                          }).then(console.log)
                      });

                    }else{
                      console.log("Use MetaMask to go xDai to ETH")
                      this.props.tx(
                        gasEmitterContract.methods.goToETH()
                      ,120000,0,amountInWei,(receipt)=>{
                        if(receipt){
                          console.log("GAS UP COMPLETE?!?",receipt)
                          //this.setState({gettingGas:false})
                          //window.location = "/"+receipt.contractAddress
                        }
                      })
                    }
                  }
                })
              }
            }}
          >
           {getGasText}
          </button>
        </div>

      )
      this.setState({extraGasUpDisplay})
    }

    this.updatePendingExits(this.state.daiAddress, xdaiweb3)

    if (!this.state.notSundai) {
      const exitableSunDaiBalance = await this.getWrappedDaiBalance()
        .catch(e => console.error('Failed to read extable daiBalance for sunDai', e));
      this.setState({ exitableSunDaiBalance });
    }

    if(this.props.ERC20TOKEN&&dendaiContract){
      let denDaiBalance = await dendaiContract.methods.balanceOf(this.state.daiAddress).call()
      denDaiBalance = mainnetweb3.utils.fromWei(denDaiBalance,"ether")
      if(denDaiBalance!=this.state.denDaiBalance){
        this.setState({denDaiBalance})
      }

      console.log("vendorContract",vendorContract)
      let maxWithdrawlAmount = await vendorContract.methods.allowance(this.state.daiAddress).call()
      maxWithdrawlAmount = mainnetweb3.utils.fromWei(maxWithdrawlAmount,"ether")
      if(maxWithdrawlAmount!=this.state.maxWithdrawlAmount){
        this.setState({maxWithdrawlAmount})
      }

      //dendaiToxDaiEstimatedTime
      if(this.state.xdaiToDendaiMode=="withdrawing"){
        let txAge = Date.now() - this.state.loaderBarStartTime
        let percentDone = Math.min(100,((txAge * 100) / dendaiToxDaiEstimatedTime)+5)

        let xdaiBalanceShouldBe = parseFloat(this.state.xdaiBalanceShouldBe)-0.0005
        console.log("watching for ",this.props.xdaiBalance,"to be ",xdaiBalanceShouldBe)
        if(this.props.xdaiBalance>=(xdaiBalanceShouldBe)){
          this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_transferred'),loaderBarColor:"#62f54a"})
          setTimeout(()=>{
            this.setState({
              xdaiToDendaiMode: false,
              loaderBarStatusText: i18n.t('loading'),
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

        console.log("watching for ",this.props.xdaiBalance,"to be less than ",this.state.xdaiBalanceShouldBe+0.0005)
        if(this.props.xdaiBalance<=(this.state.xdaiBalanceShouldBe+0.00005)){
          this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
          setTimeout(()=>{
            this.setState({
              xdaiToDendaiMode: false,
              loaderBarStatusText: i18n.t('loading'),
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
    /*
    console.log("SETTING ETH BALANCE OF "+this.state.daiAddress)
    this.setState({ethBalance:mainnetweb3.utils.fromWei(await mainnetweb3.eth.getBalance(this.state.daiAddress),'ether') })
    if(xdaiweb3){
      //console.log("xdaiweb3:",xdaiweb3,"xdaiAddress",xdaiAddress)
      let xdaiBalance = await xdaiweb3.eth.getBalance(this.state.daiAddress)
      //console.log("!! xdaiBalance:",xdaiBalance)
      this.setState({xdaiBalance:xdaiweb3.utils.fromWei(xdaiBalance,'ether')})
    }*/
    if(this.state.daiToXdaiMode=="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = Math.min(100,((txAge * 100) / xdaiToDaiEstimatedTime)+5)

      console.log("watching for ",this.props.daiBalance,"to be ",this.state.daiBalanceShouldBe-0.0005)
      if(this.props.daiBalance>=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText: i18n.t('loading'),
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
      if(this.props.xdaiBalance>=(this.state.xdaiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText: i18n.t('loading'),
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

      console.log("watching for ",this.props.daiBalance,"to be ",this.state.daiBalanceShouldBe-0.0005)
      if(this.props.daiBalance<=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            daiToXdaiMode: false,
            loaderBarStatusText: i18n.t('loading'),
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
      console.log("watching for ",this.props.ethBalance,"to be ",this.state.ethBalanceShouldBe-0.001)
      if(parseFloat(this.props.ethBalance)>=(this.state.ethBalanceShouldBe-0.001)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText: i18n.t('loading'),
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
      if(this.props.daiBalance>=(this.state.daiBalanceShouldBe-0.0005)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText: i18n.t('loading'),
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
      console.log("watching for ",this.props.ethBalance,"to be ",this.state.ethBalanceShouldBe-0.001)
      if(parseFloat(this.props.ethBalance)<=(this.state.ethBalanceShouldBe-0.001)){
        this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_bridged'),loaderBarColor:"#62f54a"})
        setTimeout(()=>{
          this.setState({
            ethToDaiMode: false,
            loaderBarStatusText: i18n.t('loading'),
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
  sendDai(){
    if(parseFloat(this.props.daiBalance)<parseFloat(this.state.daiSendAmount)){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.insufficient_funds')});
    }else if(!this.state.daiSendToAddress || !this.state.daiSendToAddress.length === 42){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.invalid_to_address')});
    }else if(!(parseFloat(this.state.daiSendAmount) > 0)){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.invalid_to_amount')});
    }else{
      this.setState({
        daiToXdaiMode:"sending",
        daiBalanceAtStart:this.props.daiBalance,
        daiBalanceShouldBe:parseFloat(this.props.daiBalance)-parseFloat(this.state.daiSendAmount),
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert(i18n.t('exchange.go_to_etherscan'))
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
    return (this.state.daiSendToAddress && this.state.daiSendToAddress.length === 42 && parseFloat(this.state.daiSendAmount)>0 && parseFloat(this.state.daiSendAmount) <= parseFloat(this.props.daiBalance))
  }

  async transferDai(destination,amount,message,cb) {
    let gwei
    try {
      gwei = await gasPrice();
    } catch(err) {
      console.log("Error getting gas price",err)
    }

    if(gwei !== undefined){
      const color = await this.state.xdaiweb3.getColor(this.props.pdaiContract._address);
      if(this.state.mainnetMetaAccount){
        //send funds using metaaccount on mainnet
        const amountWei = this.state.mainnetweb3.utils.toWei(""+amount,"ether")

        let paramsObject
        if (this.props.network === "LeapTestnet" || this.props.network == "LeapMainnet") {
          await this.maybeApprovePDai(amountWei);

          const allowance = await this.props.daiContract.methods.allowance(
            this.state.daiAddress,
            this.props.bridgeContract._address
          ).call({from: this.state.daiAddress})

          // Only trigger allowance dialogue when amount is more than allowance
          if (new BN(allowance).lt(new BN(amountWei))) {
            this.setState({
              loaderBarColor:"#f5eb4a",
              loaderBarStatusText: "Approving token amount for Plasma bridge"
            })
            paramsObject = {
              from: this.state.daiAddress,
              value: 0,
              // TODO: Calculate gas estimate appropriately
              gas: 100000,
              gasPrice: Math.round(gwei * 1000000000)
            }
            console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

            paramsObject.to = this.props.daiContract._address
            paramsObject.data = this.props.daiContract.methods.approve(
              this.props.bridgeContract._address,
              amountWei
            ).encodeABI()

            const signedApprove = await this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey)
            console.log("========= >>> SIGNED",signedApprove)
            let receiptApprove
            try {
              // Here we send the approve transaction to the network
              receiptApprove = await this.state.mainnetweb3.eth.sendSignedTransaction(signedApprove.rawTransaction)
            } catch(err) {
              console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
              this.props.changeAlert({type: 'danger',message: err.toString()});
            }
            console.log("META RECEIPT Approve",receiptApprove)
            if(receiptApprove&&receiptApprove.transactionHash&&!metaReceiptTracker[receiptApprove.transactionHash]){
              metaReceiptTracker[receiptApprove.transactionHash] = true
            }
          }
        }

        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        })

        paramsObject = {
          from: this.state.daiAddress,
          value: 0,
          // TODO: I guess this should be calculated by web3's gas
          // estimate?
          gas: 200000,
          gasPrice: Math.round(gwei * 1000000000)
        }
        paramsObject.to = this.props.bridgeContract._address
        paramsObject.data = this.props.bridgeContract.methods.deposit(
          this.state.daiAddress,
          amountWei,
          color,
        ).encodeABI()
        console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

        const signedDeposit = await this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey)
        console.log("========= >>> SIGNED",signedDeposit)

        let receiptDeposit
        try {
          receiptDeposit = await this.state.mainnetweb3.eth.sendSignedTransaction(signedDeposit.rawTransaction)
        } catch(err) {
          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
          this.props.changeAlert({type: 'danger',message: err.toString()});
        }
        if(receiptDeposit&&receiptDeposit.transactionHash&&!metaReceiptTracker[receiptDeposit.transactionHash]){
          metaReceiptTracker[receiptDeposit.transactionHash] = true
          console.log("receipt", receiptDeposit)
          cb(receiptDeposit)
        }
      }else{
        //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
        const { pTx, web3 } = this.props
        console.log("Depositing to ",toDaiBridgeAccount)
        let bridgeContract = new web3.eth.Contract(this.props.bridgeContract._jsonInterface,this.props.bridgeContract._address)
        console.log("CURRENT BRIDGE CONTRACT YOU NEED TO GET ABI FROM:",this.props.bridgeContract, this.state.daiAddress)
        let daiContract = new web3.eth.Contract(this.props.daiContract._jsonInterface,this.props.daiContract._address)
        console.log("CURRENT BRIDGE CONTRACT YOU NEED TO GET ABI FROM:",this.props.bridgeContract, this.state.daiAddress)
        const amountWei =  web3.utils.toWei(""+amount,"ether")

        if (this.props.network === "LeapTestnet" || this.props.network === "LeapMainnet") {
          await this.maybeApprovePDai(amountWei);

          const allowance = await daiContract.methods.allowance(
            this.state.daiAddress,
            bridgeContract._address
          ).call({from: this.state.daiAddress})

          if (new BN(allowance).lt(new BN(amountWei))) {
            this.setState({
              loaderBarColor:"#f5eb4a",
              loaderBarStatusText: "Approving token amount for Plasma bridge"
            })
            const approveReceipt = await pTx(
              daiContract.methods.approve(
                bridgeContract._address,
                amountWei
              ),
              ///TODO LET ME PASS IN A CERTAIN AMOUNT OF GAS INSTEAD OF LEANING BACK ON THE <GAS> COMPONENT!!!!!
              150000,
              0,
              0
            )
          }
        }

        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        })

        const depositReceipt = await pTx(
          bridgeContract.methods.deposit(
            this.state.daiAddress,
            amountWei,
            color,
          ),
          ///TODO LET ME PASS IN A CERTAIN AMOUNT OF GAS INSTEAD OF LEANING BACK ON THE <GAS> COMPONENT!!!!!
          200000,
          0,
          0
        )
        if (depositReceipt) {
          console.log("SESSION WITHDRAWN:",depositReceipt)
          cb(depositReceipt)
        }
      }
    }
  }
  canSendXdai() {
    console.log("canSendXdai",this.state.xdaiSendToAddress,this.state.xdaiSendToAddress.length,parseFloat(this.state.xdaiSendAmount),parseFloat(this.props.xdaiBalance))
    return (this.state.xdaiSendToAddress && this.state.xdaiSendToAddress.length === 42 && parseFloat(this.state.xdaiSendAmount)>0 && parseFloat(this.state.xdaiSendAmount) <= parseFloat(this.props.xdaiBalance))
  }

  sendEth(){

    let actualEthSendAmount = parseFloat(this.state.ethSendAmount)/parseFloat(this.props.ethprice)

    if(parseFloat(this.props.ethBalance)<actualEthSendAmount){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.insufficient_funds')});
    }else if(!this.state.ethSendToAddress || !this.state.ethSendToAddress.length === 42){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.invalid_to_address')});
    }else if(!(actualEthSendAmount>0)){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.invalid_to_amount')});
    }else{
      this.setState({
        ethToDaiMode:"sending",
        ethBalanceAtStart:this.props.ethBalance,
        ethBalanceShouldBe:parseFloat(this.props.ethBalance)-actualEthSendAmount,
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert(i18n.t('exchange.go_to_etherscan'))
        }
      })
      this.setState({sendEth:false})
      //i think without inject meta mask this needs to be adjusted?!?!
      if(this.state.mainnetMetaAccount){
        actualEthSendAmount = this.state.mainnetweb3.utils.toWei(""+Math.round(actualEthSendAmount*10000)/10000,'ether')
      }
      ////for some reason I needed this in and now I dont?!?!?
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
    let actualEthSendAmount = parseFloat(this.state.ethSendAmount)/parseFloat(this.props.ethprice)
    return (this.state.ethSendToAddress && this.state.ethSendToAddress.length === 42 && actualEthSendAmount>0 && actualEthSendAmount <= parseFloat(this.props.ethBalance))
  }
  transferEth(destination,call,amount,message,cb){
    if(this.state.mainnetMetaAccount){
      //send funds using metaaccount on mainnet

      gasPrice()
      .catch((err)=>{
        console.log("Error getting gas price",err)
      })
      .then(gwei => {
        this.setState({
          loaderBarColor:"#f5eb4a",
          loaderBarStatusText:message,
        });

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
          paramsObject.data = "0x00"
        }

        console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

        this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
          console.log("========= >>> SIGNED",signed)
            this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
              console.log("META RECEIPT",receipt)
              if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                metaReceiptTracker[receipt.transactionHash] = true
                cb(receipt)
              }
            }).on('error', (err)=>{
              console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
              this.props.changeAlert({type: 'danger',message: err.toString()});
            }).then(console.log)
        });
      });
    }else{
      console.log("Using uniswap exchange to move ETH to DAI")


      //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
      this.setState({
        amount:"",
        loaderBarColor:"#4ab3f5",
        loaderBarStatusText:message,
        loaderBarClick:()=>{
          alert(i18n.t('exchange.idk'));
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
          (err, receipt)=>{
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
          this.setState({amount:"",ethToDaiMode:false})
        }}>
          <i className="fas fa-times"/> {i18n.t('cancel')}
        </a>
      </span>
    )
    let daiCancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({amount:"",daiToXdaiMode:false})
        }}>
          <i className="fas fa-times"/> {i18n.t('cancel')}
        </a>
      </span>
    )
    let xdaiCancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({amount:"",xdaiToDendaiMode:false})
        }}>
          <i className="fas fa-times"/> {i18n.t('cancel')}
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

    let xdaiToDendaiDisplay =  i18n.t('loading')

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

        //console.log("CHECKING META ACCOUNT ",this.state.xdaiMetaAccount,this.props.network)
        if(!this.state.xdaiMetaAccount && (this.props.network!="xDai"&&this.props.network!="Unknown")){
          xdaiToDendaiDisplay = (
            <div className="content ops row" style={{textAlign:'center'}}>
              <div className="col-12 p-1">
                Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>dai.poa.network</span>
                <a href="#" onClick={()=>{this.setState({xdaiToDendaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
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
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">$</div>
                  </div>
                  <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
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
                <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{

                  let amountOfxDaiToDeposit = this.state.xdaiweb3.utils.toWei(""+this.state.amount,'ether')
                  console.log("Using DenDai contract to deposit "+amountOfxDaiToDeposit+" xDai")

                  this.setState({
                    xdaiToDendaiMode:"depositing",
                    xdaiBalanceAtStart:this.props.xdaiBalance,
                    xdaiBalanceShouldBe:parseFloat(this.props.xdaiBalance)-parseFloat(this.state.amount),
                    loaderBarColor:"#3efff8",
                    loaderBarStatusText:"Depositing xDai into "+this.props.ERC20NAME+"...",
                    loaderBarPercent:0,
                    loaderBarStartTime: Date.now(),
                    loaderBarClick:()=>{
                      alert(i18n.t('exchange.go_to_etherscan'))
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

                    paramsObject.to = this.state.vendorContract._address
                    paramsObject.data = this.state.vendorContract.methods.deposit().encodeABI()

                    console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                    this.state.xdaiweb3.eth.accounts.signTransaction(paramsObject, this.state.xdaiMetaAccount.privateKey).then(signed => {
                      console.log("========= >>> SIGNED",signed)
                        this.state.xdaiweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                          console.log("META RECEIPT",receipt)
                          if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                            metaReceiptTracker[receipt.transactionHash] = true
                            this.setState({
                              amount:"",
                            })
                          }
                        }).on('error', (err)=>{
                          console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                          this.props.changeAlert({type: 'danger',message: err.toString()});
                        }).then(console.log)
                    });

                  }else{
                    console.log("Use MetaMask to withdraw "+this.props.ERC20NAME+" to xDai")
                    this.props.tx(
                      this.props.contracts[this.props.ERC20VENDOR].deposit()
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
                <a href="#" onClick={()=>{this.setState({xdaiToDendaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                  <i className="fas fa-times"/> dismiss
                </a>
              </div>
            </div>
          )
        }else{

          let extraWithdrawInfo = ""

          if(!this.props.isAdmin && (!this.props.isVendor || !this.props.isVendor.isAllowed)){
            extraWithdrawInfo = (
              <div className="content ops row" style={{paddingTop:10}}>
                <div style={{width:"100%",textAlign:'center'}}>
                  Maximum withdrawal amount: {this.props.dollarDisplay(this.state.maxWithdrawlAmount)}
                </div>
                <div style={{width:"100%",textAlign:'center',opacity:0.5}}>
                  ({this.state.withdrawalExplanation})
                </div>
              </div>
            )
          }


          xdaiToDendaiDisplay = (
            <div>
              <div className="content ops row">

                <div className="col-1 p-1"  style={colStyle}>
                  <i className="fas fa-arrow-down"  />
                </div>
                <div className="col-5 p-1" style={colStyle}>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <div className="input-group-text">$</div>
                    </div>
                    <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
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
                  <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{

                    let amountOfxDaiToWithdraw = this.state.xdaiweb3.utils.toWei(""+this.state.amount,'ether')
                    console.log("Using "+this.props.ERC20NAME+" contract to withdraw "+amountOfxDaiToWithdraw+" xDai")

                    this.setState({
                      xdaiToDendaiMode:"withdrawing",
                      xdaiBalanceAtStart:this.props.xdaiBalance,
                      xdaiBalanceShouldBe:parseFloat(this.props.xdaiBalance)+parseFloat(this.state.amount),
                      loaderBarColor:"#3efff8",
                      loaderBarStatusText:"Withdrawing "+this.props.ERC20NAME+" to xDai...",
                      loaderBarPercent:0,
                      loaderBarStartTime: Date.now(),
                      loaderBarClick:()=>{
                        alert(i18n.t('exchange.go_to_etherscan'))
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

                      paramsObject.to = this.state.vendorContract._address
                      paramsObject.data = this.state.vendorContract.methods.withdraw(""+amountOfxDaiToWithdraw).encodeABI()

                      console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                      this.state.xdaiweb3.eth.accounts.signTransaction(paramsObject, this.state.xdaiMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                          this.state.xdaiweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                            console.log("META RECEIPT",receipt)
                            if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                              metaReceiptTracker[receipt.transactionHash] = true
                              this.setState({
                                amount:"",
                              })
                            }
                          }).on('error', (err)=>{
                            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                            this.props.changeAlert({type: 'danger',message: err.toString()});
                          }).then(console.log)
                      });

                    }else{
                      console.log("Use MetaMask to withdraw "+this.props.ERC20NAME+" to xDai")
                      this.props.tx(
                        this.props.contracts[this.props.ERC20VENDOR].withdraw(""+amountOfxDaiToWithdraw)
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
              {extraWithdrawInfo}
            </div>
          )
        }
      }else{




        xdaiToDendaiDisplay = (
           <div className="content ops row">

             <div className="col-6 p-1">
               <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
                 this.setState({xdaiToDendaiMode:"deposit"})
               }}>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                    <i className="fas fa-arrow-up"  /> sunDAI to {this.props.ERC20NAME}
                  </Scaler>
               </button>
             </div>

             <div className="col-6 p-1">
               <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
                 this.setState({xdaiToDendaiMode:"withdraw"})
               }}>
                 <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-arrow-down" /> {this.props.ERC20NAME} to sunDAI
                 </Scaler>
               </button>
             </div>
           </div>
        )
      }

      let link = ""
      if(this.props.contracts){
        link = "https://blockscout.com/poa/dai/address/"+this.props.contracts[this.props.ERC20TOKEN]._address+"/contracts"
      }

      tokenDisplay = (
        <div>
          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <a href={link} target="_blank">
                <img style={logoStyle} src={this.props.ERC20IMAGE} />
              </a>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {this.props.ERC20NAME}
            </div>
            <div className="col-5 p-1" style={{marginTop:8,whiteSpace:"nowrap"}}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  {this.props.dollarDisplay(this.state.denDaiBalance)}
                </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.secondary} onClick={this.props.goBack}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-arrow-right"></i>
                </Scaler>
              </button>
            </div>

          </div>

          <div className="main-card card w-100">
            {xdaiToDendaiDisplay}
          </div>
        </div>
      )
    }

    let daiToXdaiDisplay =  i18n.t('loading')

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
      // if(!this.state.mainnetMetaAccount && this.props.network!="Mainnet"){
      //   daiToXdaiDisplay = (
      //     <div className="content ops row" style={{textAlign:'center'}}>
      //       <div className="col-12 p-1">
      //         Error: MetaMask network must be: <span style={{fontWeight:"bold",marginLeft:5}}>Mainnet</span>
      //         <a href="#" onClick={()=>{this.setState({daiToXdaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
      //           <i className="fas fa-times"/> dismiss
      //         </a>
      //       </div>
      //     </div>
      //   )
      //}else
      if(this.props.ethBalance<=0){
        daiToXdaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You must have ETH to send DAI.
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
            <div className="col-6 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
                 <div className="input-group-append" onClick={() => {
                    this.setState({amount: Math.floor(this.props.daiBalance*100)/100 },()=>{
                      this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                    })
                 }}>
                   <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                     max
                   </span>
                 </div>
              </div>
              </Scaler>
            </div>
            <div className="col-2 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {daiCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">

              <button className="btn btn-large w-100"  disabled={buttonsDisabled}
                style={this.props.buttonStyle.primary}
                onClick={()=>{
                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.props.daiBalance)

                this.setState({
                  daiToXdaiMode:"depositing",
                  xdaiBalanceAtStart:this.props.xdaiBalance,
                  xdaiBalanceShouldBe:parseFloat(this.props.xdaiBalance)+parseFloat(this.state.amount),
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert(i18n.t('exchange.go_to_etherscan'))
                  }
                })
                //send ERC20 DAI to 0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016 (toXdaiBridgeAccount)
                this.depositDaiToXdai(toXdaiBridgeAccount,this.state.amount,"Sending funds to bridge...",()=>{
                  this.setState({
                    amount:"",
                    loaderBarColor:"#4ab3f5",
                    loaderBarStatusText:"Waiting for bridge...",
                    loaderBarClick:()=>{
                      alert(i18n.t('exchange.idk'))
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
      if(!this.state.xdaiMetaAccount && this.props.network!="LeapTestnet"){
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
            <div className="col-6 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
                   <div className="input-group-append" onClick={() => {
                      this.setState({amount: Math.floor((this.props.xdaiBalance-0.01)*100)/100 },()=>{
                        this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                      })
                   }}>
                     <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                       max
                     </span>
                   </div>
              </div>
              </Scaler>
            </div>
            <div className="col-2 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {daiCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{
                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.props.daiBalance)
                console.log("Withdrawing to ",toDaiBridgeAccount)

                let exitableAmount = this.state.amount;

                if(this.state.xdaiMetaAccount){
                  //send funds using metaaccount on xdai

                  const signer = {
                    signTx: (tx) => {
                      const privKeys = tx.inputs.map(_ => this.state.xdaiMetaAccount.privateKey);
                      return Promise.resolve(tx.sign(privKeys));
                    },
                    signMessage: (msg) => {
                      const { signature } = this.state.xdaiweb3.eth.accounts.sign(msg, this.state.xdaiMetaAccount.privateKey);
                      const { r, s, v } = fromRpcSig(signature);
                      return Promise.resolve(
                        { r, s, v, signer: this.state.daiAddress }
                      );
                    }
                  };

                  // TODO: get real decimals
                  const amount = bi(exitableAmount * 10 ** 18);
                  const tokenAddr = this.props.pdaiContract._address;
                  const color = await this.state.xdaiweb3.getColor(tokenAddr);

                  // special handler for sunDai
                  if (!this.state.notSundai) {
                    this.directSell(amount, color);
                    return;
                  }

                  Exit.fastSellAmount(
                    this.state.daiAddress, amount, color,
                    this.state.xdaiweb3, this.props.web3,
                    `${this.props.marketMaker}/sellExit`,
                    signer,
                  ).then(rsp => {
                    console.log(rsp);
                    this.updatePendingExits(this.state.daiAddress, this.state.xdaiweb3);
                    this.setState({ amount: "", daiToXdaiMode: false });
                  }).catch(err => {
                    console.log(err);
                    this.props.changeAlert({
                      type: 'warning',
                      message: 'Failed to exit sunDAI'
                    });
                  });

                }else{

                  //BECAUSE THIS COULD BE ON A TOKEN, THE SEND FUNCTION IS SENDING TOKENS TO THE BRIDGE HAHAHAHA LETs FIX THAT
                  if(this.props.ERC20TOKEN){
                    console.log("native sending ",exitableAmount," to ",toDaiBridgeAccount)
                    this.props.nativeSend(toDaiBridgeAccount, exitableAmount, 120000, (err, result) => {
                      console.log("RESUTL!!!!",result)
                      if(result && result.transactionHash){
                        this.setState({
                          amount:"",
                          loaderBarColor:"#4ab3f5",
                          loaderBarStatusText:"Waiting for bridge...",
                          loaderBarClick:()=>{
                            alert(i18n.t('exchange.idk'))
                          }
                        })
                      }
                    })
                  }else{
                    // TODO: get real decimals
                    let amount = bi(exitableAmount * 10 ** 18);
                    const tokenAddr = this.props.pdaiContract._address;

                    const color = await this.state.xdaiweb3.getColor(tokenAddr);

                    // special handler for sunDai
                    if (!this.state.notSundai) {
                      this.directSell(amount, color);
                      return;
                    }
                    
                    Exit.fastSellAmount(
                      this.state.daiAddress, amount, color,
                      this.state.xdaiweb3, this.props.web3,
                      `${this.props.marketMaker}/sellExit`
                    ).then(rsp => {
                      console.log(rsp);
                      this.updatePendingExits(this.state.daiAddress, this.state.xdaiweb3);
                      this.setState({ amount: "", daiToXdaiMode: false });
                    }).catch(err => {
                      console.log(err);
                      this.props.changeAlert({
                        type: 'warning',
                        message: 'Failed to exit sunDAI'
                      });
                    });
                  }
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
    } else {
      daiToXdaiDisplay = (
        <Flex width={1} px={3}>
          <Button width={1} mr={2} icon={'ArrowUpward'} disabled={buttonsDisabled} onClick={()=>{
            this.setState({daiToXdaiMode:"deposit"})
          }} >
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              DAI to xDai
            </Scaler>
          </Button>

          <Button width={1} 
            icon={'ArrowDownward'}
            disabled={
              buttonsDisabled ||
              (!this.state.notSundai && this.state.exitableSunDaiBalance === 0) ||
              parseFloat(this.props.xdaiBalance) === 0
            } 
            onClick={()=>{
            this.setState({daiToXdaiMode:"withdraw"})
          }} >
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              xDai to DAI
            </Scaler>
          </Button>
        </Flex>
      )
    }

    let ethToDaiDisplay =  i18n.t('loading')

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

      if(this.props.ethBalance<=0){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You don't have any ether
              <a href="#" onClick={()=>{this.setState({ethToDaiMode:false})}} style={{marginLeft:40,color:"#666666"}}>
                <i className="fas fa-times"/> dismiss
              </a>
            </div>
          </div>
        );
      }else {
        ethToDaiDisplay = (
          <div className="content ops row">

            <div className="col-1 p-1"  style={colStyle}>
              <i className="fas fa-arrow-up"  />
            </div>
            <div className="col-6 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
                 <div className="input-group-append" onClick={() => {

                   console.log("Getting gas price...")
                   gasPrice()
                   .catch((err)=>{
                     console.log("Error getting gas price",err)
                   })
                   .then(gwei => {
                      console.log(gwei)

                      let IDKAMOUNTTOLEAVE = gwei*(1111000000*2) * 201000 // idk maybe enough for a couple transactions?

                      console.log("let's leave ",IDKAMOUNTTOLEAVE,this.props.ethBalance)

                      let gasInEth = this.props.web3.utils.fromWei(""+IDKAMOUNTTOLEAVE,'ether')
                      console.log("gasInEth",gasInEth)

                      let adjustedEthBalance = (parseFloat(this.props.ethBalance) - parseFloat(gasInEth))
                      console.log(adjustedEthBalance)

                      this.setState({amount: Math.floor(this.props.ethprice*adjustedEthBalance*100)/100 },()=>{
                        this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                      })
                   })
                 }}>
                   <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                     max
                   </span>
                 </div>
              </div>
              </Scaler>
            </div>
            <div className="col-2 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {ethCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{

                console.log("Using uniswap exchange to move ETH to DAI")

                let webToUse = this.props.web3
                if(this.state.mainnetMetaAccount){
                  webToUse = this.state.mainnetweb3
                }

                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.props.daiBalance)

                let uniswapContract = new webToUse.eth.Contract(uniswapContractObject.abi,uniswapContractObject.address)
                console.log(uniswapContract)

                let amountOfEth = this.state.amount / this.props.ethprice
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

                let deadline = timestamp+600
                let mintokens = output
                console.log("ethToTokenSwapInput",mintokens,deadline)


                let amountOfChange = parseFloat(webToUse.utils.fromWei(""+mintokens,'ether'))



                this.setState({
                  ethToDaiMode:"depositing",
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert(i18n.t('exchange.go_to_etherscan'))
                  }
                })

                this.setState({
                  daiBalanceAtStart:this.props.daiBalance,
                  daiBalanceShouldBe:parseFloat(this.props.daiBalance)+amountOfChange,
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
                        alert(i18n.t('exchange.idk'))
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
      }else if(this.props.ethBalance<=0){
        ethToDaiDisplay = (
          <div className="content ops row" style={{textAlign:'center'}}>
            <div className="col-12 p-1">
              Error: You must have ETH to send DAI.
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
            <div className="col-6 p-1" style={colStyle}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
               <div className="input-group-append" onClick={() => {
                  this.setState({amount: Math.floor((this.props.daiBalance)*100)/100 },()=>{
                    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                  })
               }}>
                 <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                   max
                 </span>
               </div>
              </div>
              </Scaler>
            </div>
            <div className="col-2 p-1"  style={colStyle}>
              <Scaler config={{startZoomAt:650,origin:"0% 85%"}}>
              {ethCancelButton}
              </Scaler>
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={async ()=>{

                console.log("Using uniswap exchange to move DAI to ETH")



                let webToUse = this.props.web3
                if(this.state.mainnetMetaAccount){
                  webToUse = this.state.mainnetweb3
                }

                console.log("AMOUNT:",this.state.amount,"ETH BALANCE:",this.props.ethBalance)

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

                let deadline = timestamp+600
                let mineth = output
                console.log("tokenToEthSwapInput",amountOfDai,mineth,deadline)


                let amountOfChange = parseFloat(webToUse.utils.fromWei(""+mineth,'ether'))
                console.log("ETH should change by ",amountOfChange)

                let eventualEthBalance = parseFloat(this.props.ethBalance)+parseFloat(amountOfChange)
                console.log("----- WATCH FOR ETH BALANCE TO BE ",eventualEthBalance)



                this.setState({
                  ethToDaiMode:"withdrawing",
                  loaderBarColor:"#3efff8",
                  loaderBarStatusText: i18n.t('exchange.calculate_gas_price'),
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert(i18n.t('exchange.go_to_etherscan'))
                  }
                })



                let approval = await this.props.daiContract.methods.allowance(this.state.daiAddress,uniswapExchangeAccount).call()


                if(this.state.mainnetMetaAccount){
                  //send funds using metaaccount on mainnet

                  gasPrice()
                  .catch((err)=>{
                    console.log("Error getting gas price",err)
                  })
                  .then(gwei => {
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

                      paramsObject.to = this.props.daiContract._address
                      paramsObject.data = this.props.daiContract.methods.approve(uniswapExchangeAccount,""+(amountOfDai)).encodeABI()

                      console.log("APPROVE TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                      this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                          this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', async (receipt)=>{
                            console.log("META RECEIPT",receipt)
                            if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                              metaReceiptTracker[receipt.transactionHash] = true
                              this.setState({
                                loaderBarColor:"#4ab3f5",
                                loaderBarStatusText:"Waiting for 🦄 exchange...",
                                ethBalanceAtStart:this.props.ethBalance,
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
                                    if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                                      metaReceiptTracker[receipt.transactionHash] = true
                                      this.setState({
                                        amount:"",
                                      })
                                    }
                                  }).on('error', (err)=>{
                                    console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                                    this.props.changeAlert({type: 'danger',message: err.toString()});
                                  }).then(console.log)
                              });
                            }
                          }).on('error', (err)=>{
                            this.props.changeAlert({type: 'danger',message: err.toString()});
                            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                          }).then(console.log)
                      });

                    }else{
                      this.setState({
                        loaderBarColor:"#f5eb4a",
                        loaderBarStatusText:"Waiting for 🦄 exchange...",
                        ethBalanceAtStart:this.props.ethBalance,
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
                            if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                              metaReceiptTracker[receipt.transactionHash] = true
                              this.setState({
                                amount:"",
                                loaderBarColor:"#4ab3f5",
                              })
                            }
                          }).on('error', (err)=>{
                            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                            this.props.changeAlert({type: 'danger',message: err.toString()});
                          }).then(console.log)
                      });

                    }
                  });
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
                        alert(i18n.t('exchange.idk'))
                      }
                    })

                    let metaMaskDaiContract = new this.props.web3.eth.Contract(this.props.daiContract._jsonInterface,this.props.daiContract._address)

                    this.props.tx(
                      metaMaskDaiContract.methods.approve(uniswapExchangeAccount,""+(amountOfDai))//do 1000x so we don't have to waste gas doing it again
                    ,100000,0,0,(receipt)=>{
                      if(receipt){
                        console.log("APPROVE COMPLETE?!?",receipt)
                        this.setState({
                          amount:"",
                          ethBalanceAtStart:this.props.ethBalance,
                          ethBalanceShouldBe:eventualEthBalance,
                          loaderBarColor:"#4ab3f5",
                          loaderBarStatusText:"Sending funds to 🦄 Exchange...",
                          loaderBarClick:()=>{
                            alert(i18n.t('exchange.idk'))
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
                      ethBalanceAtStart:this.props.ethBalance,
                      ethBalanceShouldBe:eventualEthBalance,
                      loaderBarColor:"#4ab3f5",
                      loaderBarStatusText:"Sending funds to 🦄 Exchange...",
                      loaderBarClick:()=>{
                        alert(i18n.t('exchange.idk'))
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
        <Flex width={1} px={3}>
          <Button width={1} mr={2} icon={'ArrowUpward'} disabled={buttonsDisabled} onClick={()=>{
            this.setState({ethToDaiMode:"deposit"})
          }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              ETH to DAI
            </Scaler>
          </Button>
          <Button width={1} icon={'ArrowDownward'} disabled={buttonsDisabled} onClick={()=>{
           this.setState({ethToDaiMode:"withdraw"})
          }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              DAI to ETH
            </Scaler>
        </Button>
        </Flex>
       )

    }




    let sendDaiButton = (
      <OutlineButton
        width={1}
        icon={'ArrowForward'}
        icononly
        disabled={buttonsDisabled}
        onClick={()=>{
        this.setState({sendDai:true})}}
      />
    )

    //style={{marginTop:40,backgroundColor:this.props.mainStyle.mainColor}}
    let sendDaiRow = ""
    if(this.state.sendDai){
      sendDaiRow = (
        <Box
          border={1}
          borderColor={'grey'}
          borderRadius={1}
          my={3}
          p={3}
        >
          <Field label={'To Address'} mb={3}>
            <RInput
              type="text"
              placeholder="0x..."
              value={this.state.daiSendToAddress}
              onChange={event => this.updateState('daiSendToAddress', event.target.value)}
              width={1}
            />
          </Field>
          <div>
            { this.state.daiSendToAddress && this.state.daiSendToAddress.length==42 && <Blockies seed={this.state.daiSendToAddress.toLowerCase()} scale={10} /> }
          </div>
          <Field label={'Send Amount'} mb={3}>
            <Flex>
              <RInput
                type="number"
                step="0.1"
                placeholder="$0.00"
                value={this.state.daiSendAmount}
                onChange={event => this.updateState('daiSendAmount', event.target.value)}
                width={1}
              />
              <OutlineButton
                ml={2}
                onClick={() => {
                  this.setState({
                    daiSendAmount: Math.floor((this.props.daiBalance)*100)/100
                  },
                  () => {
                    this.setState({
                      canSendDai: this.canSendDai(),
                      canSendEth: this.canSendEth(),
                      canSendXdai: this.canSendXdai()
                    })
                  })
                }}
              >
                max
              </OutlineButton>
            </Flex>
          </Field>
          <Button width={1} disabled={buttonsDisabled} onClick={this.sendDai.bind(this)}>
            Send
          </Button>
        </Box>
      )
      sendDaiButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendDai:false})
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }

    let sendEthButton = (
      <OutlineButton
        width={1}
        icon={'ArrowForward'}
        icononly
        disabled={buttonsDisabled}
        onClick={()=>{this.setState({sendEth:true})}}
      />
    )

    let fundByWyreButton = (
      <button
        className="btn btn-large w-100 wyre-button--font-size"
        disabled={buttonsDisabled}
        style={
            Object.assign({}, this.props.buttonStyle.secondary, {
                color: '#fff',
                backgroundColor: '#0055ff',
                border: '2px solid #0055ff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            })
        }
        onClick={()=>{
          this.setState({ wyreWidgetOpen: true });
          Wyre.displayWidget(
              this.props.address,
              this.state.wyreFundAmount,
              () => { this.setState({ wyreWidgetOpen: false }); }
          );
        }}
      ><Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
        <div style={{flex: '0 0 30px', textAlign: 'center'}}>
            {this.state.wyreWidgetOpen ? (
                <>
                    <span style={{paddingRight: '10px'}}>
                        <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>Loading...</span>
                </>) : `Buy $${this.state.wyreFundAmount}`}
        </div>
        </Scaler>
      </button>
    )


    let sendEthRow = ""
    if(this.state.sendEth){
      sendEthRow = (
        <Box
          border={1}
          borderColor={'grey'}
          borderRadius={1}
          my={3}
          p={3}
        >
          <Field label={'To Address'} mb={3}>
            <RInput
              type="text"
              placeholder="0x..."
              value={this.state.ethSendToAddress}
              onChange={event => this.updateState('ethSendToAddress', event.target.value)}
              width={1}
            />
          </Field>
          <div>
            { this.state.ethSendToAddress && this.state.ethSendToAddress.length==42 && <Blockies seed={this.state.ethSendToAddress.toLowerCase()} scale={10} /> }
          </div>
          <Field label={'Send Amount'} mb={3}>
            <Flex>
              <RInput
                type="number"
                step="0.1"
                placeholder="$0.00"
                value={this.state.ethSendAmount}
                onChange={event => this.updateState('ethSendAmount', event.target.value)}
                width={1}
              />
              <OutlineButton
                ml={2}
                onClick={() => {
                  console.log("Getting gas price...")
                  gasPrice()
                  .catch((err)=>{
                    console.log("Error getting gas price",err)
                  })
                  .then(gwei => {
                     console.log(gwei)

                     let IDKAMOUNTTOLEAVE = gwei*(1111000000*2) * 201000 // idk maybe enough for a couple transactions?

                     console.log("let's leave ",IDKAMOUNTTOLEAVE,this.props.ethBalance)

                     let gasInEth = this.props.web3.utils.fromWei(""+IDKAMOUNTTOLEAVE,'ether')
                     console.log("gasInEth",gasInEth)

                     let adjustedEthBalance = (parseFloat(this.props.ethBalance) - parseFloat(gasInEth))
                     console.log(adjustedEthBalance)

                     this.setState({ethSendAmount: Math.floor(this.props.ethprice*adjustedEthBalance*100)/100 },()=>{
                       this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                     })
                  })
              }}
              >
                max
              </OutlineButton>
            </Flex>
          </Field>
          <Button width={1} disabled={buttonsDisabled} onClick={this.sendEth.bind(this)}>
            Send
          </Button>
        </Box>
      )
      sendEthButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendEth:false})
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }

    let sendXdaiButton

    if(this.props.ERC20TOKEN){
      sendXdaiButton = (
        <OutlineButton
          width={1}
          icon={'ArrowForward'}
          icononly
          disabled={buttonsDisabled}
          onClick={()=>{this.setState({sendXdai:true})}}
        />
      )
    }else{
      sendXdaiButton = (
        <OutlineButton
          width={1}
          icon={'ArrowForward'}
          icononly
          disabled={buttonsDisabled}
          onClick={this.props.goBack}
        />
      )
    }

    let sendXdaiRow = ""
    if(this.state.sendXdai){
      sendXdaiRow = (
        <Box
          border={1}
          borderColor={'grey'}
          borderRadius={1}
          my={3}
          p={3}
        >
          <Field label={'To Address'} mb={3}>
            <RInput
              type="text"
              className="form-control"
              placeholder="0x..."
              value={this.state.xdaiSendToAddress}
              onChange={event => this.updateState('xdaiSendToAddress', event.target.value)}
            />
          </Field>
          <div>
            { this.state.xdaiSendToAddress && this.state.xdaiSendToAddress.length==42 && <Blockies seed={this.state.xdaiSendToAddress.toLowerCase()} scale={10} /> }
          </div>
          <Field label={'Send Amount'} mb={3}>
            <Flex>
              <RInput
                type="number"
                step="0.1"
                className="form-control"
                placeholder="$0.00"
                value={this.state.xdaiSendAmount}
                onChange={event => this.updateState('xdaiSendAmount', event.target.value)}
              />
              <OutlineButton
                ml={2}
                onClick={() => {
                  this.setState({xdaiSendAmount: Math.floor((this.props.xdaiBalance-0.01)*100)/100 },()=>{
                    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                  })
                }}
              >
                max
              </OutlineButton>
            </Flex>
          </Field>

          <Button width={1} disabled={buttonsDisabled} onClick={this.sendXdai.bind(this)}>
            Send
          </Button>
        </Box>
      )
      sendXdaiButton = (
        <button className="btn btn-large w-100" style={{backgroundColor:"#888888",whiteSpace:"nowrap"}} onClick={()=>{
          this.setState({sendXdai:false})
        }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }

    //console.log("eth price ",this.props.ethBalance,this.props.ethprice)
    return (
      <Box mt={4}>
        {this.state.pendingMsg && <div style={{
          padding: '10px', backgroundColor: 'orange', textAlign: 'center'
        }}>{this.state.pendingMsg}</div> }

        {tokenDisplay}


          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.xdai} />
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              sunDAI
            </div>
            <div className="col-4 p-1" style={{marginTop:8,whiteSpace:"nowrap"}}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  {this.props.dollarDisplay(this.props.xdaiBalance)}
                </Scaler>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {sendXdaiButton}
            </div>

          </div>
          {sendXdaiRow}

        <div className="main-card card w-100">
          {daiToXdaiDisplay}
        </div>



          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.dai} />
            </div>
            <div className="col-3 p-1" style={{marginTop:9}}>
              DAI
            </div>
            <div className="col-4 p-1" style={{marginTop:9,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                {this.props.dollarDisplay(this.props.daiBalance)}
              </Scaler>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {sendDaiButton}
            </div>
          </div>
          {sendDaiRow}


        <div className="main-card card w-100">
          {ethToDaiDisplay}
        </div>


          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.eth} />
            </div>
            <div className="col-3 p-1" style={{marginTop:10}}>
              ETH
            </div>
            <div className="col-4 p-1" style={{marginTop:10,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                {this.props.dollarDisplay(this.props.ethBalance*this.props.ethprice)}
              </Scaler>
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              {this.state.mainnetMetaAccount ? sendEthButton : null}
            </div>
          </div>


          { (window.location.hostname.indexOf("localhost") >= 0 || window.location.hostname.indexOf("wyre.xdai.io") >= 0 || window.location.hostname.indexOf("s.xdai.io") >= 0) && (
            <div className="send-to-address card w-100" style={{marginTop:20,borderBottom:0,paddingTop:50}}>
              <div className="content ops row">
                <div className="col-2 p-1">
                  <img style={logoStyle} src={wyrelogo} />
                </div>
                <div className="col-2 p-1" style={{marginTop:10}}>
                  Wyre
                </div>
                <div className="col-5 p-1" style={{whiteSpace:"nowrap"}}>
                    {/*<div className="input-group">
                        <div className="input-group-prepend">
                            <div className="input-group-text">$</div>
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            placeholder="0.00"
                            value={this.state.wyreFundAmount}
                            onChange={event =>
                                this.updateState('wyreFundAmount', event.target.value)
                            }
                        />
                    </div>*/}
                    <div className="wyre-slider" style={{padding: '0 20px', display: 'flex', alignItems: 'center', paddingTop: '15px',}}>
                    <InputRange
                        maxValue={25}
                        minValue={5}
                        value={this.state.wyreFundAmount}
                        formatLabel={value => `$${value}`}
                        step={1}
                        onChange={value =>
                            this.updateState('wyreFundAmount', value)
                        }
                    />
                    </div>
                </div>
                <div className="col-3 p-1" style={{marginTop:8}}>
                  {fundByWyreButton}
                </div>
              </div>
            </div>
          )}


          {sendEthRow}
          {this.state.extraGasUpDisplay}

      </Box>
    )
  }
}
