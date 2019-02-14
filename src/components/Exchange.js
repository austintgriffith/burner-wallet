import React from 'react';
import Ruler from "./Ruler";
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

//import wyre from '../wyre.jpg';
//import coinbase from '../coinbase.jpg';
//import localeth from '../localeth.png';

import Web3 from 'web3';
import axios from "axios"
import i18n from '../i18n';

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

export default class Exchange extends React.Component {

  constructor(props) {
    super(props);

    let xdaiweb3 = this.props.xdaiweb3
    //make it easier for local debugging...
    if(false && window.location.hostname.indexOf("localhost")>=0){
      console.log("WARNING, USING LOCAL RPC")
      xdaiweb3 = new Web3(new Web3.providers.HttpProvider("http://0.0.0.0:8545"))
    }
    //let mainnetweb3 = new Web3("https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac")
    let mainnetweb3 = props.mainnetweb3
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
      gettingGas:false
    }
  }
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

    //console.log("checking extraGasUpDisplay",parseFloat(this.props.daiBalance),parseFloat(this.props.ethBalance),parseFloat(this.props.xdaiBalance))
    if(false || parseFloat(this.props.daiBalance)>0 && parseFloat(this.props.ethBalance)<=0.001 && parseFloat(this.props.xdaiBalance) > 0 ){
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
                axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
                .catch((err)=>{
                  console.log("Error getting gas price",err)
                })
                .then((response)=>{
                  if(response && response.data.average>0&&response.data.average<200){
                    console.log("gas prices",response.data.average)
                    let gwei = Math.round(response.data.average*100)/1000
                    console.log("gwei:",gwei)
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

          let paramsObject = {
            from: this.state.daiAddress,
            value: 0,
            gas: 100000,
            gasPrice: Math.round(gwei * 1000000000)
          }
          console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

          paramsObject.to = this.props.daiContract._address
          paramsObject.data = this.props.daiContract.methods.transfer(
            destination,
            this.state.mainnetweb3.utils.toWei(""+amount,"ether")
          ).encodeABI()

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

        }else{
          //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
          console.log("Depositing to ",toDaiBridgeAccount)

          this.setState({
            loaderBarColor:"#f5eb4a",
            loaderBarStatusText:message,
          })

          let metaMaskDaiContract = new this.props.web3.eth.Contract(this.props.daiContract._jsonInterface,this.props.daiContract._address)
          console.log("CURRENT DAI CONTRACT YOU NEED TO GET ABI FROM:",this.props.daiContract)
          this.props.tx(metaMaskDaiContract.methods.transfer(
            destination,
            this.state.mainnetweb3.utils.toWei(""+amount,"ether")
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
  sendXdai(){
    if(parseFloat(this.props.xdaiBalance)<parseFloat(this.state.xdaiSendAmount)){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.insufficient_funds')});
    }else if(!this.state.xdaiSendToAddress || !this.state.xdaiSendToAddress.length === 42){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.invalid_to_address')});
    }else if(!(parseFloat(this.state.xdaiSendAmount) > 0)){
      this.props.changeAlert({type: 'warning',message: i18n.t('exchange.invalid_to_amount')});
    }else{
      this.setState({
        xdaiToDendaiMode:"sending",
        xdaiBalanceAtStart:this.props.xdaiBalance,
        xdaiBalanceShouldBe:parseFloat(this.props.xdaiBalance)-parseFloat(this.state.xdaiSendAmount),
        loaderBarColor:"#f5eb4a",
        loaderBarStatusText: "Sending $"+this.state.xdaiSendAmount+" to "+this.state.xdaiSendToAddress,
        loaderBarPercent:0,
        loaderBarStartTime: Date.now(),
        loaderBarClick:()=>{
          alert(i18n.t('exchange.go_to_etherscan'))
        }
      })
      this.setState({sendXdai:false})
      this.props.nativeSend(this.state.xdaiSendToAddress, this.state.xdaiSendAmount, 120000, "", (result) => {
        if(result && result.transactionHash){
          this.setState({loaderBarPercent:100,loaderBarStatusText: i18n.t('exchange.funds_transferred'),loaderBarColor:"#62f54a"})
          setTimeout(()=>{
            this.setState({
              xdaiToDendaiMode:false,
              xdaiSendAmount:"",
              xdaiSendToAddress:"",
              loaderBarColor:"#FFFFFF",
              loaderBarStatusText:"",
            })
          },3500)

        }
      })
      /*
      this.transferDai(this.state.daiSendToAddress,this.state.daiSendAmount,"Sending "+this.state.daiSendAmount+" DAI to "+this.state.daiSendToAddress+"...",()=>{
        this.props.changeAlert({type: 'success',message: "Sent "+this.state.daiSendAmount+" DAI to "+this.state.daiSendToAddress});
        this.setState({
          daiToXdaiMode:false,
          daiSendAmount:"",
          daiSendToAddress:"",
          loaderBarColor:"#FFFFFF",
          loaderBarStatusText:"",
        })
      })*/

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
                  Maximum withdrawal amount: ${this.props.dollarDisplay(this.state.maxWithdrawlAmount)}
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
                    <i className="fas fa-arrow-up"  /> xDai to {this.props.ERC20NAME}
                  </Scaler>
               </button>
             </div>

             <div className="col-6 p-1">
               <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
                 this.setState({xdaiToDendaiMode:"withdraw"})
               }}>
                 <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-arrow-down" /> {this.props.ERC20NAME} to xDai
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
                  ${this.props.dollarDisplay(this.state.denDaiBalance)}
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
      }else if(this.props.ethBalance<=0){
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
                this.transferDai(toXdaiBridgeAccount,this.state.amount,"Sending funds to bridge...",()=>{
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
              <button className="btn btn-large w-100"  disabled={buttonsDisabled} style={this.props.buttonStyle.primary} onClick={()=>{
                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.props.daiBalance)
                this.setState({
                  daiToXdaiMode:"withdrawing",
                  daiBalanceAtStart:this.props.daiBalance,
                  daiBalanceShouldBe:parseFloat(this.props.daiBalance)+parseFloat(this.state.amount),
                  loaderBarColor:"#f5eb4a",
                  loaderBarStatusText:"Sending funds to bridge...",
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert(i18n.t('exchange.go_to_etherscan'))
                  }
                })
                console.log("Withdrawing to ",toDaiBridgeAccount)




                if(this.state.xdaiMetaAccount){
                  //send funds using metaaccount on xdai

                  let paramsObject = {
                    from: this.state.daiAddress,
                    to: toDaiBridgeAccount,
                    value: this.state.xdaiweb3.utils.toWei(""+this.state.amount,'ether'),
                    gas: 120000,
                    gasPrice: Math.round(1.1 * 1000000000)
                  }
                  console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)
                  console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                  this.state.xdaiweb3.eth.accounts.signTransaction(paramsObject, this.state.xdaiMetaAccount.privateKey).then(signed => {
                    console.log("========= >>> SIGNED",signed)
                      this.state.xdaiweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                        console.log("META RECEIPT",receipt)
                        if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                          metaReceiptTracker[receipt.transactionHash] = true
                          this.setState({
                            amount:"",
                            loaderBarColor:"#4ab3f5",
                            loaderBarStatusText:"Waiting for bridge...",
                            loaderBarClick:()=>{
                              alert(i18n.t('exchange.idk'))
                            }
                          })
                        }
                      }).on('error', (err)=>{
                        console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                        this.props.changeAlert({type: 'danger',message: err.toString()});
                      }).then(console.log)
                  });

                }else{

                  //BECAUSE THIS COULD BE ON A TOKEN, THE SEND FUNCTION IS SENDING TOKENS TO THE BRIDGE HAHAHAHA LETs FIX THAT
                  if(this.props.ERC20TOKEN){
                    console.log("native sending ",this.state.amount," to ",toDaiBridgeAccount)
                    this.props.nativeSend(toDaiBridgeAccount, this.state.amount, 120000, (result) => {
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
                    console.log("sending ",this.state.amount," to ",toDaiBridgeAccount)
                    this.props.send(toDaiBridgeAccount, this.state.amount, 120000, (result) => {
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
        <div className="content ops row">

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} disabled={buttonsDisabled} onClick={()=>{
              this.setState({daiToXdaiMode:"deposit"})
            }} >
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-arrow-up"  /> DAI to xDai
              </Scaler>
            </button>
          </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
              this.setState({daiToXdaiMode:"withdraw"})
            }} >
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-arrow-down"  /> xDai to DAI
              </Scaler>
            </button>
          </div>
        </div>
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
                   axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
                   .catch((err)=>{
                     console.log("Error getting gas price",err)
                   })
                   .then((response)=>{
                     if(response && response.data.average>0&&response.data.average<200){
                       response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
                       let gwei = Math.round(response.data.average*100)/1000

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

                     }
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
         <div className="content ops row">

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"deposit"})
             }}>
               <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-arrow-up"  /> ETH to DAI
               </Scaler>
             </button>
           </div>

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  style={this.props.buttonStyle.primary} disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"withdraw"})
             }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
               <i className="fas fa-arrow-down" /> DAI to ETH
              </Scaler>
             </button>
           </div>
         </div>
       )

    }




    let sendDaiButton = (
      <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} disabled={buttonsDisabled} onClick={()=>{
        this.setState({sendDai:true})
      }}>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
          <i className="fas fa-arrow-right"></i>
        </Scaler>
      </button>
    )

    //style={{marginTop:40,backgroundColor:this.props.mainStyle.mainColor}}
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
              <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.daiSendAmount}
                     onChange={event => this.updateState('daiSendAmount', event.target.value)} />
               <div className="input-group-append" onClick={() => {
                  this.setState({daiSendAmount: Math.floor((this.props.daiBalance)*100)/100 },()=>{
                    this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                  })
               }}>
                 <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                   max
                 </span>
               </div>
            </div>
            <button style={this.props.buttonStyle.primary} disabled={buttonsDisabled} className={`btn btn-success btn-lg w-100 ${this.state.canSendDai ? '' : 'disabled'}`}
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
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }





    let sendEthButton = (
      <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.secondary} onClick={()=>{
        this.setState({sendEth:true})
      }}>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
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
              <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.ethSendAmount}
                     onChange={event => this.updateState('ethSendAmount', event.target.value)} />
                     <div className="input-group-append" onClick={() => {

                       console.log("Getting gas price...")
                       axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
                       .catch((err)=>{
                         console.log("Error getting gas price",err)
                       })
                       .then((response)=>{
                         if(response && response.data.average>0&&response.data.average<200){
                           response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
                           let gwei = Math.round(response.data.average*100)/1000

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

                         }
                       })

                     }}>
                       <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                         max
                       </span>
                     </div>
            </div>
            <button style={this.props.buttonStyle.primary} disabled={buttonsDisabled} className={`btn btn-success btn-lg w-100 ${this.state.canSendEth ? '' : 'disabled'}`}
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
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-times"></i>
          </Scaler>
        </button>
      )
    }

    let sendXdaiButton

    if(this.props.ERC20TOKEN){
      sendXdaiButton = (
        <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.secondary} onClick={()=>{this.setState({sendXdai:true})}}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-arrow-right"></i>
          </Scaler>
        </button>
      )
    }else{
      sendXdaiButton = (
        <button className="btn btn-large w-100" disabled={buttonsDisabled} style={this.props.buttonStyle.secondary} onClick={this.props.goBack}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-arrow-right"></i>
          </Scaler>
        </button>
      )
    }

    let sendXdaiRow = ""
    if(this.state.sendXdai){
      sendXdaiRow = (
        <div className="send-to-address card w-100" style={{marginTop:20}}>
        <div className="content ops row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">To Address</label>
              <input type="text" className="form-control" placeholder="0x..." value={this.state.xdaiSendToAddress}
                     onChange={event => this.updateState('xdaiSendToAddress', event.target.value)} />
            </div>
            <div>  { this.state.xdaiSendToAddress && this.state.xdaiSendToAddress.length==42 && <Blockies seed={this.state.xdaiSendToAddress.toLowerCase()} scale={10} /> }</div>
            <label htmlFor="amount_input">Send Amount</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              <input type="number" step="0.1" className="form-control" placeholder="0.00" value={this.state.xdaiSendAmount}
                     onChange={event => this.updateState('xdaiSendAmount', event.target.value)} />
                     <div className="input-group-append" onClick={() => {
                           this.setState({xdaiSendAmount: Math.floor((this.props.xdaiBalance-0.01)*100)/100 },()=>{
                             this.setState({ canSendDai: this.canSendDai(), canSendEth: this.canSendEth(), canSendXdai: this.canSendXdai() })
                           })
                         }
                       }>
                       <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.secondary}>
                         max
                       </span>
                     </div>
            </div>
            <button style={this.props.buttonStyle.primary} disabled={buttonsDisabled} className={`btn btn-success btn-lg w-100 ${this.state.canSendXdai ? '' : 'disabled'}`}
                    onClick={this.sendXdai.bind(this)}>
              Send
            </button>
          </div>
        </div>
        </div>
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
      <div style={{marginTop:30}}>

        {tokenDisplay}


          <div className="content ops row" style={{paddingBottom:20}}>
            <div className="col-2 p-1">
              <img style={logoStyle} src={this.props.xdai} />
            </div>
            <div className="col-3 p-1" style={{marginTop:8}}>
              xDai
            </div>
            <div className="col-5 p-1" style={{marginTop:8,whiteSpace:"nowrap"}}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  ${this.props.dollarDisplay(this.props.xdaiBalance)}
                </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
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
            <div className="col-5 p-1" style={{marginTop:9,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                ${this.props.dollarDisplay(this.props.daiBalance)}
              </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
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
            <div className="col-5 p-1" style={{marginTop:10,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                ${this.props.dollarDisplay(this.props.ethBalance*this.props.ethprice)}
              </Scaler>
            </div>
            <div className="col-2 p-1" style={{marginTop:8}}>
              {sendEthButton}
            </div>
          </div>
          {sendEthRow}
          {this.state.extraGasUpDisplay}

      </div>
    )
  }
}
