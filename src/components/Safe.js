import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import {CopyToClipboard} from "react-copy-to-clipboard";
import { Scaler, Blockie } from "dapparatus";
import { scroller } from 'react-scroll'
import i18n from '../i18n';
const QRCode = require('qrcode.react');

export default class Receive extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
      addingOwner: false,
      showingQR: false,
      withdrawing: false,
      toAddress: "",
      amount: ""
    }
    console.log("props.scannerState",props.scannerState)
    if(props.scannerState  && props.scannerState.toAddress){
      initialState.addingOwner = true
      initialState.toAddress = props.scannerState.toAddress
    }
    this.state = initialState
  }
  updateState = async (key, value) => {
    this.setState({ [key]: value });
  };
  render() {
    let {safeOwners, setReceipt, account, openScanner, safeContract, safeCall, changeAlert, changeView, buttonStyle, i18next, safe, safeBalance, returnToState} = this.props

    let qrSize = Math.min(document.documentElement.clientWidth,512)-90


    let safeView = ""
    let buttons = (
      <div>
        <div className="content ops row">
          <div className="col-6 p-1" onClick={() => {
            window.location = "/"+safe
          }}>
            <button className="btn btn-large w-100" style={buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                {/* <i className="fas fa-qrcode"  /> Receive */}
                <i className="fas fa-download"/> Deposit
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100" onClick={() => {
              this.setState({withdrawing:true})
            }} style={buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                {/* <i className="fas fa-paper-plane"/> Send */}
                <i className="fas fa-paper-plane"/> Withdraw
              </Scaler>
            </button>
          </div>
        </div>
        <div className="content ops row">
          <div className="col-6 p-1" onClick={() => {
            this.setState({showingQR:!this.state.showingQR})
            //safeCall(safeContract._address,0,safeContract.addOwnerWithThreshold("0x17c7ff1a4bade82d60633677abda7cf8932a3a74",1).encodeABI())
          }}>
            <button className="btn btn-large w-100" style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-qrcode"/> Receive
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1" onClick={() => {
            this.setState({addingOwner:true})
            //safeCall(safeContract._address,0,safeContract.addOwnerWithThreshold("0x17c7ff1a4bade82d60633677abda7cf8932a3a74",1).encodeABI())
          }}>
            <button className="btn btn-large w-100" style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-user-circle"/> Add Owner
              </Scaler>
            </button>
          </div>
        </div>
      </div>
    )

    if(this.state.showingQR){
      safeView = (
        <div>
          <CopyToClipboard text={safe} onCopy={() => {
            changeAlert({type: 'success', message: "Safe address copied."})
          }}>
            <div className="content qr row" style={{cursor:"pointer"}}>
              <QRCode value={safe} size={qrSize}/>
              <div className="input-group">
                <input type="text" className="form-control" style={{color:"#999999"}} value={safe} disabled/>
                <div className="input-group-append">
                  <span className="input-group-text"><i style={{color:"#999999"}}  className="fas fa-copy"/></span>
                </div>
              </div>
            </div>
          </CopyToClipboard>
          <Ruler/>
        </div>
      )
      buttons = (
        <div>
          <div className="content ops row">
            <div className="col-12 p-1" onClick={() => {
              this.setState({showingQR:!this.state.showingQR})
              //safeCall(safeContract._address,0,safeContract.addOwnerWithThreshold("0x17c7ff1a4bade82d60633677abda7cf8932a3a74",1).encodeABI())
            }}>
              <button className="btn btn-large w-100" style={buttonStyle.secondary}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-times"/> Done
                </Scaler>
              </button>
            </div>
          </div>
        </div>
      )
    }

    if(safeView==""){
      let safeOnwersView = []
      for(let o in safeOwners){
        safeOnwersView.push(
          <div key={"safeowner"+o}>
          <Blockie
            address={safeOwners[o]}
            config={{size:2}}
          /> {safeOwners[o]}
          </div>
        )
      }
      safeView = (
        <div style={{marginLeft:"5%",padding:30}}>
          <div style={{padding:10,fontWeight:"bolder"}}>
            Owners:
          </div>
          {safeOnwersView}
        </div>
      )
    }

    if(this.state.addingOwner){
      safeView = (
        <div className="form-group w-100">
          <label htmlFor="amount_input">{"Add Owner:"}</label>
          <div className="input-group">
            <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
              ref={(input) => { this.addressInput = input; }}
                   onChange={event => this.updateState('toAddress', event.target.value)} />
            <div className="input-group-append" onClick={() => {
              this.props.openScanner({view:"safe"})
            }}>
              <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
                <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
              </span>
            </div>
          </div>
        </div>
      )
      buttons = (
        <div>
          <div className="content ops row">
            <div className="col-6 p-1" onClick={() => {
              this.setState({addingOwner:false})
            }}>
              <button className="btn btn-large w-100" style={buttonStyle.secondary}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-times"/> Cancel
                </Scaler>
              </button>
            </div>
            <div className="col-6 p-1" >
              <button className="btn btn-large w-100" style={buttonStyle.primary} disabled={!this.state.toAddress} onClick={() => {
                changeView('loader')
                setTimeout(()=>{window.scrollTo(0,0)},60)
                safeCall(safeContract._address,0,safeContract.addOwnerWithThreshold(this.state.toAddress,1).encodeABI(),()=>{
                  console.log("Sending some dust to ",this.state.toAddress)
                  this.props.send(this.state.toAddress, 0.02, 120000, "0x00", (result) => {
                    if(result && result.transactionHash){
                      console.log("DUST SENT:",result)
                    }
                  })
                  changeView("safe");
                })
              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-user-circle"/> Add Owner
                </Scaler>
              </button>
            </div>
          </div>
        </div>
      )
    }

    if(this.state.withdrawing){
      safeView = (
        <div className="form-group w-100">
          <label htmlFor="amount_input">{"Withdraw:"}</label>
          <div className="input-group">
            <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
                ref={(input) => { this.amountInput = input; }}
                   onChange={event => this.updateState('amount', event.target.value)} />
          </div>
        </div>
      )
      buttons = (
        <div>
          <div className="content ops row">
            <div className="col-6 p-1" onClick={() => {
              this.setState({withdrawing:false})
            }}>
              <button className="btn btn-large w-100" style={buttonStyle.secondary}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-times"/> Cancel
                </Scaler>
              </button>
            </div>
            <div className="col-6 p-1" >
              <button className="btn btn-large w-100" style={buttonStyle.primary} disabled={!this.state.amount} onClick={() => {
                //this.setState({withdrawing:false})
                changeView('loader')
                setTimeout(()=>{window.scrollTo(0,0)},60)
                safeCall(account,this.state.amount*10**18,"0x",(result)=>{
                  console.log("resultresultresultresultresultresult",result)
                  let receiptObj = {to:account,from:safe,amount:parseFloat(this.state.amount),message:"Withdraw from Safe.",result:result}
                  //console.log("SETTING RECEPITE STATE",receiptObj)
                  setReceipt(receiptObj)
                  changeView("receipt");
                })
              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-paper-plane"/> Withdraw
                </Scaler>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="content ops row">
          {safeView}
        </div>
        {buttons}
      </div>
    )
  }
}
