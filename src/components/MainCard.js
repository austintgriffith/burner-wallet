import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Balance from "./Balance";
const QRCode = require('qrcode.react');


export default ({address, balance, changeAlert, changeView}) => {
  return (
    <div className="main-card card w-100">
      <Balance amount={balance} address={address}/>
      <Ruler/>
      <div className="content qr row">
        <QRCode value={address} size={350}/>
        <div className="input-group">
          <input
            type="text" className="form-control" value={address} disabled/>
          <CopyToClipboard text={address}>
            <div className="input-group-append"
                 onClick={() => changeAlert({type: 'success', message: 'Address copied to clipboard'})}>
              <span className="input-group-text"><i className="fas fa-copy"/></span>
            </div>
          </CopyToClipboard>
        </div>
      </div>

      <div>
        <Ruler/>
        <div className="content ops row">

            <div className="col-6 p-1" onClick={() => changeView('send_with_link')}>
              <button className="btn btn-large w-100">
                <i className="fas fa-link"  /> Send with Link
              </button>
            </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" onClick={() => changeView('send_to_address')}>

              <i className="fas fa-address-book"/> Send to Address
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
