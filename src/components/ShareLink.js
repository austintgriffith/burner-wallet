import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { Scaler, Button } from "dapparatus"
var QRCode = require('qrcode.react');

export default class ShareLink extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      copied: false
    }
  }
  render() {
    let { canSend } = this.state;

    let port = window.location.port
    if(port && port!="80"){
      port=":"+port
    }else{
      port=""
    }

    let url = window.location.protocol + "//" + window.location.hostname+port;
    let element = "";
    let qrValue = url + "/" + this.props.sendLink + ";" + this.props.sendKey;
    let extraDisplay = "";

    let qrSize = Math.min(document.documentElement.clientWidth,512)-90


    if(this.state.copied){
      extraDisplay="Copied Link!"
    }

    return (
      <div>
        <div className="main-card card w-100">
          <CopyToClipboard text={qrValue} onCopy={() => {
                 this.props.changeAlert({type: 'success', message: 'Link copied to clipboard'})
          }}>
          <div style={{cursor:"pointer"}}>
            <div className="content qr row">
              <QRCode value={qrValue} size={qrSize}/>
            </div>
            <Ruler/>
            <div style={{width:"100%",textAlign:"center"}}>
              <div className="input-group" style={{paddingLeft:20,paddingRight:20}}>
                <input type="text" className="form-control" value={qrValue} disabled/>
                <div className="input-group-append">
                  <span className="input-group-text"><i className="fas fa-copy"/></span>
                </div>
              </div>
            </div>

          </div>
          </CopyToClipboard>
        </div>
        <div className="main-card card w-100">
          <div className="content bridge row" style={{padding:10}}>
            <button className="btn btn-large w-100" style={{backgroundColor:this.props.mainStyle.mainColor}} onClick={this.props.goBack}>
              <Scaler config={{startZoomAt:500,origin:"25% 50%",adjustedZoom:1}}>
                <i className="fas fa-thumbs-up"  /> Done
              </Scaler>
            </button>
          </div>
        </div>
      </div>
    )
  }
}
