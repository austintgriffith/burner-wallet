import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18n from '../i18n';
import RecentTransactions from './RecentTransactions';
const QRCode = require('qrcode.react');

export default class RequestFunds extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      message: "",
      amount: "",
      canRequest: false,
      requested: false
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canRequest: (this.state.amount > 0) })
    });
  };

  request = () => {
    let { message, amount } = this.state;
    if(this.state.canRequest){
      this.setState({requested:true})
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid amount'})
    }
  };

  render() {
    let { canRequest, message, amount, requested } = this.state;
    let {view,buttonStyle,ERC20TOKEN,address, changeView} = this.props
    if(requested){

      let url = window.location.protocol+"//"+window.location.hostname
      if(window.location.port&&window.location.port!=80&&window.location.port!=443){
        url = url+":"+window.location.port
      }
      let qrSize = Math.min(document.documentElement.clientWidth,512)-90
      let qrValue = url+"/"+this.props.address+";"+amount+";"+encodeURI(message).replaceAll("#","%23").replaceAll(";","%3B").replaceAll(":","%3A").replaceAll("/","%2F")

      return (
        <div>
          <CopyToClipboard text={qrValue} onCopy={() => {
            this.props.changeAlert({type: 'success', message: 'Request link copied to clipboard'})
          }}>
          <div style={{width:"100%",textAlign:'center'}}>
            <div style={{fontSize:30,cursor:"pointer",textAlign:"center",width:"100%"}}>
              ${parseFloat(amount).toFixed(2)}
            </div>

            <div style={{cursor:"pointer",textAlign:"center",width:"100%"}}>
              {message}
            </div>

            <div style={{cursor:"pointer",textAlign:"center",width:"100%"}}>
              <QRCode value={qrValue} size={qrSize}/>
            </div>

            <div className="input-group">
              <input type="text" className="form-control" value={qrValue} disabled/>
              <div className="input-group-append">
                <span className="input-group-text"><i className="fas fa-copy"/></span>
              </div>
            </div>

            </div>
          </CopyToClipboard>
          <RecentTransactions
            view={view}
            max={5}
            buttonStyle={buttonStyle}
            ERC20TOKEN={ERC20TOKEN}
            transactionsByAddress={ERC20TOKEN?this.props.fullTransactionsByAddress:this.props.transactionsByAddress}
            changeView={changeView}
            address={address}
            block={this.props.block}
            recentTxs={ERC20TOKEN?this.props.fullRecentTxs:this.props.recentTxs}
          />
        </div>
      )
    }else{
      return (
        <div>
          <div className="content row">
            <div className="form-group w-100">
              <label htmlFor="amount_input">{i18n.t('request_funds.amount')}</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <div className="form-group w-100">
              <label htmlFor="amount_input">{i18n.t('request_funds.item_message')}</label>
              <input type="text" className="form-control" placeholder="Hot Dogs" value={this.state.message}
                     onChange={event => this.updateState('message', event.target.value)} />
            </div>
            <button style={{backgroundColor:this.props.mainStyle.mainColor}} className={`btn btn-success btn-lg w-100 ${canRequest ? '' : 'disabled'}`}
                    onClick={this.request}>
              {i18n.t('request_funds.button')}
            </button>
          </div>

        </div>
      )
    }

  }
}
