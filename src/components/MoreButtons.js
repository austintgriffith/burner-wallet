import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Balance from "./Balance";



export default ({buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {
  return (
    <div className="content bridge row">
      <div className="col-6 p-1">
        <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
          changeView('request_funds')}
        }>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-hand-holding-usd"></i> Request
          </Scaler>
        </button>
      </div>
      <div className="col-6 p-1">
        <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
          changeView('exchange')}
        }>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fa fa-random"></i> Exchange
          </Scaler>
        </button>
      </div>
    </div>
  )
}
