import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"
const QRCode = require('qrcode.react');

export default class YourModule extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      yourVar: "",
      YourContract: false,
      yourContractBalance: 0,
      toAddress: (props.scannerState ? props.scannerState.toAddress : ""),
      message: "",
      messageCount: 0,
      chat: [],
      yourContractAddress: false,
    }
  }

  componentDidMount(){
    console.log("YOUR MODULE MOUNTED, PROPS:",this.props)
    /*
        -- LOAD YOUR CONTRACT --
        Contract files loaded from:
        src/contracts/YourContract.abi
        src/contracts/YourContract.address
        src/contracts/YourContract.blocknumber.js // the block number it was deployed at (for efficient event loading)
        src/contracts/YourContract.bytecode.js // if you want to deploy the contract from the module (see deployYourContract())
    */
    this.setState({
     YourContract: this.props.contractLoader("YourContract")
    },()=>{
     console.log("YOURCONTRACT IS LOADED:",this.state.YourContract)
    })

    setInterval(this.pollInterval.bind(this),10000)
    setTimeout(this.pollInterval.bind(this),30)
}
  async pollInterval(){
    console.log("POLL")
    if(this.state && this.state.YourContract) {
      console.log("polling...")
      //let yourVar = await this.state.YourContract.YourVar().call()
      let yourVar = "nada"
      let yourContractBalance = await this.props.web3.eth.getBalance(this.state.YourContract._address)
      //let ensName = await this.props.ensLookup("austingriffith.eth")
      let mainnetBlockNumber = await this.props.mainnetweb3.eth.getBlockNumber()
      let xdaiBlockNumber = await this.props.xdaiweb3.eth.getBlockNumber()
      yourContractBalance = this.props.web3.utils.fromWei(yourContractBalance,'ether')
      let count = await this.state.YourContract.messageCount().call();
      this.setState({yourVar,yourContractBalance,mainnetBlockNumber,xdaiBlockNumber})
      this.setState({messageCount: count})
      let messages = []
      for (var i = 0; i < this.state.messageCount; i++) {
        let message = await this.state.YourContract.chat(i).call();
        messages.push(message);
      }
      this.setState({chat: messages});
    }
  }

  clicked(name){
    console.log("secondary button "+name+" was clicked")
    /*
    Time to make a transaction with YourContract!
    */
    if (name == "chat") {
      this.props.tx(this.state.YourContract.sendMessage(this.state.message), 120000, 0, 0, (result) => {
        console.log(result)
      });
    }
    this.props.tx(this.state.YourContract.updateVar(name),120000,0,0,(result)=>{
      console.log(result)
    })

  }
  deployYourContract() {
    console.log("Deploying YourContract...")
    //
    //  as noted above you need src/contracts/YourContract.bytecode.js
    //  to be there for this to work:
    //
    let code = require("../contracts/YourContract.bytecode.js")
    this.props.tx(this.state.YourContract._contract.deploy({data:code}),640000,(receipt)=>{
      let yourContract = this.props.contractLoader("YourContract",receipt.contractAddress)
      this.setState({ YourContract: yourContract})
    })
  }
  render(){

    if(!this.state.YourContract){
      return (
        <div>
          LOADING YOURCONTRACT...
        </div>
      )
    }

    return (
      <div>
        <div className="form-group w-100">

          <div style={{width:"100%",textAlign:"center"}}>
            Burner Chat
            <Ruler/>
            <div style={{padding:20}}>
              The logged in user is
              <Blockie
                address={this.props.address}
                config={{size:6}}
              />
              {this.props.address.substring(0,8)}
          </div>
          <Ruler/>
          <div style={{width:"100%",textAlign:"right"}}>
            <div>
              <ol>
                {this.state.chat.map((item, index) => (
                  <li>{item}</li>
                ))}
              </ol>
            </div>
          </div>

          <Ruler/>
          <div className="content row">
            <label htmlFor="chat_input">{"SEND A MESSAGE:"}</label>
            <div className="input-group">
              <input type="text" className="form-control" placeholder="Enter a message" value={this.state.message}
                ref={(input) => { this.messageInput = input; }}
                onChange={event => {this.setState({message: event.target.value})}}
              />
            </div>
          </div>

          <button className={'btn btn-lg w-100'} style={this.props.buttonStyle.primary}
                  onClick={()=>{
                    this.clicked("chat")
                  }}
          >
            Send Message
          </button>
          <Ruler/>

          <QRCode value={this.state.YourContract._address} size={Math.min(document.documentElement.clientWidth,512)-90}/>

          <div className="content bridge row">

            <div className="col-4 p-1"></div>
            <div className="col-4 p-1">
            <div style={{padding:20,textAlign:'center'}}>

              Your Chat Room Address is: {this.state.YourContract._address}
              <Blockie
                address={this.state.YourContract._address}
                config={{size:6}}
              />
            </div>
            </div>
          </div>

          <Ruler/>

          <div className="content row">
            <label htmlFor="chat_address_input">{"CHAT ADDRESS INPUT:"}</label>
            <div className="input-group">
              <input type="text" className="form-control" placeholder="0x..."
                ref={(input) => { this.addressInput = input; }}
                onChange={event => this.setState({yourContractAddress: event.target.value})}
              />
              <div className="input-group-append" onClick={() => {
                this.props.openScanner({view:"yourmodule"})
              }}>
                <span className="input-group-text" id="basic-addon2" style={this.props.buttonStyle.primary}>
                  <i style={{color:"#FFFFFF"}} className="fas fa-qrcode" />
                </span>
              </div>
            </div>
          </div>

          <button className={'btn btn-lg w-100'} style={this.props.buttonStyle.primary}
                  onClick={()=>{
                    let yourContract = this.props.contractLoader("YourContract", this.state.yourContractAddress)
                    this.setState({YourContract: yourContract})
                  }}
          >
            Load Chat Room
          </button>
        </div>
          <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} onClick={this.deployYourContract.bind(this)}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-rocket"></i> {"Create Chat Room"}
            </Scaler>
          </button>
        </div>
      </div>
    )

  }
}
