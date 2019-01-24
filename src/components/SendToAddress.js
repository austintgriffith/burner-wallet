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
      toAddress: "",
      fromEns: "",
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

  updateState = async (key, value) => {

    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() },()=>{
        if(key!="message"){
          this.bounceToAmountIfReady()
        }
      })
    });
    if(key=="toAddress"){
      this.setState({fromEns:""})
      setTimeout(()=>{
        this.scrollToBottom()
      },30)
    }
    if(key=="toAddress"&&value.indexOf(".eth")>=0){
      console.log("Attempting to look up ",value)
      let addr = await this.props.ensLookup(value)
      console.log("Resolved:",addr)
      if(addr!="0x0000000000000000000000000000000000000000"){
        this.setState({toAddress:addr,fromEns:value},()=>{
          if(key!="message"){
            this.bounceToAmountIfReady()
          }
        })
      }
    }
  };
  bounceToAmountIfReady(){
    if(this.state.toAddress && this.state.toAddress.length === 42){
      this.amountInput.focus();
    }
  }
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
    /*
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
    },2500)*/
  }

  canSend() {
    /*const resolvedAddress = await this.ensProvider.resolveName(this.state.toAddress)
    console.log(`RESOLVED ADDRESS ${resolvedAddress}`)
    if(resolvedAddress != null){
      this.setState({
        toAddress: resolvedAddress
      })
    }*/
    return (this.state.toAddress && this.state.toAddress.length === 42 && (this.state.amount>0 || this.state.message))
  }

  scrollToBottom(){
    console.log("scrolling to bottom")
    scroller.scrollTo('theVeryBottom', {
      duration: 500,
      delay: 30,
      smooth: "easeInOutCubic",
    })
  }

  send = async () => {
    let { toAddress, amount } = this.state;
    let {ERC20TOKEN} = this.props


    if(this.state.canSend){
      if(ERC20TOKEN){
        console.log("this is a token")
      }else{
        console.log("this is not a token")
      }
      console.log("ERC20TOKEN",ERC20TOKEN,"this.props.balance",parseFloat(this.props.balance),"amount",parseFloat(amount))

      if(!ERC20TOKEN && parseFloat(this.props.balance)-0.0001<=parseFloat(amount)){
        let extraHint = ""
        if(!ERC20TOKEN && parseFloat(amount)-parseFloat(this.props.balance)<=.01){
          extraHint = "(gas costs)"
        }
        this.props.changeAlert({type: 'warning', message: 'You can only send $'+Math.floor((parseFloat(this.props.balance)-0.0001)*100)/100+' '+extraHint})
      }else if((ERC20TOKEN && (parseFloat(this.props.balance)<parseFloat(amount)))){
        console.log("SO THE BALANCE IS LESS!")
        this.props.changeAlert({type: 'warning', message: 'You can only send $'+parseFloat(this.props.balance)})
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
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid address or ENS.'})
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
        <div className="content row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">To Address</label>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                  ref={(input) => { this.addressInput = input; }}
                       onChange={event => this.updateState('toAddress', event.target.value)} />
                <div class="input-group-append" onClick={() => this.props.changeView('send_by_scan')}>
                  <span class="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
                    <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
                  </span>
                </div>
              </div>
            </div>
            <div>  { this.state.toAddress && this.state.toAddress.length==42 &&
              <CopyToClipboard text={toAddress.toLowerCase()}>
                <div style={{cursor:"pointer"}} onClick={() => this.props.changeAlert({type: 'success', message: toAddress.toLowerCase()+' copied to clipboard'})}>
                  <div style={{opacity:0.33}}>{this.state.fromEns}</div>
                  <Blockies seed={toAddress.toLowerCase()} scale={10}/>
                </div>
              </CopyToClipboard>
            }</div>
            <label htmlFor="amount_input">Send Amount</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
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
          <button className={`btn btn-lg w-100 ${canSend ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}
                  onClick={this.send}>
            Send
          </button>
        </div>
      </div>
    )
  }
}
