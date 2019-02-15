import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import cookie from 'react-cookies'
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
import i18n from '../i18n';


export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    let startAmount = props.amount
    if(props.scannerState) startAmount = props.scannerState.amount
    if(!startAmount) {
      startAmount = cookie.load('sendToStartAmount')
    }else{
      cookie.save('sendToStartAmount', startAmount, { path: '/', maxAge: 60 })
    }
    let startMessage= props.message
    if(props.scannerState) startMessage = props.scannerState.message
    if(!startMessage) {
      startMessage = cookie.load('sendToStartMessage')
    }else{
      cookie.save('sendToStartMessage', startMessage, { path: '/', maxAge: 60 })
    }

    let extraMessage = props.extraMessage
    if(props.scannerState) extraMessage = props.scannerState.extraMessage

    let toAddress = ""
    if(props.scannerState) toAddress = props.scannerState.toAddress
    if(!toAddress) {
      toAddress = cookie.load('sendToAddress')
    }else{
      cookie.save('sendToAddress', toAddress, { path: '/', maxAge: 60 })
    }

    let initialState = {
      amount: startAmount,
      message: startMessage,
      toAddress: toAddress,
      extraMessage: extraMessage,
      fromEns: "",
      canSend: false,
    }

    let startingAmount = 0.15
    if(props.amount){
      startingAmount = props.amount
    }
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        initialState.toAddress = window.location.pathname.substring(1)
      }else if(window.location.pathname.length>40) {
      //    console.log("window.location.pathname",window.location.pathname)
      //  console.log("parseAndCleanPath...")
        initialState = Object.assign(initialState,this.props.parseAndCleanPath(window.location.pathname))
      //  console.log("parseAndCleanPath:",initialState)
      }
    }

    this.state = initialState
  //  console.log("SendToAddress constructor",this.state)
    window.history.pushState({},"", "/");
  }

  updateState = async (key, value) => {
    if(key=="amount"){
      cookie.save('sendToStartAmount', value, { path: '/', maxAge: 60 })
    }
    else if(key=="message"){
      cookie.save('sendToStartMessage', value, { path: '/', maxAge: 60 })
    }
    else if(key=="toAddress"){
      cookie.save('sendToAddress', value, { path: '/', maxAge: 60 })
    }
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() },()=>{
        if(key!="message"){
          this.bounceToAmountIfReady()
        }
      })
    });
    if(key=="toAddress"){
      this.setState({fromEns:""})
      //setTimeout(()=>{
      //  this.scrollToBottom()
      //},30)
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
        setTimeout(()=>{
          this.scrollToBottom()
        },30)
      }
    },350)
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

      if(!ERC20TOKEN && parseFloat(this.props.balance) <= 0){
        console.log("No funds!?!",ERC20TOKEN,parseFloat(this.props.balance))
        this.props.changeAlert({type: 'warning', message: "No Funds."})
      }else if(!ERC20TOKEN && parseFloat(this.props.balance)-0.0001<=parseFloat(amount)){
        let extraHint = ""
        if(!ERC20TOKEN && parseFloat(amount)-parseFloat(this.props.balance)<=.01){
          extraHint = "(gas costs)"
        }
        this.props.changeAlert({type: 'warning', message: 'Not enough funds: $'+Math.floor((parseFloat(this.props.balance)-0.0001)*100)/100+' '+extraHint})
      }else if((ERC20TOKEN && (parseFloat(this.props.balance)<parseFloat(amount)))){
        console.log("SO THE BALANCE IS LESS!")
        this.props.changeAlert({type: 'warning', message: 'Not enough tokens: $'+parseFloat(this.props.balance)})
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

        cookie.remove('sendToStartAmount', { path: '/' })
        cookie.remove('sendToStartMessage', { path: '/' })
        cookie.remove('sendToAddress', { path: '/' })

        this.props.send(toAddress, value, 120000, txData, (result) => {
          if(result && result.transactionHash){
            this.props.goBack();
            window.history.pushState({},"", "/");
            /*
            this.props.changeAlert({
              type: 'success',
              message: 'Sent! '+result.transactionHash,
            });*/

            let receiptObj = {to:toAddress,from:result.from,amount:parseFloat(amount),message:this.state.message,result:result}

          //  console.log("CHECKING SCANNER STATE FOR ORDER ID",this.props.scannerState)
            if(this.props.scannerState&&this.props.scannerState.daiposOrderId){
              receiptObj.daiposOrderId = this.props.scannerState.daiposOrderId
            }

            //console.log("SETTING RECEPITE STATE",receiptObj)
            this.props.setReceipt(receiptObj)
            this.props.changeView("receipt");
          }
        })
      }
    }else{
      this.props.changeAlert({type: 'warning', message: i18n.t('send_to_address.error')})
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


    let amountInputDisplay = (
      <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
          ref={(input) => { this.amountInput = input; }}
             onChange={event => this.updateState('amount', event.target.value)} />
    )
    if(this.props.scannerState&&this.props.scannerState.daiposOrderId){
      amountInputDisplay = (
        <input type="number" readOnly className="form-control" placeholder="0.00" value={this.state.amount}
            ref={(input) => { this.amountInput = input; }}
               onChange={event => this.updateState('amount', event.target.value)} />
      )
    }

    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">{i18n.t('send_to_address.to_address')}</label>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                  ref={(input) => { this.addressInput = input; }}
                       onChange={event => this.updateState('toAddress', event.target.value)} />
                <div className="input-group-append" onClick={() => {
                  this.props.openScanner({view:"send_to_address"})
                }}>
                  <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
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
            <label htmlFor="amount_input">{i18n.t('send_to_address.send_amount')}</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              {amountInputDisplay}
            </div>
            <div className="form-group w-100" style={{marginTop:20}}>
              <label htmlFor="amount_input">{messageText}</label>
              <input type="text" className="form-control" placeholder="optional unencrypted message" value={this.state.message}
                ref={(input) => { this.messageInput = input; }}
                     onChange={event => this.updateState('message', event.target.value)} />
            </div>
          </div>
          <button name="theVeryBottom" className={`btn btn-lg w-100 ${canSend ? '' : 'disabled'}`} style={this.props.buttonStyle.primary}
                  onClick={this.send}>
            Send
          </button>
        </div>
      </div>
    )
  }
}
