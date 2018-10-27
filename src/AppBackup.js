import React, { Component } from 'react';
import './App.css';
import { Dapparatus, Metamask, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button } from "dapparatus"
import Web3 from 'web3';
import QRCode from "qrcode";
import QRCodeScanner from "./QRCodeScanner.js"
const WEB3_PROVIDER = 'http://10.0.0.107:8545'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
      scanning: false,
    }
  }
  handleInput(e){
    let update = {}
    update[e.target.name] = e.target.value
    this.setState(update)
  }
  onQRCodeValidate(a,b){
    console.log("onQRCodeValidate",a,b)
    this.setState({scanning:!this.state.scanning})
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
  render() {
    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan} = this.state
    let connectedDisplay = []
    let contractsDisplay = []
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
        connectedDisplay.push(
          <div style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
           <div>
            <canvas ref={c => (this.canvas = c)} />
           </div>
           <div>
           <Button size="2" onClick={()=>{
               this.setState({scanning:true})
             }}>
             Send
           </Button>
           </div>
          </div>
        )
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
      )
      connectedDisplay.push(
        <Transactions
          key="Transactions"
          config={{DEBUG:false}}
          account={account}
          gwei={gwei}
          web3={web3}
          block={block}
          avgBlockTime={avgBlockTime}
          etherscan={etherscan}
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
      )*/
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
          fallbackWeb3Provider={new Web3.providers.HttpProvider(WEB3_PROVIDER)}
          onUpdate={(state)=>{
           console.log("metamask state update:",state)
           if(state.web3Provider) {
             state.web3 = new Web3(state.web3Provider)
             this.setState(state)
           }
           QRCode.toCanvas(
            this.canvas,
            state.account,
            {
              scale: 10
            },
            error => {
              if (error) console.error(error);
            }
          );
         }}
        />
        {connectedDisplay}
        {contractsDisplay}
      </div>
    );
  }
}

export default App;
