import React from "react";
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from "web3";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import axios from "axios";
import { getConnextClient } from "connext/dist/Connext.js";
import connextLogo from '../connext.jpg';

const QRCode = require('qrcode.react');

let interval

export default class YourModule extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      yourVar: "",
      connext: false,
      YourContract: false,
      yourContractBalance: 0,
      toAddress: props.scannerState ? props.scannerState.toAddress : "",
      payAmount: "",
      depositAmountETH: "",
      depositAmountDAI: "",
      withdrawAmountDollars: "",
      percent:1,
    };
  }

  async initConnext() {
    // set the client options

    let hubUrl="https://hub.connext.network/api/hub"
    //let hubUrl = "https://rinkeby.hub.connext.network/api/hub";
    //let ethUrl="https://hub.connext.network/api/eth"

    let connextOptions;
    if (this.props.privateKey) {
      const privateKey = this.props.privateKey;
      connextOptions = {
        hubUrl,
        privateKey
      };

      // instantiate a new instance of the client
      console.log("GET CONNEXT CLIENT: ", connextOptions);
      const connext = await getConnextClient(connextOptions);
      console.log("CONNEXT LOADED:", connext);

      // the connext client is an event emitter
      // start the app, and register a listener
      connext.on("onStateChange", connext => {
        console.log("Connext STATE CHANGE:", connext);
        this.setState({ connextInfo: connext });
      });

      console.log("Starting Connext...");
      // start connext
      await connext.start();
      console.log("STARTED CONNEXT!");
      this.setState({ connext: connext }, () => {
        console.log("connext set:", this.state);
      });
    }

  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  loadMore(){
    let newPercent = this.state.percent+0.6
    if(newPercent>100) newPercent=100
    this.setState({percent:newPercent})
    this.exchangeIfNeeded()
  }
  componentDidMount() {
    console.log("YOUR MODULE MOUNTED, PROPS:", this.props);
    this.initConnext();
    interval = setInterval(this.loadMore.bind(this),1000)
  }

  exchangeIfNeeded() {
    if(this.state && this.state.connextInfo && this.state.connext &&
      typeof this.state.connext.exchange == "function" &&
      this.state.connextInfo.persistent.channel.balanceWeiUser !== "0"){
      console.log(this.state.connextInfo.persistent.channel.balanceWeiUser)
    this.state.connext.exchange(this.state.connextInfo.persistent.channel
      .balanceWeiUser, "wei");
    }
  }

  clicked(name) {
    console.log("secondary button " + name + " was clicked");
  }

  render() {

    if(!this.props.privateKey){
      return (
        <div>
          Sorry, this doesn't work with inject metamask yet. Open in incog with MM or other injected web3.
        </div>
      )
    }

    let connextState = "loading connext...";
    console.log("this.state.connext", this.state.connext);
    if (this.state.connext && this.state.connextInfo.persistent) {
      connextState = (
        <pre>{JSON.stringify(this.state.connextInfo.persistent, null, 2)}</pre>
      );
    }


    //check if pendingDepositWeiUser and show a loading bar
    if(this.state.connextInfo&&this.state.connextInfo.persistent&&(this.state.connextInfo.persistent.channel.pendingDepositWeiUser>0)){
      let shadowAmount = 100
      let shadowColor = "#faa31a"


      let inEthLong = this.props.web3.utils.fromWei(""+this.state.connextInfo.persistent.channel.pendingDepositWeiUser,'ether')
      let balanceInEth = Math.round(inEthLong*10000)/10000

      let depositDisplay =(
        <div>
          Depositing {this.props.dollarDisplay(
            balanceInEth * this.props.ethprice
          )}
          <img
            src={this.props.eth}
            style={{ maxWidth: 22, maxHeight: 22 }}
          />
          ({balanceInEth})
        </div>
      )

      return (
        <div style={{textAlign:'center'}}>
          {depositDisplay}
          <div style={{width:"100%",paddingTop:"5%",paddingBottom:"10%"}}>
            <img src ={this.props.loaderImage} style={{maxWidth:"25%",paddingBottom:"5%"}}/>
          </div>
          <div style={{width:"80%",height:1,backgroundColor:"#444444",marginLeft:"10%"}}>
            <div style={{width:this.state.percent+"%",height:1,backgroundColor:this.props.mainStyle.mainColorAlt,boxShadow:"0 0 "+shadowAmount/40+"px "+shadowColor+", 0 0 "+shadowAmount/30+"px "+shadowColor+", 0 0 "+shadowAmount/20+"px "+shadowColor+", 0 0 "+shadowAmount/10+"px #ffffff, 0 0 "+shadowAmount/5+"px "+shadowColor+", 0 0 "+shadowAmount/3+"px "+shadowColor+", 0 0 "+shadowAmount/1+"px "+shadowColor+""}}>
            </div>
          </div>
        </div>
      )
    }

    if(this.state.connextInfo&&this.state.connextInfo.persistent&&(this.state.connextInfo.persistent.channel.pendingWithdrawalTokenHub>0)){
      let shadowAmount = 100
      let shadowColor = "#faa31a"


      let inEthLong = this.props.web3.utils.fromWei(""+this.state.connextInfo.persistent.channel.pendingWithdrawalTokenHub,'ether')
      let balanceInEth = Math.round(inEthLong*10000)/10000

      let withdrawDisplay =(
        <div>
          Withdrawing {this.props.dollarDisplay(
            balanceInEth
          )}
          {connextLogo}
        </div>
      )

      return (
        <div style={{textAlign:'center'}}>
          {withdrawDisplay}
          <div style={{width:"100%",paddingTop:"5%",paddingBottom:"10%"}}>
            <img src ={this.props.loaderImage} style={{maxWidth:"25%",paddingBottom:"5%"}}/>
          </div>
          <div style={{width:"80%",height:1,backgroundColor:"#444444",marginLeft:"10%"}}>
            <div style={{width:this.state.percent+"%",height:1,backgroundColor:this.props.mainStyle.mainColorAlt,boxShadow:"0 0 "+shadowAmount/40+"px "+shadowColor+", 0 0 "+shadowAmount/30+"px "+shadowColor+", 0 0 "+shadowAmount/20+"px "+shadowColor+", 0 0 "+shadowAmount/10+"px #ffffff, 0 0 "+shadowAmount/5+"px "+shadowColor+", 0 0 "+shadowAmount/3+"px "+shadowColor+", 0 0 "+shadowAmount/1+"px "+shadowColor+""}}>
            </div>
          </div>
        </div>
      )
    }




    let {address,changeAlert,i18n} = this.props
    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = address

    let connextBalance = ""
    if(this.state.connextInfo&&this.state.connextInfo.persistent){
      console.log("balanceTokenUser",this.state.connextInfo.persistent.channel.balanceTokenUser)
      let inEthLong = this.props.web3.utils.fromWei(""+this.state.connextInfo.persistent.channel.balanceTokenUser,'ether')

      connextBalance =(
        <div>
          {this.props.dollarDisplay(
            inEthLong
          )}
          <img
            src={connextLogo}
            style={{ maxWidth: 22, maxHeight: 22 }}
          />
        </div>
      )

    }

    return (
      <div>

        <div className="form-group w-100">
          <div style={{ width: "100%", textAlign: "center" }}>
            <Ruler />
            <div style={{ padding: 20 }}>
              <div>
                {this.props.dollarDisplay(
                  this.props.ethBalance * this.props.ethprice
                )}
                <img
                  src={this.props.eth}
                  style={{ maxWidth: 22, maxHeight: 22 }}
                />
                ({Math.round(this.props.ethBalance*10000)/10000})
              </div>
              {connextBalance}
            </div>
          </div>
          <Ruler />
          <div className="content bridge row">
            <div className="col-4 p-1">
              <button
                className="btn btn-large w-100"
                style={this.props.buttonStyle.secondary}
                onClick={async () => {
                  this.setState({percent:1})
                  await this.state.connext.deposit({
                    amountWei: this.props.web3.utils.toWei(this.state.depositAmountETH, "ether"),
                    amountToken: this.props.web3.utils.toWei("0", "ether") // assumed to be in wei units
                  })
                }}
              >
                <Scaler config={{ startZoomAt: 400, origin: "50% 50%" }}>
                  <i className="fas fa-arrow-circle-down" /> {"deposit"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
              <button
                className="btn btn-large w-100"
                style={this.props.buttonStyle.secondary}
                onClick={async () => {
                    this.setState({percent:1})
                  //let amount = this.props.web3.utils.toWei("0.1",'ether')
                  /*
              this.props.tx(this.state.YourContract.withdraw(amount),40000,0,0,(result)=>{
                console.log("RESULT@@@@@@@@@@@@@@@@@&&&#&#&#&# ",result)
              })*/
//
                  let withdrawObject = {
                    // address to receive withdrawal funds
                    // does not need to have a channel with connext to receive funds
                    recipient: this.props.address,
                    // USD price if using dai
                    exchangeRate: this.state.connextInfo.runtime.exchangeRate
                      .rates.USD,
                    // wei to transfer from the user's balance to 'recipient'
                    withdrawalWeiUser: this.props.web3.utils.toWei("0", "ether"),
                    // tokens from channel balance to sell back to hub
                    tokensToSell: this.props.web3.utils.toWei(this.state.withdrawAmountDollars, "ether")
                  };
                  console.log("WITHDRAWING", withdrawObject);

                  await this.state.connext.withdraw(withdrawObject);
                }}
              >
                <Scaler config={{ startZoomAt: 400, origin: "50% 50%" }}>
                  <i className="fas fa-arrow-circle-up" /> {"withdraw"}
                </Scaler>
              </button>
            </div>
          </div>
          <Ruler />
          <div className="content row">
            <label htmlFor="amount_input">{"DEPOSIT AMOUNTS"}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Amount of ETH"
                value={this.state.depositAmountETH}
                ref={input => {
                  this.depositInput = input;
                }}
                onChange={event =>
                  this.setState({ depositAmountETH: event.target.value })
                }
              />
            </div>

          </div>
          <div className="content row">
            <label htmlFor="amount_input">{"RECIPIENT ADDRESS:"}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="0x..."
                value={this.state.toAddress}
                ref={input => {
                  this.addressInput = input;
                }}
                onChange={event =>
                  this.setState({ toAddress: event.target.value })
                }
              />
              <div
                className="input-group-append"
                onClick={() => {
                  this.props.openScanner({ view: "yourmodule" });
                }}
              >
                <span
                  className="input-group-text"
                  id="basic-addon2"
                  style={this.props.buttonStyle.primary}
                >
                  <i style={{ color: "#FFFFFF" }} className="fas fa-qrcode" />
                </span>
              </div>
            </div>
          </div>
          <div className="content row">
            <label htmlFor="amount_input">{"TOKENS TO SEND"}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="$ amount to send"
                value={this.state.payAmount}
                ref={input => {
                  this.payInput = input;
                }}
                onChange={event =>
                  this.setState({ payAmount: event.target.value })
                }
              />
            </div>
          </div>
          <button
            className={"btn btn-lg w-100"}
            style={this.props.buttonStyle.primary}
            onClick={async () => {

              this.exchangeIfNeeded()

              console.log(`address: ${this.state.toAddress}`)
              const purchaseId = await this.state.connext.buy({
                meta: {},
                payments: [
                  {
                    recipient: this.state.toAddress, // payee  address
                    amount: {
                      amountToken: this.props.web3.utils.toWei(this.state.payAmount,'ether'), //this.props.web3.utils.toWei("1",'ether'),
                      amountWei: "0" // only token payments are facilitated
                    },
                    type: "PT_OPTIMISTIC" // the payment type, see the client docs for more
                  }
                ]
              });
            }}
          >
            Pay
          </button>

          <div className="content row">
            <label htmlFor="amount_input">{"WITHDRAW AMOUNT"}</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Amount of $"
                value={this.state.withdrawAmountDollars}
                ref={input => {
                  this.withdrawInput = input;
                }}
                onChange={event =>
                  this.setState({ withdrawAmountDollars: event.target.value })
                }
              />
            </div>

          </div>
        </div>
        <div className="send-to-address w-100">
        <CopyToClipboard text={address} onCopy={() => {
          changeAlert({type: 'success', message: i18n.t('receive.address_copied')})
        }}>
          <div className="content qr row" style={{cursor:"pointer"}}>
          <QRCode value={qrValue} size={qrSize}/>
          <div className="input-group">
            <input type="text" className="form-control" style={{color:"#999999"}} value={address} disabled/>
            <div className="input-group-append">
              <span className="input-group-text"><i style={{color:"#999999"}}  className="fas fa-copy"/></span>
            </div>
          </div>
          </div>
        </CopyToClipboard>
        </div>
      </div>
    );
  }
}
