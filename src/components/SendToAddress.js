import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'


export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
      amount: props.amount,
      message: props.message,
      canSend: false,
    }
    /*if(props.balance<=0){
      this.props.goBack();
      window.history.pushState({},"", "/");
    }*/
    let startingAmount = 0.15
    if(props.amount){
      startingAmount = props.amount
    }
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        initialState.toAddress = window.location.pathname.substring(1)
      }else{
        let parts = window.location.pathname.split(";")
        console.log("PARTS",parts)
        if(parts.length>2){
          initialState.toAddress = parts[0].replace("/","")
          initialState.amount = parts[1]
          initialState.message = decodeURI(parts[2])
        }
        if(parts.length>3){
          initialState.extraMessage = decodeURI(parts[3])
        }
      }
    }
    this.state = initialState
    console.log("SendToAddress constructor",this.state)
    window.history.pushState({},"", "/");
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() })
    });
    if(key=="toAddress"){
      setTimeout(()=>{
        this.scrollToBottom()
      },30)
    }
  };

  componentDidMount(){
    this.setState({ canSend: this.canSend() })
    setTimeout(()=>{
      if(!this.state.toAddress && this.addressInput){
        this.addressInput.focus();
      }else if(!this.state.amount && this.amountInput){
        this.amountInput.focus();
      }else if(this.messageInput){
        this.messageInput.focus();
      }

      setTimeout(()=>{
        this.scrollToBottom()
      },30)
    },350)
    setTimeout(()=>{
      if(this.props.balance<=0){
        console.log("No Funds, redirect back home...")
        this.props.goBack();
        window.history.pushState({},"", "/");
        this.props.changeAlert({
          type: 'warning',
          message: 'No funds to send.',
        });
      }
    },2500)
  }


  scrollToBottom(){
    console.log("scrolling to bottom")
    scroller.scrollTo('theVeryBottom', {
      duration: 500,
      delay: 30,
      smooth: "easeInOutCubic",
    })
  }
  canSend() {
    return (this.state.toAddress && this.state.toAddress.length === 42 && (this.state.amount>0 || this.state.message))
  }

  send = () => {
    let { toAddress, amount } = this.state;


    if(this.state.canSend){
      if(this.props.balance-0.0001<=amount){
        let extraHint = ""
        if(amount-this.props.balance<=.01){
          extraHint = "(gas costs)"
        }

        this.props.changeAlert({type: 'warning', message: 'You can only send $'+Math.floor((this.props.balance-0.0001)*100)/100+' '+extraHint})
      }else{
        console.log("SWITCH TO LOADER VIEW...",amount)
        this.props.changeView('loader')
        setTimeout(()=>{window.scrollTo(0,0)},60)

        console.log("web3",this.props.web3)
        let txData
        if(this.state.message){
          txData = this.props.web3.utils.utf8ToHex(this.state.message)
        }
        console.log("txData",txData)
        let value = 0
        console.log("amount",amount)
        if(amount){
          value=amount
        }

        this.props.send(toAddress, value, 120000, txData, (result) => {
          if(result && result.transactionHash){
            this.props.goBack();
            window.history.pushState({},"", "/");
            this.props.changeAlert({
              type: 'success',
              message: 'Sent! '+result.transactionHash,
            });
          }
        })
      }
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid address'})
    }
  };

  render() {
    let { canSend, toAddress } = this.state;

    /*let sendMessage = ""
    if(this.state.message){
      sendMessage = (
        <div className="form-group w-100">
          <label htmlFor="amount_input">For</label>
          <div>
            {decodeURI(this.state.message)}
          </div>
        </div>
      )
    }*/

    let messageText = "Message"
    if(this.state.extraMessage){
      messageText = this.state.extraMessage
    }

    return (
      <div>
        <div className="send-to-address card w-100">
          <Balance amount={this.props.balance} address={this.props.address} dollarDisplay={this.props.dollarDisplay}/>
          <Ruler/>
          <div className="content row">
            <div className="form-group w-100">
              <div className="form-group w-100">
                <label htmlFor="amount_input">To Address</label>
                <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                  ref={(input) => { this.addressInput = input; }}
                       onChange={event => this.updateState('toAddress', event.target.value)} />
              </div>
              <div>  { this.state.toAddress && this.state.toAddress.length==42 &&

                <CopyToClipboard text={toAddress.toLowerCase()}>
                  <div style={{cursor:"pointer"}} onClick={() => this.props.changeAlert({type: 'success', message: toAddress.toLowerCase()+' copied to clipboard'})}>
                    <Blockies seed={toAddress.toLowerCase()} scale={10}/>
                  </div>
                </CopyToClipboard>
              }</div>
              <label htmlFor="amount_input">Send Amount</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                    ref={(input) => { this.amountInput = input; }}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
              <div className="form-group w-100" style={{marginTop:20}}>
                <label htmlFor="amount_input">{messageText}</label>
                <input type="text" className="form-control" placeholder="optional unencrypted message" value={this.state.message}
                  ref={(input) => { this.messageInput = input; }}
                       onChange={event => this.updateState('message', event.target.value)} />
              </div>
            </div>
            <button style={{backgroundColor:this.props.mainStyle.mainColor}} className={`btn btn-success btn-lg w-100 ${canSend ? '' : 'disabled'}`}
                    onClick={this.send}>
              Send
            </button>
          </div>
        </div>
        <div name="theVeryBottom" className="text-center bottom-text">
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
