import React from 'react';
import { Scaler } from "dapparatus";
import {CopyToClipboard} from "react-copy-to-clipboard";




export default ({buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {

  let sendButtons = (
    <div>
      <div className="content ops row">
        <div className="col-6 p-1" onClick={() => changeView('receive')}>
          <button className="btn btn-large w-100" style={buttonStyle.primary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-qrcode"  /> Receive
            </Scaler>
          </button>
        </div>
        <div className="col-6 p-1">
          <button className="btn btn-large w-100" onClick={() => changeView('send_to_address')} style={buttonStyle.primary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-paper-plane"/> Send
            </Scaler>
          </button>
        </div>
      </div>
      <div className="content ops row">
        <div className="col-6 p-1" onClick={() => changeView('send_with_link')}>
          <button className="btn btn-large w-100" onClick={() => changeView('share')} style={buttonStyle.secondary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-share"/> Share
            </Scaler>
          </button>
        </div>
        <div className="col-6 p-1" onClick={() => changeView('send_with_link')}>
          <button className="btn btn-large w-100" style={buttonStyle.secondary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-money-bill-alt"  /> Link
            </Scaler>
          </button>
        </div>
      </div>
    </div>
  )

  if(ERC20TOKEN){
    sendButtons = (
      <div className="content ops row">
        <div className="col-6 p-1" onClick={() => changeView('vendors')}>
          <button className="btn btn-large w-100" style={buttonStyle}>
            <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
              <i className="fas fa-truck"></i> Vendors
            </Scaler>
          </button>
        </div>
        <div className="col-6 p-1">
          <button className="btn btn-large w-100" onClick={() => changeView('send_to_address')} style={buttonStyle}>
            <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
              <i className="fas fa-address-book"/> Send
            </Scaler>
          </button>
        </div>
      </div>
    )
  }


  return (
    <div>
      <div>
        {sendButtons}
      </div>
    </div>
  )
}
