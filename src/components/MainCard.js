import React from 'react';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Balance from "./Balance";
const QRCode = require('qrcode.react');


export default ({address, balance, changeAlert, privateKey, burnWallet}) => {
  return (
    <div className="main-card card w-100">
      <Balance amount={balance} address={address}/>
      <Ruler/>
      <div className="content qr row">
        <QRCode value={address} size={256}/>
        <div className="input-group">
          <input type="text" className="form-control" placeholder={address} disabled/>
          <CopyToClipboard text={address}>
            <div className="input-group-append"
                 onClick={() => changeAlert({type: 'success', message: 'Address copied to clipboard'})}>
              <span className="input-group-text"><i className="fas fa-copy"/></span>
            </div>
          </CopyToClipboard>
        </div>
      </div>
      <Ruler/>
      <div className="content bridge row">
        <a className="btn btn-large w-100" href="https://dai-bridge.poa.network/" target="_blank" rel="noopener noreferrer">
          xDai Bridge
        </a>
      </div>
      {privateKey &&
      <div>
        <Ruler/>
        <div className="content ops row">
          <CopyToClipboard text={privateKey}>
            <div className="col-6 p-1"
                 onClick={() => changeAlert({type: 'success', message: 'Private Key copied to clipboard'})}>
              <button className="btn btn-large w-100">Save Wallet</button>
            </div>
          </CopyToClipboard>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100"
                    onClick={burnWallet}>
              Burn Wallet
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  )
}
