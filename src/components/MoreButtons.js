import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Balance from "./Balance";
import i18n from '../i18n';



export default ({isVendor, buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {

  let exchangeButton

  if(!isVendor){
    exchangeButton  = (
      <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
        changeView('exchange')}
      }>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
          <i className="fa fa-random"></i> {i18n.t('more_buttons.exchange')}
        </Scaler>
      </button>
    )
  }else{
    exchangeButton  = (
      <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
        changeView('cash_out')}
      }>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
          <i className="fa fa-credit-card"></i> {"Cash Out"}
        </Scaler>
      </button>
    )
  }


  return (
    <div className="content bridge row">
      <div className="col-6 p-1">
        <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
          changeView('request_funds')}
        }>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-hand-holding-usd"></i> {i18n.t('more_buttons.request')}
          </Scaler>
        </button>
      </div>
      <div className="col-6 p-1">
        {exchangeButton}
      </div>
    </div>
  )
}
