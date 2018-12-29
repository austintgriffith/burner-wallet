import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';
import {CopyToClipboard} from "react-copy-to-clipboard";
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
    if(requested){

      let url = window.location.protocol+"//"+window.location.hostname
      if(window.location.port&&window.location.port!=80&&window.location.port!=443){
        url = url+":"+window.location.port
      }
      let qrSize = Math.min(document.documentElement.clientWidth,512)-90
      let qrValue = url+"/"+this.props.address+";"+amount+";"+encodeURI(message)

      return (
        <div>
          <div className="main-card card w-100">
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

              <div className="content qr row" style={{cursor:"pointer",textAlign:"center",width:"100%"}}>
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
          </div>
          <div className="text-center bottom-text">
            <span style={{padding:10}}>
              <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
                <i className="fas fa-thumbs-up"/> done
              </a>
            </span>
          </div>
        </div>
      )
    }else{
      return (
        <div>
          <div className="send-to-address card w-100">
            <Balance amount={this.props.balance} address={this.props.address} dollarDisplay={this.props.dollarDisplay} />
            <Ruler/>
            <div className="content row">
              <div className="form-group w-100">
                <label htmlFor="amount_input">Request Amount</label>
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">$</div>
                  </div>
                  <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                         onChange={event => this.updateState('amount', event.target.value)} />
                </div>
              </div>
              <div className="form-group w-100">
                <label htmlFor="amount_input">Item or Message</label>
                <input type="text" className="form-control" placeholder="Hot Dogs" value={this.state.message}
                       onChange={event => this.updateState('message', event.target.value)} />
              </div>
              <button className={`btn btn-success btn-lg w-100 ${canRequest ? '' : 'disabled'}`}
                      onClick={this.request}>
                Request
              </button>
            </div>
          </div>
          <div className="text-center bottom-text">
            <span style={{padding:10}}>
              <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
                <i className="fas fa-times"/> cancel
              </a>
            </span>
          </div>
        </div>
      )
    }

  }
}
