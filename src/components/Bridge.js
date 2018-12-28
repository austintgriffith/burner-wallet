import React from 'react';
import Ruler from "./Ruler";
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import eth from '../ethereum.png';
import dai from '../dai.jpg';
import xdai from '../xdai.jpg';
import wyre from '../wyre.jpg';
import coinbase from '../coinbase.jpg';
import localeth from '../localeth.png';

import Web3 from 'web3';
import axios from "axios"

const GASBOOSTPRICE = 0.1

const logoStyle = {
  maxWidth:50
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

const xdaiToDaiEstimatedTime = 160000
const daiToxDaiEstimatedTime = 330000

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

export default class Bridge extends React.Component {

  constructor(props) {
    super(props);
    let xdaiweb3 = new Web3("https://dai.poa.network")
    let mainnetweb3 = new Web3("https://mainnet.infura.io/v3/e0ea6e73570246bbb3d4bd042c4b5dac")
    let pk = localStorage.getItem('metaPrivateKey')
    let mainnetMetaAccount = false
    let xdaiMetaAccount = false
    let daiAddress = false
    let xdaiAddress = false
    if(pk){
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





    this.state = {
      ethBalance: 0,
      daiBalance: 0,
      daiAddress: daiAddress,
      xdaiBalance: 0,
      xdaiAddress: xdaiAddress,
      wyreBalance: 0,
      ethprice: 0,
      mainnetweb3: mainnetweb3,
      mainnetMetaAccount: mainnetMetaAccount,
      xdaiweb3:xdaiweb3,
      xdaiMetaAccount: xdaiMetaAccount,
      daiContract: daiContract,
      daiToXdaiMode: false,
      ethToDaiMode: false,
      loaderBarStatusText:"Loading...",
      loaderBarStartTime:0,
      loaderBarPercent: 1,
      loaderBarColor: "#FFFFFF",
      gwei: 5
    }
  }
  updateState = (key, value) => {
    this.setState({ [key]: value });

  };
  async componentDidMount(){
    interval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
    intervalLong = setInterval(this.longPoll.bind(this),45000)
    setTimeout(this.longPoll.bind(this),150)
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  async poll(){
    let {daiContract, mainnetweb3, xdaiweb3, xdaiAddress} = this.state
    if(daiContract){
      let daiBalance = await daiContract.methods.balanceOf(this.state.daiAddress).call()
      daiBalance = mainnetweb3.utils.fromWei(daiBalance,"ether")
      if(daiBalance!=this.state.daiBalance){
        this.setState({daiBalance})
      }
    }
    this.setState({ethBalance:mainnetweb3.utils.fromWei(await mainnetweb3.eth.getBalance(this.state.daiAddress),'ether') })
    if(xdaiweb3 && xdaiAddress){
      //console.log("xdaiweb3:",xdaiweb3,"xdaiAddress",xdaiAddress)
      let xdaiBalance = await xdaiweb3.eth.getBalance(xdaiAddress)
      //console.log("!! xdaiBalance:",xdaiBalance)
      this.setState({xdaiBalance:xdaiweb3.utils.fromWei(xdaiBalance,'ether')})
    }
    if(this.state.daiToXdaiMode=="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = (txAge * 100) / xdaiToDaiEstimatedTime

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
      let percentDone = (txAge * 100) / daiToxDaiEstimatedTime

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
    }


    if(this.state.ethToDaiMode=="withdrawing"){
      let txAge = Date.now() - this.state.loaderBarStartTime
      let percentDone = (txAge * 100) / exchangeEstimatedTime
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
      let percentDone = (txAge * 100) / exchangeEstimatedTime

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
    }

  }
  longPoll() {
    axios.get("https://api.coinmarketcap.com/v2/ticker/1027/")
     .then((response)=>{
       let ethprice = response.data.data.quotes.USD.price
       this.setState({ethprice})
     })
  }
  render() {
    let {daiToXdaiMode,ethToDaiMode} = this.state

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

    let buttonsDisabled = (daiToXdaiMode=="withdrawing" || daiToXdaiMode=="depositing" || ethToDaiMode=="depositing" || ethToDaiMode=="withdrawing")


    let daiToXdaiDisplay = "loading..."
    //console.log("daiToXdaiMode",daiToXdaiMode)
    if(daiToXdaiMode=="withdrawing" || daiToXdaiMode=="depositing"){
      daiToXdaiDisplay = (
        <div className="content ops row">
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
            onClick={this.state.loaderBarClick
          }>
            {this.state.loaderBarStatusText}
          </button>
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

            <div className="col-3 p-1"  style={colStyle}>
              <i className="fas fa-arrow-up"  />
            </div>
            <div className="col-3 p-1" style={colStyle}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              {daiCancelButton}
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100"  disabled={buttonsDisabled} onClick={()=>{
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

                if(this.state.mainnetMetaAccount){
                  //send funds using metaaccount on mainnet
                  let mainDaiContract = new this.state.mainnetweb3.eth.Contract(daiContractObject.abi,daiContractObject.address)
                  axios.get("https://ethgasstation.info/json/ethgasAPI.json", { crossdomain: true })
                  .catch((err)=>{
                    console.log("Error getting gas price",err)
                  })
                  .then((response)=>{
                    if(response && response.data.average>0&&response.data.average<200){

                      this.setState({
                        loaderBarColor:"#f5eb4a",
                        loaderBarStatusText:"Sending funds to bridge...",
                      })

                      response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
                      let gwei = Math.round(response.data.average*100)/1000
                      let paramsObject = {
                        from: this.state.daiAddress,
                        value: 0,
                        gas: 100000,
                        gasPrice: Math.round(gwei * 1000000000)
                      }
                      console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                      paramsObject.to = mainDaiContract._address
                      paramsObject.data = mainDaiContract.methods.transfer(
                        toXdaiBridgeAccount,
                        this.state.mainnetweb3.utils.toWei(this.state.amount,"ether")
                      ).encodeABI()

                      console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                      this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                          this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                            console.log("META RECEIPT",receipt)
                            this.setState({
                              amount:0,
                              loaderBarColor:"#4ab3f5",
                              loaderBarStatusText:"Waiting for bridge...",
                              loaderBarClick:()=>{
                                alert("idk where to go from here? something that explains the bridge?")
                              }
                            })
                          }).on('error', (err)=>{
                            console.log("EEEERRRRRRRROOOOORRRRR ======== >>>>>",err)
                          }).then(console.log)
                      });

                    }else{
                      console.log("ERRORed RESPONSE FROM ethgasstation",response)
                    }
                  })




                }else{
                  //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
                  console.log("Depositing to ",toDaiBridgeAccount)
                  let mainDaiContract = new this.props.web3.eth.Contract(daiContractObject.abi,daiContractObject.address)


                  this.setState({
                    loaderBarColor:"#f5eb4a",
                    loaderBarStatusText:"Sending funds to bridge...",
                  })

                  this.props.tx(mainDaiContract.methods.transfer(
                    toXdaiBridgeAccount,
                    this.state.mainnetweb3.utils.toWei(this.state.amount,"ether")
                  ),120000,0,0,(receipt)=>{
                    if(receipt){
                      console.log("SESSION WITHDRAWN:",receipt)
                      this.setState({
                        amount:0,
                        loaderBarColor:"#4ab3f5",
                        loaderBarStatusText:"Waiting for bridge...",
                        loaderBarClick:()=>{
                          alert("idk where to go from here? something that explains the bridge?")
                        }
                      })
                      //window.location = "/"+receipt.contractAddress
                    }
                  })
                }


              }}>
                <i className="fas fa-arrow-right" /> Send
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

            <div className="col-3 p-1"  style={colStyle}>
              <i className="fas fa-arrow-down"  />
            </div>
            <div className="col-3 p-1" style={colStyle}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              {daiCancelButton}
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100"  disabled={buttonsDisabled} onClick={()=>{
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
                      amount:0,
                      loaderBarColor:"#4ab3f5",
                      loaderBarStatusText:"Waiting for bridge...",
                      loaderBarClick:()=>{
                        alert("idk where to go from here? something that explains the bridge?")
                      }
                    })
                  }
                })
              }}>
                <i className="fas fa-arrow-right" /> Send
              </button>
            </div>
          </div>
        )
      }
    } else {
      daiToXdaiDisplay = (
        <div className="content ops row">

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" disabled={buttonsDisabled} onClick={()=>{
              this.setState({daiToXdaiMode:"deposit"})
            }} >
              <i className="fas fa-arrow-up"  />
            </button>
          </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" disabled={buttonsDisabled}  onClick={()=>{
              this.setState({daiToXdaiMode:"withdraw"})
            }} >
              <i className="fas fa-arrow-down"  />
            </button>
          </div>
        </div>
      )
    }

    let ethToDaiDisplay = "loading..."

    if(ethToDaiMode=="depositing" || ethToDaiMode=="withdrawing"){
      ethToDaiDisplay = (
        <div className="content ops row">
          <button style={{width:Math.min(100,this.state.loaderBarPercent)+"%",backgroundColor:this.state.loaderBarColor,color:"#000000"}}
            className="btn btn-large"
            onClick={this.state.loaderBarClick
          }>
            {this.state.loaderBarStatusText}
          </button>
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

            <div className="col-3 p-1"  style={colStyle}>
              <i className="fas fa-arrow-up"  />
            </div>
            <div className="col-3 p-1" style={colStyle}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              {ethCancelButton}
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} onClick={async ()=>{

                console.log("Using uniswap exchange to move ETH to DAI")

                let webToUse = this.props.web3
                if(this.state.mainnetMetaAccount){
                  webToUse = this.state.mainnetweb3
                }

                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.state.daiBalance)

                let uniswapContract = new webToUse.eth.Contract(uniswapContractObject.abi,uniswapContractObject.address)
                console.log(uniswapContract)

                let amountOfEth = this.state.amount / this.state.ethprice
                amountOfEth = webToUse.utils.toWei(""+amountOfEth,'ether')
                console.log("amountOfEth",amountOfEth)

                let output = await uniswapContract.methods.getTokenToEthOutputPrice(amountOfEth).call()
                output = parseFloat(output)
                output = output - (output*0.0333)
                console.log("Expected amount of DAI: ",webToUse.utils.fromWei(""+output,'ether'))

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
                        loaderBarStatusText:"Sending funds to 🦄 exchange...",
                        daiBalanceAtStart:this.state.daiBalance,
                        daiBalanceShouldBe:parseFloat(this.state.daiBalance)+amountOfChange,
                      })

                      response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
                      let gwei = Math.round(response.data.average*100)/1000
                      let paramsObject = {
                        from: this.state.daiAddress,
                        value: amountOfEth,
                        gas: 240000,
                        gasPrice: Math.round(gwei * 1000000000)
                      }
                      console.log("====================== >>>>>>>>> paramsObject!!!!!!!",paramsObject)

                      paramsObject.to = uniswapContract._address
                      paramsObject.data = uniswapContract.methods.ethToTokenSwapInput(""+mintokens,""+deadline).encodeABI()

                      console.log("TTTTTTTTTTTTTTTTTTTTTX",paramsObject)

                      this.state.mainnetweb3.eth.accounts.signTransaction(paramsObject, this.state.mainnetMetaAccount.privateKey).then(signed => {
                        console.log("========= >>> SIGNED",signed)
                          this.state.mainnetweb3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                            console.log("META RECEIPT",receipt)
                            this.setState({
                              amount:0,
                              loaderBarColor:"#4ab3f5",
                              loaderBarStatusText:"Waiting for 🦄 exchange...",
                              loaderBarClick:()=>{
                                alert("idk where to go from here? something that explains the bridge?")
                              }
                            })
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
                    amount:0,
                    daiBalanceAtStart:this.state.daiBalance,
                    daiBalanceShouldBe:parseFloat(this.state.daiBalance)+amountOfChange,
                    loaderBarColor:"#4ab3f5",
                    loaderBarStatusText:"Sending funds to 🦄 exchange...",
                    loaderBarClick:()=>{
                      alert("idk where to go from here? something that explains the bridge?")
                    }
                  })
                  this.props.tx(
                    uniswapContract.methods.ethToTokenSwapInput(""+mintokens,""+deadline)
                  ,240000,0,amountOfEth,(receipt)=>{
                    if(receipt){
                      console.log("EXCHANGE COMPLETE?!?",receipt)
                      /*this.setState({
                        amount:0,
                        loaderBarColor:"#4ab3f5",
                        loaderBarStatusText:"🦄  Transaction Complete?",
                        loaderBarClick:()=>{
                          alert("idk where to go from here? something that explains the bridge?")
                        }
                      })*/
                      //window.location = "/"+receipt.contractAddress
                    }
                  })
                }


              }}>
                <i className="fas fa-arrow-right" /> Send
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

            <div className="col-3 p-1"  style={colStyle}>
              <i className="fas fa-arrow-down"  />
            </div>
            <div className="col-3 p-1" style={colStyle}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <div className="col-3 p-1"  style={colStyle}>
              {ethCancelButton}
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" disabled={buttonsDisabled} onClick={async ()=>{

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
                console.log("Expected amount of ETH: ",output,webToUse.utils.fromWei(""+output,'ether'))

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
                        loaderBarStatusText:"Sending funds to 🦄 exchange...",
                        ethBalanceAtStart:this.state.ethBalance,
                        ethBalanceShouldBe:eventualEthBalance,
                      })

                      response.data.average=response.data.average + (response.data.average*GASBOOSTPRICE)
                      let gwei = Math.round(response.data.average*100)/1000
                      let paramsObject = {
                        from: this.state.daiAddress,
                        value: 0,
                        gas: 100000,
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
                              amount:0,
                              loaderBarColor:"#4ab3f5",
                              loaderBarStatusText:"Waiting for 🦄 exchange...",
                              loaderBarClick:()=>{
                                alert("idk where to go from here? something that explains the bridge?")
                              }
                            })
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



                  //let's check the approval on the DAI contract
                  let daiContract = new webToUse.eth.Contract(daiContractObject.abi,daiContractObject.address)

                  let approval = await daiContract.methods.allowance(this.state.daiAddress,uniswapExchangeAccount).call()

                  if(approval<amountOfDai){
                    console.log("approval",approval)

                    //send funds using metamask (or other injected web3 ... should be checked and on mainnet)
                    this.setState({
                      amount:0,
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
                          amount:0,
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
                        ,100000,0,0,(receipt)=>{
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
                      amount:0,
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
                    ,100000,0,0,(receipt)=>{
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
                <i className="fas fa-arrow-right" /> Send
              </button>
            </div>
          </div>
        )
      }

    }else{
      ethToDaiDisplay = (
         <div className="content ops row">

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"deposit"})
             }}>
               <i className="fas fa-arrow-up"  />
             </button>
           </div>

           <div className="col-6 p-1">
             <button className="btn btn-large w-100"  disabled={buttonsDisabled}  onClick={()=>{
               this.setState({ethToDaiMode:"withdraw"})
             }}>
               <i className="fas fa-arrow-down" />
             </button>
           </div>
         </div>
       )

    }



    return (
      <div style={{marginTop:30}}>
        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={xdai} />
            </div>
            <div className="col-3 p-1">
              xDai
            </div>
            <div className="col-7 p-1">
              ${parseFloat(this.state.xdaiBalance).toFixed(2)}
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
            <div className="col-3 p-1">
              DAI
            </div>
            <div className="col-7 p-1">
              ${parseFloat(this.state.daiBalance).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="main-card card w-100">
          {ethToDaiDisplay}
        </div>


        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={eth} />
            </div>
            <div className="col-3 p-1">
              ETH
            </div>
            <div className="col-7 p-1">
              ${parseFloat(this.state.ethBalance*this.state.ethprice).toFixed(2)}
            </div>
          </div>
        </div>


        <div className="main-card card w-100" style={{opacity:0.333,padding:0}}>
          <div className="content ops row">
            <div className="col-12 p-1" style={{textAlign:"center"}}>
              Bank Account or Credit Card:
            </div>
          </div>
        </div>


        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={wyre} />
            </div>
            <div className="col-3 p-1">
              Wyre
            </div>
            <div className="col-7 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe"}} disabled={true}>
                  <i className="fas fa-plug"></i> Create/Connect Account
              </button>
            </div>
          </div>
        </div>

        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={coinbase} />
            </div>
            <div className="col-3 p-1">
              Coinbase
            </div>
            <div className="col-7 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe"}} disabled={true}>
                  <i className="fas fa-plug"></i> Create/Connect Account
              </button>
            </div>
          </div>
        </div>

        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-2 p-1">
              <img style={logoStyle} src={localeth} />
            </div>
            <div className="col-3 p-1">
              LocalEthereum
            </div>
            <div className="col-7 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe"}} disabled={true}>
                  <i className="fas fa-plug"></i> Create/Connect Account
              </button>
            </div>
          </div>
        </div>



        <div className="text-center bottom-text" style={{marginBottom:30}}>
          <Scaler config={{startZoomAt:380,origin:"0% 50%",adjustedZoom:1}}>
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
