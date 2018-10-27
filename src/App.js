import React, { Component } from 'react';
import './App.css';
import { Dapparatus, Metamask, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button } from "dapparatus"
import Web3 from 'web3';
import QRCodeScanner from "./QRCodeScanner.js"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import ReactLoading from 'react-loading';

import eth from './ethereum.png';

var QRCode = require('qrcode.react');
let WEB3_PROVIDER = 'http://0.0.0.0:8545'

//WEB3_PROVIDER = new Web3("https://dai.poa.network")
//WEB3_PROVIDER = new Web3("wss://dai.infura.io/ws")
//https://core.poa.network'

if(window.location.hostname.indexOf("qreth")>=0){
  WEB3_PROVIDER = "https://mainnet.infura.io/v3/e59c464c322f47e2963f5f00638be2f8"
}else if(window.location.hostname.indexOf("xdai")>=0){
  WEB3_PROVIDER = "https://dai.poa.network"
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
      scanning: false,
      sendTo: false,
      copied:false,
      amount:0.01
    }
  }
  handleInput(e){
    let update = {}
    update[e.target.name] = e.target.value
    this.setState(update)
  }
  onQRCodeValidate(location){
    console.log("onQRCodeValidate",location)
    if(location.indexOf("http")>=0){
      //we are good this is already an http address
      window.location = location
    } else {
      //maybe they just scanned an address?
      window.location = "/"+location
    }



  }
  onQRCodeError(a,b){
    console.log("onQRCodeError",a,b)
    //this.setState({scanning:!this.state.scanning})
  }
  onQRCodeScan(a,b){
    console.log("onQRCodeScan",a,b)
    this.setState({scanning:false})
  }
  toggleQRCodeScanner(){
    console.log("toggleQRCodeScanner")
    this.setState({scanning:!this.state.scanning})
  }
  componentDidMount(){
    if(window.location.pathname&&window.location.pathname.length==43){
      let account = window.location.pathname.substring(1)
      this.setState({sendTo:account})
    }
  }
  render() {
    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan} = this.state
    let connectedDisplay = []
    let contractsDisplay = []

    let url = window.location.protocol+"//"+window.location.hostname

    if(window.location.port&&window.location.port!=80&&window.location.port!=443){
      url = url+":"+window.location.port
    }

    if(web3){
      connectedDisplay.push(
       <Gas
         key="Gas"
         onUpdate={(state)=>{
           console.log("Gas price update:",state)
           this.setState(state,()=>{
             console.log("GWEI set:",this.state)
           })
         }}
       />
      )
      if(this.state.scanning){
        connectedDisplay.push(
          <QRCodeScanner
            onValidate={this.onQRCodeValidate.bind(this)}
            onError={this.onQRCodeError.bind(this)}
            onScan={this.onQRCodeScan.bind(this)}
            onClose={this.toggleQRCodeScanner.bind(this)}
          />
        )
      }else{


        if(this.state.sendTo){

          let loaderBar = ""
          let uiopacity = 1.0
          if(this.state.sending){
            loaderBar = (
              <div style={{opacity:0.5,position:"absolute",top:"-20%",left:0,width:"100%"}}>
                <ReactLoading type={"cubes"} color={"#38a5d8"} width={"100%"} />
              </div>
            )
            uiopacity=0.5
          }

          let moneytype = (
            <img style={{maxHeight:30,verticalAlign:"middle"}} src={eth}/>
          )
          if(window.location.hostname.indexOf("xdai")>=0){
            moneytype="$"
          }

          connectedDisplay.push(
            <div key={"mainui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
              {loaderBar}
             <div style={{padding:10,opacity:uiopacity}}>

             <div>send</div>
                <div>

                {moneytype}<input
              style={{fontSize:30,verticalAlign:"middle",width:90,margin:6,padding:5,border:'2px solid #ccc',borderRadius:5}}
              type="text" name="amount" value={this.state.amount} onChange={this.handleInput.bind(this)}
          /></div>
          <div>to</div>
               <div style={{padding:10}}><Blockie
                config={{size:20}}
                address={this.state.sendTo}
               /></div>
               <Button size="2" color={"green"} onClick={()=>{
                  this.setState({sending:true})
                   this.state.send(this.state.sendTo,this.state.amount,(result)=>{
                     this.setState({sending:false})
                     window.location = "/"
                   })
                 }}>
                 Send
               </Button>
             </div>
            </div>
          )

        }else{

          let qrValue = url+"/"+this.state.account

          let qrDisplay = this.state.account
          if(this.state.copied){
            qrDisplay="Copied Address!"
          }

          connectedDisplay.push(
            <div key={"mainui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
            <CopyToClipboard text={this.state.account}
               onCopy={() => {
                 this.setState({copied: true})
                 setTimeout(()=>{
                   this.setState({copied: false})
                 },3000)
               }}>
               <div style={{cursor:"pointer"}}>

               <QRCode value={qrValue} size={300} />
               <div style={{fontSize:13}}>
                 {qrDisplay}
               </div>

               </div>
             </CopyToClipboard>


             <div style={{padding:10}}>
               <Button size="2" onClick={()=>{
                   this.setState({scanning:true})
                 }}>
                 Send
               </Button>
             </div>
            </div>
          )
        }
      }



      /*
      connectedDisplay.push(
        <ContractLoader
         key="ContractLoader"
         config={{DEBUG:true}}
         web3={web3}
         require={path => {return require(`${__dirname}/${path}`)}}
         onReady={(contracts,customLoader)=>{
           console.log("contracts loaded",contracts)
           this.setState({contracts:contracts},async ()=>{
             console.log("Contracts Are Ready:",this.state.contracts)
           })
         }}
        />
      )*/
      connectedDisplay.push(
        <Transactions
          key="Transactions"
          config={{DEBUG:false,hide:true}}
          account={account}
          gwei={gwei}
          web3={web3}
          block={block}
          avgBlockTime={avgBlockTime}
          etherscan={etherscan}
          metaAccount={this.state.metaAccount}
          onReady={(state)=>{
            console.log("Transactions component is ready:",state)
            this.setState(state)
          }}
          onReceipt={(transaction,receipt)=>{
            // this is one way to get the deployed contract address, but instead I'll switch
            //  to a more straight forward callback system above
            console.log("Transaction Receipt",transaction,receipt)
          }}
        />
      )
      /*
      if(contracts){
        contractsDisplay.push(
          <div key="UI" style={{padding:30}}>
            <div>
              <Address
                {...this.state}
                address={contracts.YOURCONTRACT._address}
              />
            </div>
            broadcast string: <input
                style={{verticalAlign:"middle",width:400,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
                type="text" name="broadcastText" value={this.state.broadcastText} onChange={this.handleInput.bind(this)}
            />
            <Button color={this.state.doingTransaction?"orange":"green"} size="2" onClick={()=>{
                this.setState({doingTransaction:true})
                //tx(contracts.YOURCONTRACT.YOURFUNCTION(YOURARGUMENTS),(receipt)=>{
                //  this.setState({doingTransaction:false})
                //})
              }}>
              Send
            </Button>
            <Events
              config={{hide:false}}
              contract={contracts.YOURCONTRACT}
              eventName={"YOUREVENT"}
              block={block}
              onUpdate={(eventData,allEvents)=>{
                console.log("EVENT DATA:",eventData)
                this.setState({events:allEvents})
              }}
            />
          </div>
        )
      }
      */
    }



    return (
      <div className="App">
        <Dapparatus
          config={{
            DEBUG:false,
            requiredNetwork:['Unknown','Rinkeby',"Mainnet"],
          }}
          fallbackWeb3Provider={WEB3_PROVIDER}
          onUpdate={(state)=>{
           console.log("metamask state update:",state)
           if(state.web3Provider) {
             state.web3 = new Web3(state.web3Provider)
             this.setState(state)
           }
         }}
        />
        <div style={{position:'absolute',left:5,top:0,letterSpacing:-0.8,fontSize:50}}>
          {window.location.hostname}
        </div>
        {connectedDisplay}
        {contractsDisplay}
      </div>
    );
  }
}

export default App;
