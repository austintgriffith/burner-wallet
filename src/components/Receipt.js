import React from 'react';
import Ruler from "./Ruler";
import Badge from './Badge';
import Balance from "./Balance";
import {CopyToClipboard} from "react-copy-to-clipboard";
import { Blockie } from "dapparatus";
import RecentTransactions from './RecentTransactions';
import { scroller } from 'react-scroll'
import i18n from '../i18n';
import axios from 'axios';
const QRCode = require('qrcode.react');


const BockieSize = 12

export default class Receive extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
    }
  }
  componentDidMount(){
    console.log("RECEIPT LOADED",this.props)
    if(this.props.receipt && this.props.receipt.daiposOrderId){
      console.log("This was a daipos Order... ping their server for them...")
      // https://us-central1-daipos.cloudfunctions.net/transactionBuffer?orderId=0JFmycULnk9kAboK5ESg&txHash=0x8c831cd5cbc8786982817e43a0a77627ad0b12eaa92feff97fb3b7e91c263b1c&networkId=100
      let url = "https://us-central1-daipos.cloudfunctions.net/transactionBuffer?orderId="+this.props.receipt.daiposOrderId+"&txHash="+this.props.receipt.result.transactionHash+"&networkId=100"
      console.log("url:",url)
      axios.get(url)
       .then((response)=>{
         console.log("Finished hitting the Ching servers:",response)
       })
    }
  }
  render() {
    let {receipt,buttonStyle,ERC20TOKEN,address, balance, changeView, dollarDisplay,account} = this.props

    let message = ""

    let sendAmount = ""
    if(receipt.badge){
      sendAmount = (
        <div>
          <Badge key={"sentbadge"} id={receipt.badge.id} image={receipt.badge.image}/>
        </div>
      )
    }else{
      sendAmount = (
        <div>
          <span style={{opacity:0.15}}>-</span>${parseFloat(receipt.amount).toFixed(2)}<span style={{opacity:0.15}}>-></span>
        </div>
      )
    }

    if(receipt.message){
      message = (
        <div className="row" style={{cursor:"pointer",width:"100%",marginTop:20,marginBottom:-30}}>
          <div className="col-12" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1,padddingTop:30,fontSize:20}}>
            {receipt.message}
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="send-to-address w-100">
            <div className="row" style={{cursor:"pointer",width:"100%"}}>
              <div className="col-12" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                <i className="fas fa-check-circle" style={{color:"#39e917",fontSize:180,opacity:.7}}></i>
              </div>
            </div>

            <div className="row" style={{cursor:"pointer",width:"100%"}}>
              <div className="col-4" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                <Blockie
                  address={receipt.from}
                  config={{size:BockieSize}}
                />
              </div>
              <div className="col-4" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1,fontSize:25,paddingTop:28}}>
                {sendAmount}
              </div>
              <div className="col-4" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
                <Blockie
                  address={receipt.to}
                  config={{size:BockieSize}}
                />
              </div>
            </div>
            {message}

        </div>
        <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> {i18n.t('done')}
            </a>
          </span>
        </div>
      </div>
    )
  }
}
