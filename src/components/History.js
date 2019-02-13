import React from 'react';
import { Scaler } from "dapparatus";
import Blockies from 'react-blockies';
import Balance from "./Balance";
import { scroller } from 'react-scroll'
import Linkify from 'react-linkify'
import {toArray} from 'react-emoji-render';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18next from 'i18next';
const QRCode = require('qrcode.react');
const Transaction = require("ethereumjs-tx")
const EthUtil = require('ethereumjs-util')
const EthCrypto = require('eth-crypto');
const BockieSize = 4

let interval
let counter = 0

export default class History extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      privateKeyQr:false,
      lastHash: false,
      sendingFunds: false,
      newChatAmount: "",
      newChat: ""
    }
  }
  componentDidMount(){
    //this.nameInput.focus();
    interval = setInterval(()=>{
      this.poll()
    },250)
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  async poll(){
    let {transactionsByAddress,target} = this.props
    let theseTransactionsByAddress = []
    if(transactionsByAddress&&transactionsByAddress[target]){
      theseTransactionsByAddress = transactionsByAddress[target]
    }
    let lastElement = theseTransactionsByAddress[theseTransactionsByAddress.length-1]
    if(lastElement && (!this.state.lastHash || this.state.lastHash != lastElement.hash)){
      console.log("lastHash:",lastElement.hash)
      this.setState({lastHash:lastElement.hash})
      setTimeout(()=>{
        this.scrollToBottom()
      },30)
    }
    //try to turn on encryption
    if(counter--<=0){
      counter=10
      if(!this.state["publicKey_"+target]){
        let savedPublicKey = localStorage.getItem("publicKey"+target)
        if(savedPublicKey){
          let update = {}
          update["publicKey_"+target] = savedPublicKey
          this.setState(update)
        }else{
          //try to find a transacition that is from the target
          for(let t in theseTransactionsByAddress){
            if(theseTransactionsByAddress[t].from == target){
              //console.log("FOUND TRANSACTION from target",theseTransactionsByAddress[t])
              let theTx = await this.props.web3.eth.getTransaction(theseTransactionsByAddress[t].hash)
              let rawText = ""
              if(theseTransactionsByAddress[t].data==":wave:"){
                var rawTx = {
                  nonce: this.props.web3.utils.toHex(theTx.nonce),
                  gasPrice: this.props.web3.utils.toHex(theTx.gasPrice),
                  gasLimit: this.props.web3.utils.toHex(theTx.gas),
                  to: theTx.to,
                  value: this.props.web3.utils.toHex(theTx.value),
                  data: theTx.input,
                  v: theTx.v,
                  r: theTx.r,
                  s: theTx.s
                };
                var tx = new Transaction(rawTx);
                console.log("WAVE TX",tx.toJSON())
                let publicKey = EthUtil.bufferToHex(tx.getSenderPublicKey())
                let hashOfPublicKey = this.props.web3.utils.sha3(publicKey).toLowerCase()
                let isValid = hashOfPublicKey.indexOf(theTx.from.toLowerCase().substring(2))
                if(isValid>0){
                  console.log("SAVE PUBLIC KEY!!!",isValid,target,publicKey)
                  localStorage.setItem("publicKey"+target,publicKey)
                  let update = {}
                  update["publicKey_"+target] = publicKey
                  this.setState(update)
                  break;
                }
              }
            }
          }
        }
      }
    }

  }
  scrollToBottom(){
    scroller.scrollTo('sendForm', {
      duration: 1000,
      delay: 100,
      smooth: "easeInOutCubic",
    })
  }
  onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    // 'keypress' event misbehaves on mobile so we track 'Enter' key via 'keydown' event
    if (event.key === 'Enter' && (this.state.newChat||this.state.newChatAmount)) {
      event.preventDefault();
      event.stopPropagation();
      this.sendChat();
    }
  }
  async sendChat(){
    this.setState({sendingChat:true})
    let value = 0
    if(this.state.newChatAmount){
      value = this.state.newChatAmount
    }

    let message
    let targetPublicKey = this.state["publicKey_"+this.props.target]
    let wasEncrypted = false
    if(targetPublicKey){
      //encrypt!
      console.log("ecrypting message with public key",targetPublicKey)
      const encrypted = await EthCrypto.encryptWithPublicKey(
          targetPublicKey.substring(2), // publicKey
          this.state.newChat // message
      );
      console.log("ENCRYPTED:",encrypted)
      const encryptedString = EthCrypto.cipher.stringify(encrypted)
      console.log("encryptedString",encryptedString)
      message = "0x"+encryptedString
      let update = {}
      let key = message.substring(0,32)
      console.log("saving key ",key,"to the state")
      update[key]=this.state.newChat
      this.props.saveKey(update)
      localStorage.setItem(key,this.state.newChat)
      wasEncrypted=true
    }else{
      //rawdog
      message = this.props.web3.utils.utf8ToHex(this.state.newChat)
    }
    console.log("message:",message)
    this.props.send(this.props.target, value, 240000, message, (result) => {
      if(result && result.transactionHash){
        this.props.changeAlert({type: 'success', message: 'Sent '+result.transactionHash})
        console.log("Sent tx "+result.transactionHash)
        this.setState({sendingChat:false,newChat:"",newChatAmount:"",sendingFunds:false})
        setTimeout(()=>{
          this.nameInput.focus();
        },250)
      }
    })
  }
  render(){
    let {transactionsByAddress,address,changeView,block,goBack,target,buttonStyle} = this.props

    let theseTransactionsByAddress = []
    if(transactionsByAddress&&transactionsByAddress[target]){
      theseTransactionsByAddress = transactionsByAddress[target]
    }

    let txns = []
    for(let r in theseTransactionsByAddress){

      let messageValue = ""
      let value = parseFloat(theseTransactionsByAddress[r].value)

      let isEncrypted = ""
      if(theseTransactionsByAddress[r].encrypted){
        isEncrypted = (
          <i className="fa fa-lock" style={{fontSize:12,opacity:0.8}} aria-hidden="true"></i>
        )
      }

      if(theseTransactionsByAddress[r].to==address){
        if(value){
          messageValue = (
            <div style={{width:"100%",textAlign:"center",marginTop:5,marginBottom:-15,opacity:0.7,fontSize:14}}>
              -${this.props.dollarDisplay(theseTransactionsByAddress[r].value)}{"->"}
            </div>
          )
        }
        if(theseTransactionsByAddress[r].data){

          let emojiText = toArray(theseTransactionsByAddress[r].data)
          //<Emoji text={Autolinker.link()} />
          txns.push(
            <div style={{paddingTop:10,paddingBottom:10}}>
              <Ruler />
              <div className="content ops row" style={{position:"relative"}}>
                <div style={{position:'absolute',right:0,top:-13,opacity:0.5,fontSize:12}}>
                  {isEncrypted} {cleanTime((block-theseTransactionsByAddress[r].blockNumber)*5)} ago
                </div>
                <div style={{position:'absolute',left:0}}>
                  <Blockies seed={theseTransactionsByAddress[r].from} scale={3}/>
                </div>
                <div className="chat" style={{position:'relative',marginLeft:32,marginTop:3,textAlign:'left',width:"100%"}}>
                  <Linkify
                    properties={{target:"_blank"}}
                  >
                    {emojiText}
                  </Linkify>
                </div>
                {messageValue}
              </div>
            </div>
          )
        }else{
          txns.push(
            <div key={"tx"+r} style={{paddingTop:3,paddingBottom:21}}>
              <Ruler />
              <div className="content ops row" style={{position:"relative",paddingTop:3}}>
                <div style={{position:'absolute',right:0,top:6,opacity:0.5,fontSize:12}}>
                  {cleanTime((block-theseTransactionsByAddress[r].blockNumber)*5)} ago
                </div>
                <div style={{color:"#000000",width:"100%",marginTop:-2}}>
                  {messageValue}
                </div>
                <div style={{position:'absolute',left:0}}>
                  <Blockies seed={theseTransactionsByAddress[r].from} scale={3}/>
                </div>
              </div>
            </div>
          )
        }
      }else{
        if(value){
          messageValue = (
            <div style={{width:"100%",textAlign:"center",marginTop:5,marginBottom:-15,opacity:0.7,fontSize:14}}>
              {"<-"}${this.props.dollarDisplay(theseTransactionsByAddress[r].value)}-
            </div>
          )
        }
        if(theseTransactionsByAddress[r].data){
          let emojiText = toArray(theseTransactionsByAddress[r].data)
          txns.push(
            <div key={"tx"+r} style={{paddingTop:10,paddingBottom:10}}>
              <Ruler />
              <div className="content ops row" style={{position:"relative"}}>
                <div style={{position:'absolute',left:0,top:-13,opacity:0.5,fontSize:12}}>
                  {isEncrypted} {cleanTime((block-theseTransactionsByAddress[r].blockNumber)*5)} ago
                </div>
                <div style={{position:'absolute',right:0}}>
                  <Blockies seed={theseTransactionsByAddress[r].from} scale={3}/>
                </div>
                <div className="chat" style={{position:'relative',marginRight:32,marginTop:3,textAlign:'right',width:"100%"}}>
                  <Linkify
                    properties={{target:"_blank"}}
                  >
                    {emojiText}
                  </Linkify>
                </div>
                {messageValue}
              </div>
            </div>
          )
        }else{
          txns.push(
            <div key={"tx"+r} style={{paddingTop:3,paddingBottom:21}}>
              <Ruler />
              <div className="content ops row" style={{position:"relative",paddingTop:3}}>
                <div style={{position:'absolute',left:0,top:6,opacity:0.5,fontSize:12}}>
                  {cleanTime((block-theseTransactionsByAddress[r].blockNumber)*5)} ago
                </div>
                <div style={{color:"#000000",width:"100%",marginTop:-2}}>
                  {messageValue}
                </div>
                <div style={{position:'absolute',right:0}}>
                  <Blockies seed={theseTransactionsByAddress[r].from} scale={3}/>
                </div>
              </div>
            </div>
          )
        }
      }
    }

    let sendChatButton = ""
    let sendFundsButton = ""
    if(this.state.sendingChat){
      sendChatButton = (
        <button className="btn btn-large w-100" style={{whiteSpace:"nowrap",backgroundColor:"#666666"}}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-cog fa-spin"></i>
          </Scaler>
        </button>
      )
      sendFundsButton = (
        <button className="btn btn-large w-100" style={{whiteSpace:"nowrap",backgroundColor:"#666666"}}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-cog fa-spin"></i>
          </Scaler>
        </button>
      )
    }else{
      sendChatButton = (
        <button className="btn btn-large w-100" style={buttonStyle.primary}
                onClick={this.sendChat.bind(this)}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-comment"/>
          </Scaler>
        </button>
      )
      sendFundsButton = (
        <button className="btn btn-large w-100" style={buttonStyle.secondary}
                onClick={this.sendChat.bind(this)}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-comment"/>
          </Scaler>
        </button>
      )
    }


    let waveButton = ""
    if(this.state.waving){
      waveButton = (
        <button className="btn btn-large w-100" style={{whiteSpace:"nowrap",backgroundColor:"#666666"}}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-cog fa-spin"></i>
          </Scaler>
        </button>
      )
    }else if(this.props.metaAccount){
      waveButton = (
        <button className="btn btn-large w-100" style={buttonStyle.primary}
                onClick={()=>{
                  this.setState({waving:true})
                  this.props.send(this.props.target, 0, 120000, this.props.web3.utils.utf8ToHex(":wave:"), (result) => {
                    if(result && result.transactionHash){
                      this.setState({waving:false})
                    }
                  })
                }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-handshake"/> {i18next.t('history.wave')}
          </Scaler>
        </button>
      )
    }else{
      waveButton = (
        <button className="btn btn-large w-100" style={{whiteSpace:"nowrap",backgroundColor:"#aaaaaa"}}
                onClick={()=>{
                  this.props.changeAlert({type: 'warning', message: i18next.t('history.metamask_error')})
                }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-handshake"/> {i18next.t('history.wave')}
          </Scaler>
        </button>
      )
    }

    /*
    <div className="col-3 p-1">
      <button className="btn btn-large w-100" style={{whiteSpace:"nowrap"}}
              onClick={()=>{
                window.location = "/"+target
              }}>
        <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
          <i className="fas fa-money-bill-wave"/> Send
        </Scaler>
      </button>
    </div>
     */
    let sendForm

    let placeholder="unencrypted public chat..."
    if(this.state["publicKey_"+target]){
      placeholder = "encrypted chat..."
    }

    let chatInput = (
      <input disabled={this.state.sendingChat} type="text" className="form-control" placeholder={placeholder} value={this.state.newChat}
        ref={(input) => { this.nameInput = input; }}
        onKeyDown={this.onKeyDown}
        onChange={event => this.setState({newChat:event.target.value})}
      />
    )

    if(this.state.sendingFunds){
      sendForm = (
        <div className="content ops row">
          <div className="col-4 p-1">
            <div className="input-group">
              <div className="input-group-prepend" onClick={()=>{
                  this.setState({sendingFunds:false},()=>{
                    setTimeout(()=>{
                      this.nameInput.focus();
                    },250)
                  })
              }}>
                <div className="input-group-text">$</div>
              </div>
              <input type="number" step="0.1" onKeyDown={this.onKeyDown} className="form-control" placeholder="0.00" value={this.state.newChatAmount}
                ref={(input) => { this.amountInput = input; }}
                     onChange={event => this.setState({newChatAmount:event.target.value})}
              />
            </div>
          </div>
          <div className="col-6 p-1">
            {chatInput}
          </div>
          <div className="col-2 p-1">
            {sendChatButton}
          </div>
        </div>
      )
    }else{
      sendForm = (
        <div className="content ops row">
          <div className="col-2 p-1">
            <button className="btn btn-large w-100" style={buttonStyle.secondary}
              onClick={()=>{
                this.setState({sendingFunds:true},()=>{
                  setTimeout(()=>{
                    this.amountInput.focus();
                  },250)
                })
              }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-money-bill-wave"/>
              </Scaler>
            </button>
          </div>
          <div className="col-8 p-1">
           {chatInput}
          </div>
          <div className="col-2 p-1">
            {sendChatButton}
          </div>
        </div>
      )
    }

    let isEncrypted = ""
    if(this.state["publicKey_"+target]){
      isEncrypted = (
        <i className="fa fa-lock" style={{fontSize:30,opacity:0.8,position:'absolute',left:50,top:10}} aria-hidden="true"></i>
      )
    }

    return (
      <div style={{marginTop:20}}>
          <div className="content ops row">
            <div className="col-2 p-1">
              <a href={"https://blockscout.com/poa/dai/address/"+target+"/transactions"} target="_blank">
                <Blockies seed={target} scale={5}/> {isEncrypted}
              </a>
            </div>

            <div className="col-4 p-1">
              <CopyToClipboard text={target}>
                <button className="btn btn-large w-100" style={buttonStyle.secondary}
                  onClick={() => this.props.changeAlert({type: 'success', message: target+' copied to clipboard'})}>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                    <i className="fas fa-save"/> Copy
                  </Scaler>
                </button>
              </CopyToClipboard>
            </div>
            <div className="col-2 p-1">
            </div>
            <div className="col-4 p-1">
              {waveButton}
            </div>

          </div>

        {txns}

        <Ruler />

        <div name="sendForm"></div>
        {sendForm}


      </div>
    )
  }
}


let cleanTime = (s)=>{
  if(s<60){
    return s+"s"
  }else if(s/60<60){
    return Math.round(s/6)/10+"m"
  }else {
    return Math.round((s/60/6)/24)/10+"d"
  }
}
