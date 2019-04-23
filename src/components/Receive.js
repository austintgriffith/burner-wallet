import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import RecentTransactions from './RecentTransactions';
import { scroller } from 'react-scroll'
import BackButton from './BackButton';
import i18n from '../i18n';
const QRCode = require('qrcode.react');

export default class Receive extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
    }
  }
  render() {
    const { buttonStyle, address, balance, changeAlert, changeView, subBalanceDisplay, account } = this.props

    let qrSize = Math.min(document.documentElement.clientWidth,512)-90
    let qrValue = address

    return (
      <div>
        <div className="send-to-address w-100">
          <CopyToClipboard text={address} onCopy={() => {
            changeAlert({type: 'success', message: i18n.t('receive.address_copied')})
          }}>
            <div className="content qr row" style={{cursor:"pointer"}}>
              <QRCode value={qrValue} size={qrSize}/>
              <div className="input-group">
                <input type="text" className="form-control" style={{color:"#999999"}} value={address} disabled/>
                <div className="input-group-append">
                  <span className="input-group-text"><i style={{color:"#999999"}}  className="fas fa-copy"/></span>
                </div>
              </div>
            </div>
          </CopyToClipboard>
          <RecentTransactions
            max={5}
            buttonStyle={buttonStyle}
            changeView={changeView}
            address={address}
            block={this.props.block}
          />
        </div>
        <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <BackButton style={{color:"#FFFFFF"}}>
              <i className="fas fa-times"/> {i18n.t('cancel')}
            </BackButton>
          </span>
        </div>
      </div>
    )
  }
}
