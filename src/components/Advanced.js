import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18n from '../i18n';
const QRCode = require('qrcode.react');

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      privateKeyQr:false,
      seedPhraseHidden:true,
      privateKeyHidden:true
    }
  }
  render(){
    let {isVendor, balance, address, privateKey, changeAlert, changeView, goBack, setPossibleNewPrivateKey} = this.props

    let url = window.location.protocol+"//"+window.location.hostname
    if(window.location.port&&window.location.port!=80&&window.location.port!=443){
      url = url+":"+window.location.port
    }
    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = url+"/#"+privateKey
    let privateKeyQrDisplay = ""
    if(this.state.privateKeyQr){
      privateKeyQrDisplay = (
        <div className="main-card card w-100">
          <div className="content qr row">
            <QRCode value={qrValue} size={qrSize}/>
          </div>
        </div>
      )
    }

    let showingQr = ""
    if(this.state.showingQr){
      showingQr = (
        <div className="main-card card w-100">
          <div className="content qr row">
            <QRCode value={this.state.showingQr} size={qrSize}/>
          </div>
        </div>
      )
    }


    let inputPrivateEyeButton = ""
    let inputPrivateSize = "col-4 p-1"

    if(this.state.newPrivateKey){
      inputPrivateEyeButton = (
        <div className="col-2 p-1">
          <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{this.setState({privateKeyHidden:!this.state.privateKeyHidden})}}>
            <i className="fas fa-eye"></i>
          </button>
        </div>
      )
    }else{
      inputPrivateSize = "col-6 p-1"
    }

    let inputPrivateKeyRow = (
      <div className="content ops row">
        <div className={inputPrivateSize}>
            <input type={this.state.privateKeyHidden?"password":"text"}  autocorrect="off" autocapitalize="none"  autocorrect="off" autocapitalize="none" className="form-control" placeholder="private key" value={this.state.newPrivateKey}
                   onChange={event => this.setState({newPrivateKey:event.target.value})} />
        </div>
        {inputPrivateEyeButton}
        <div className="col-6 p-1">
          <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}
                  onClick={()=>{
                    console.log(this.state.newPrivateKey)
                    if(this.state && this.state.newPrivateKey && this.state.newPrivateKey.length>=64&&this.state.newPrivateKey.length<=66){
                      //let pkutils = require("ethereum-mnemonic-privatekey-utils")
                      //const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(newPrivateKey)
                      changeView('main')
                      let possibleNewPrivateKey = this.state.newPrivateKey
                      if(possibleNewPrivateKey.indexOf("0x")!=0){
                        possibleNewPrivateKey = "0x"+possibleNewPrivateKey
                      }
                      setPossibleNewPrivateKey(possibleNewPrivateKey)
                    }else{
                      changeAlert({type: 'warning', message: 'Invalid private key.'})
                    }
                  }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-plus-square"/> {i18n.t('create')}
            </Scaler>
          </button>
        </div>
      </div>
    )


    let inputSeedEyeButton = ""
    let inputSeedSize = "col-4 p-1"

    if(this.state.newSeedPhrase){
      inputSeedEyeButton = (
        <div className="col-2 p-1">
          <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{this.setState({seedPhraseHidden:!this.state.seedPhraseHidden})}}>
            <i className="fas fa-eye"></i>
          </button>
        </div>
      )
    }else{
      inputSeedSize = "col-6 p-1"
    }

    let inputSeedRow = (
      <div className="content ops row" style={{paddingTop:10}}>
        <div className={inputSeedSize}>
        <input type={this.state.seedPhraseHidden?"password":"text"}  autocorrect="off" autocapitalize="none" className="form-control" placeholder="seed phrase" value={this.state.newSeedPhrase}
               onChange={event => this.setState({newSeedPhrase:event.target.value})} />
        </div>
        {inputSeedEyeButton}
        <div className="col-6 p-1">
          <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}
                  onClick={()=>{
                    if(!this.state.newSeedPhrase){
                      changeAlert({type: 'warning', message: 'Invalid seed phrase.'})
                    }else{
                      let pkutils = require("ethereum-mnemonic-privatekey-utils")
                      const newPrivateKey = pkutils.getPrivateKeyFromMnemonic(this.state.newSeedPhrase)
                      changeView('main')
                      setPossibleNewPrivateKey("0x"+newPrivateKey)
                    }
                  }}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-plus-square"/> {i18n.t('create')}
            </Scaler>
          </button>
        </div>
      </div>
    )

    return (
      <div style={{marginTop:20}}>

      <div>
        <div style={{width:"100%",textAlign:"center"}}><h5>Learn More</h5></div>
        <div className="content ops row" style={{marginBottom:10}}>
          <div className="col-6 p-1">
            <a href="https://github.com/austintgriffith/burner-wallet" style={{color:"#FFFFFF"}} target="_blank">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-code"/> {i18n.t('code')}
                </Scaler>
              </button>
            </a>
          </div>
          <div className="col-6 p-1">
            <a href="https://medium.com/gitcoin/ethereum-in-emerging-economies-b235f8dac2f2" style={{color:"#FFFFFF"}} target="_blank">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-info"/> {i18n.t('about')}
                </Scaler>
              </button>
            </a>
          </div>
        </div>
      </div>

      <hr style={{paddingTop:20}}/>



        {privateKey && !isVendor &&
        <div>
                    <div style={{width:"100%",textAlign:"center"}}><h5>Private Key</h5></div>
          <div className="content ops row" style={{marginBottom:10}}>

            <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
              this.setState({privateKeyQr:!this.state.privateKeyQr})
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-key"/> {i18n.t('show')}
              </Scaler>
            </button>
            </div>

            <CopyToClipboard text={privateKey}>
              <div className="col-6 p-1"
                   onClick={() => changeAlert({type: 'success', message: 'Private Key copied to clipboard'})}>
                <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                    <i className="fas fa-key"/> {i18n.t('copy')}
                  </Scaler>
                </button>
              </div>
            </CopyToClipboard>

          </div>
          <div className="content ops row">
            {privateKeyQrDisplay}
          </div>

        </div>
        }

        {privateKey &&
        <div>
          <div className="content ops row" >
            <div className="col-12 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}
                      onClick={()=>{
                        console.log("BALANCE",balance)
                        changeView('burn-wallet')
                      }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-fire"/> {i18n.t('burn')}
                </Scaler>
              </button>
            </div>
          </div>
          <hr style={{paddingTop:20}}/>
        </div>}


        <div style={{width:"100%",textAlign:"center"}}><h5>Create Account</h5></div>

        {inputPrivateKeyRow}

        {inputSeedRow}

        <hr style={{paddingTop:20}}/>
        <div style={{width:"100%",textAlign:"center"}}><h5>Extra Tools</h5></div>

        <div className="content ops row">
          <div className="col-6 p-1">
              <input type="text" autocorrect="off" autocapitalize="none" className="form-control" placeholder="any text to encode" value={this.state.newQr}
                     onChange={event => this.setState({newQr:event.target.value})} />
          </div>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary}
                    onClick={()=>{
                      this.setState({showingQr:this.state.newQr})
                    }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-qrcode"/> {i18n.t('advanced.to_qr')}
              </Scaler>
            </button>
          </div>
        </div>
        {showingQr}

        {isVendor &&
        <div>
          <div className="content ops row" style={{marginBottom:10}}>

            <div className="col-12 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
              this.props.changeView("exchange")
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-key"/> {"Exchange"}
              </Scaler>
            </button>
            </div>
          </div>
        </div>
        }

      </div>
    )
  }
}
