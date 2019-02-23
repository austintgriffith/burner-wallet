import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import cookie from 'react-cookies'
import {CopyToClipboard} from "react-copy-to-clipboard";
import Blockies from 'react-blockies';
import { scroller } from 'react-scroll'
import Badge from './Badge';
import i18n from '../i18n';

export default class SendBadge extends React.Component {
  constructor(props) {
    super(props);

    let toAddress = ""
    if(props.scannerState) toAddress = props.scannerState.toAddress
    if(!toAddress) {
      toAddress = cookie.load('sendBadgeToAddress')
    }else{
      cookie.save('sendBadgeToAddress', toAddress, { path: '/', maxAge: 60 })
      setTimeout(()=>{
        this.scrollToBottom()
      },30)
    }

    this.state = {
      canSend: false,
      toAddress: toAddress
    }
    setTimeout(()=>{
      this.setState({ canSend: this.canSend() })
    },1000)
  }
  componentDidMount = () => {
    window.addEventListener('scroll', this.handleOnScroll.bind(this))
  }
  componentWillUnmount = () => {
    window.removeEventListener('scroll', this.handleOnScroll.bind(this))
  }
  handleOnScroll = () => {
      this.forceUpdate()
  }
  updateState = async (key, value) => {
    if(key=="toAddress"){
      cookie.save('sendBadgeToAddress', value, { path: '/', maxAge: 60 })
    }
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() })
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
          this.setState({ canSend: this.canSend() })
        })
      }
    }
  };
  scrollToBottom(){
    console.log("scrolling to bottom")
    scroller.scrollTo('theVeryBottom', {
      duration: 500,
      delay: 30,
      smooth: "easeInOutCubic",
    })
  }
  canSend() {
    //console.log("CAN SEND?",this.state.toAddress,this.state.toAddress.length)
    return (this.state.toAddress && this.state.toAddress.length === 42)
  }
  send = async () => {
    let { toAddress, amount } = this.state;
    let {ERC20TOKEN} = this.props


    if(this.state.canSend){

      console.log("SWITCH TO LOADER VIEW...",amount)
      this.props.changeView('loader')
      setTimeout(()=>{window.scrollTo(0,0)},60)

      console.log("web3",this.props.web3)

      cookie.remove('sendBadgeToAddress', { path: '/' })
      this.props.tx(
        this.props.contracts.Badges.transferFrom(this.props.address,this.state.toAddress,this.props.badge.id)
        ,240000,0,0,(receipt)=>{
          if(receipt){

            console.log("SEND BADGE COMPLETE?!?",receipt)
            this.props.goBack();
            window.history.pushState({},"", "/");
            this.props.setReceipt({to:toAddress,from:receipt.from,badge:this.props.badge,result:receipt})
            this.props.changeView("receipt");
            this.props.clearBadges()
          }
        }
      )
      /*this.props.send(toAddress, value, 120000, txData, (result) => {
        if(result && result.transactionHash){
          this.props.goBack();
          window.history.pushState({},"", "/");
          this.props.setReceipt({to:toAddress,from:result.from,amount:parseFloat(amount),message:this.state.message,result:result})
          this.props.changeView("receipt");
        }
      })*/
    }

  };

  render() {
    let { canSend, toAddress } = this.state;
    var h = document.documentElement,
    b = document.body,
    st = 'scrollTop',
    sh = 'scrollHeight';
    var percent = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
    let angle = Math.round(-28 + 75*percent/100)
    return (
      <div>
        <div className="content row" onClick={()=>{
          window.open(this.props.badge.external_url,'_blank')
        }}>
            <Badge large={true} angle={angle} key={"b"+this.props.badge.id} id={this.props.badge.id} image={this.props.badge.image}/>
        </div>
        <div style={{fontSize:14,width:"100%",textAlign:"center"}}>
          {this.props.badge.description}
        </div>
        <Ruler />
        <div className="content row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">{i18n.t('send_to_address.to_address')}</label>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                  ref={(input) => { this.addressInput = input; }}
                       onChange={event => this.updateState('toAddress', event.target.value)} />
                <div className="input-group-append" onClick={() => this.props.openScanner({view:'send_badge'})}>
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
