import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
const QRCode = require('qrcode.react');

export default class Receive extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
    }
  }
  render() {
    let {changeAlert} = this.props

    let url = window.location.protocol+"//"+window.location.hostname
    if(window.location.port&&window.location.port!=80&&window.location.port!=443){
      url = url+":"+window.location.port
    }
    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = url

    return (
      <div>
        <CopyToClipboard text={qrValue} onCopy={() => {
          changeAlert({type: 'success', message: 'URL copied to clipboard'})
        }}>
          <div className="content qr row" style={{cursor:"pointer"}}>
            <QRCode value={qrValue} size={qrSize}/>
            <div className="input-group">
              <input type="text" className="form-control" style={{color:"#999999"}} value={qrValue} disabled/>
              <div className="input-group-append">
                <span className="input-group-text"><i style={{color:"#999999"}}  className="fas fa-copy"/></span>
              </div>
            </div>
          </div>
        </CopyToClipboard>
      </div>
    )
  }
}
