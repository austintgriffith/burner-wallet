import React from 'react';
import Ruler from "./Ruler";
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import eth from '../ethereum.png';
import dai from '../dai.jpg';
import xdai from '../xdai.jpg';
import wyre from '../wyre.jpg';
import Web3 from 'web3';

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

const xdaiToDaiEstimatedTime = 110000
const daiToxDaiEstimatedTime = 330000

const toXdaiBridgeAccount = "0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016"
const toDaiBridgeAccount = "0x7301cfa0e1756b71869e93d4e4dca5c7d0eb0aa6"

let interval

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
      daiBalance: 0,
      daiAddress: daiAddress,
      xdaiBalance: 0,
      xdaiAddress: xdaiAddress,
      wyreBalance: 0,
      mainnetweb3: mainnetweb3,
      mainnetMetaAccount: mainnetMetaAccount,
      xdaiweb3:xdaiweb3,
      xdaiMetaAccount: xdaiMetaAccount,
      daiContract: daiContract,
      daiToXdaiMode: false,
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
  componentDidMount(){
    interval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
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
    if(xdaiweb3 && xdaiAddress){
      console.log("xdaiweb3:",xdaiweb3)
      let xdaiBalance = await xdaiweb3.eth.getBalance(xdaiAddress)
      console.log("!! xdaiBalance:",xdaiBalance)
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

      console.log("watching for ",this.state.xdaiBalance,"to be ",this.state.xdaiBalanceShouldBe-0.0005)
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
  }
  render() {
    let {daiToXdaiMode} = this.state

    let cancelButton = (
      <span style={{padding:10,whiteSpace:"nowrap"}}>
        <a href="#" style={{color:"#000000"}} onClick={()=>{
          this.setState({daiToXdaiMode:false})
        }}>
          <i className="fas fa-times"/> cancel
        </a>
      </span>
    )

    let daiToXdaiDisplay = "loading..."
    console.log("daiToXdaiMode",daiToXdaiMode)
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
      if(this.props.network!="Mainnet"){
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
              {cancelButton}
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" onClick={()=>{
                console.log("AMOUNT:",this.state.amount,"DAI BALANCE:",this.state.daiBalance)
                this.setState({
                  daiToXdaiMode:"depositing",
                  xdaiBalanceAtStart:this.state.xdaiBalance,
                  xdaiBalanceShouldBe:parseFloat(this.state.xdaiBalance)+parseFloat(this.state.amount),
                  loaderBarColor:"#f5eb4a",
                  loaderBarStatusText:"Sending funds to bridge...",
                  loaderBarPercent:0,
                  loaderBarStartTime: Date.now(),
                  loaderBarClick:()=>{
                    alert("go to etherscan?")
                  }
                })
                //send ERC20 DAI to 0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016 (toXdaiBridgeAccount)
                console.log("Depositing to ",toDaiBridgeAccount)
                let mainDaiContract = new this.props.web3.eth.Contract(daiContractObject.abi,daiContractObject.address)

                /*let paramsObject = {
                  from: this.state.daiAddress,
                  value: 0,
                  gas: 120000,
                  gasPrice: Math.round(this.state.gwei * 1000000000)
                }

                this.state.daiContract.methods.transfer(
                  toXdaiBridgeAccount,
                  this.state.mainnetweb3.utils.toWei(this.state.amount,"ether")
                ).send(paramsObject,(error, transactionHash)=>{
                  console.log("TX ERROR:",error)
                  console.log("TX HASH:",transactionHash)
                })*/

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

                /*this.props.send(toDaiBridgeAccount, this.state.amount, 60000, (result) => {
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
                })*/
              }}>
                <i className="fas fa-arrow-right" /> Send
              </button>
            </div>
          </div>
        )
      }
    } else if(daiToXdaiMode=="withdraw"){
      if(this.props.network!="xDai"){
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
              {cancelButton}
            </div>
            <div className="col-3 p-1">
              <button className="btn btn-large w-100" onClick={()=>{
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
                this.props.send(toDaiBridgeAccount, this.state.amount, 60000, (result) => {
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
            <button className="btn btn-large w-100" onClick={()=>{
              this.setState({daiToXdaiMode:"deposit"})
            }} >
              <i className="fas fa-arrow-up"  />
            </button>
          </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" onClick={()=>{
              this.setState({daiToXdaiMode:"withdraw"})
            }} >
              <i className="fas fa-arrow-down"  />
            </button>
          </div>
        </div>
      )
    }



    let wyreDisplay = (
      <div className="content ops row">

        <div className="col-6 p-1">
          <button className="btn btn-large w-100" disabled={true} onClick={()=>{
          }}>
            <i className="fas fa-arrow-up"  />
          </button>
        </div>

        <div className="col-6 p-1">
          <button className="btn btn-large w-100" disabled={true} onClick={()=>{
          }}>
            <i className="fas fa-arrow-down" />
          </button>
        </div>
      </div>
    )





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
              ${this.state.xdaiBalance}
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
              ${this.state.daiBalance}
            </div>
          </div>
        </div>
        <div className="main-card card w-100">
          {wyreDisplay}
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
              <button className="btn btn-large w-100" style={{backgroundColor:"#0055fe"}} >
                  <i className="fas fa-plug"></i> Connect Account
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
