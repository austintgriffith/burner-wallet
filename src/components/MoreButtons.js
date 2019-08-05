import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Balance from "./Balance";
import i18n from '../i18n';



export default ({isVendor, buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {

  let exchangeButton


    exchangeButton  = (
      <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
        changeView('exchange')}
      }>
        <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
          <i className="fa fa-random"></i> {i18n.t('more_buttons.exchange')}
        </Scaler>
      </button>
    )



  return (
    <div className="content bridge row">
      <div className="col-12 p-1">
        {exchangeButton}
      </div>
    </div>
  )
}
