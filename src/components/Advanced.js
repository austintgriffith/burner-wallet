import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
const QRCode = require('qrcode.react');

export default class Bridge extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    }
  }
  render(){
    let {balance, privateKey, changeAlert, changeView, goBack, setPossibleNewPrivateKey} = this.props
    return (
      <div style={{marginTop:20}}>
        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-6 p-1">
            <input type="text" className="form-control" placeholder="private key" value={this.state.newPrivateKey}
                   onChange={event => this.setState({newPrivateKey:event.target.value})} />
            </div>
            <div className="col-6 p-1">
              <button className="btn btn-large w-100"
                      onClick={()=>{
                        //let pkutils = require("ethereum-mnemonic-privatekey-utils")
                        //const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(newPrivateKey)
                        changeView('main')
                        let possibleNewPrivateKey = this.state.newPrivateKey
                        if(possibleNewPrivateKey.indexOf("0x")!=0){
                          possibleNewPrivateKey = "0x"+possibleNewPrivateKey
                        }
                        setPossibleNewPrivateKey(possibleNewPrivateKey)
                      }}>
                <Scaler config={{startZoomAt:500,origin:"25% 50%"}}>
                  <i className="fas fa-plus-square"/> Create Wallet
                </Scaler>
              </button>
            </div>
          </div>
        </div>
        <div className="main-card card w-100">
          <div className="content ops row">
            <div className="col-6 p-1">
            <input type="text" className="form-control" placeholder="seed phrase" value={this.state.newSeedPhrase}
                   onChange={event => this.setState({newSeedPhrase:event.target.value})} />
            </div>
            <div className="col-6 p-1">
              <button className="btn btn-large w-100"
                      onClick={()=>{
                        let pkutils = require("ethereum-mnemonic-privatekey-utils")
                        const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(this.state.newSeedPhrase)
                        changeView('main')
                        setPossibleNewPrivateKey("0x"+newPrivateKey)
                      }}>
                <Scaler config={{startZoomAt:500,origin:"25% 50%"}}>
                  <i className="fas fa-plus-square"/> Create Wallet
                </Scaler>
              </button>
            </div>
          </div>
        </div>
        <div className="main-card card w-100">
          {privateKey &&
          <div>
            <div className="content ops row">
              <CopyToClipboard text={privateKey}>
                <div className="col-6 p-1"
                     onClick={() => changeAlert({type: 'success', message: 'Private Key copied to clipboard'})}>
                  <button className="btn btn-large w-100">
                    <Scaler config={{startZoomAt:500,origin:"25% 50%"}}>
                      <i className="fas fa-save"/> Copy Private Key
                    </Scaler>
                  </button>
                </div>
              </CopyToClipboard>
              <div className="col-6 p-1">
                <button className="btn btn-large w-100"
                        onClick={()=>{
                          console.log("BALANCE",balance)
                          changeView('burn-wallet')
                        }}>
                  <Scaler config={{startZoomAt:500,origin:"25% 50%"}}>
                    <i className="fas fa-fire"/> Burn Wallet
                  </Scaler>
                </button>
              </div>
            </div>
          </div>
          }
        </div>
        <div className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={goBack}>
              <i className="fas fa-times"/> done
            </a>
          </span>
        </div>
      </div>
    )
  }
}
