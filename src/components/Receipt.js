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
import { Flex, Icon, Card, Text } from "rimble-ui";


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
    console.log("CHECKING PARAMS:",this.props.receipt.params)
    if(this.props.receipt && this.props.receipt.params && this.props.receipt.params.callback){
      console.log("Redirecting to ",this.props.receipt.params.callback,"with data:",this.props.receipt)
      let returnObject = {
        to: this.props.receipt.to,
        from: this.props.receipt.from,
        amount: this.props.receipt.amount,
        transactionHash: this.props.receipt.result.transactionHash,
        status: this.props.receipt.result.status,
        data: this.props.receipt.result.v,
      }
      console.log("returnObject",returnObject)
      setTimeout(()=>{
        window.location = this.props.receipt.params.callback+"?receipt="+(encodeURI(JSON.stringify(returnObject)))
      },2500)
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
          <span style={{opacity:0.15}}>-</span>{dollarDisplay(receipt.amount)}<span style={{opacity:0.15}}>-></span>
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
        <div>
          <Flex alignItems={'center'} justifyContent={'center'}>
            <Icon name="CheckCircle" color={'success'} size={180} />
          </Flex>

          <Flex alignItems={'center'} justifyContent={'space-around'}>
            <Blockie
              address={receipt.from}
              config={{size:BockieSize}}
            />

            <Text textAlign={'center'}>{sendAmount}</Text>

            <Blockie
              address={receipt.to}
              config={{size:BockieSize}}
            />
          </Flex>

          <Text textAlign={'center'}>{message}</Text>

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
