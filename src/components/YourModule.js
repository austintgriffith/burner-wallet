import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"

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
    try {
      this.setState({
        YourContract: this.props.contractLoader("YourContract")
      },()=>{
        console.log("YOURCONTRACT IS LOADED:",this.state.YourContract)
      })
    } catch (error) {
      console.log('error loading contract in componentDidMount');
    }

    setInterval(this.pollInterval.bind(this),50000)
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
      //yourContractBalance = this.props.web3.utils.fromWei(yourContractBalance,'ether')
      let count = await this.state.YourContract.messageCount().call();
      this.setState({yourVar,yourContractBalance,mainnetBlockNumber,xdaiBlockNumber})
      this.setState({messageCount: count})
      let messages = []
      for (var i = 0; i < this.state.messageCount; i++) {
        let message = await this.state.YourContract.chat(i).call();
        messages.push(message);
      }
    this.setState({chat: messages});    } else {
      console.log('skipped poll');
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
            YOURMODULE DISPLAY HERE
            <Ruler/>
            <div style={{padding:20}}>
              The logged in user is
              <Blockie
                address={this.props.address}
                config={{size:6}}
              />
              {this.props.address.substring(0,8)}
              <div>
                {this.props.dollarDisplay(this.props.balance)}<img src={this.props.xdai} style={{maxWidth:22,maxHeight:22}}/>
              </div>
              <div>
                {this.props.dollarDisplay(this.props.daiBalance)}<img src={this.props.dai} style={{maxWidth:22,maxHeight:22}}/>
              </div>
              <div>
                {this.props.dollarDisplay(this.props.ethBalance*this.props.ethprice)}<img src={this.props.eth} style={{maxWidth:22,maxHeight:22}}/>
              </div>
            </div>

            <Ruler/>

            <div>
              Network {this.props.network} is selected and on block #{this.props.block}.
            </div>
            <div>
              Gas price on {this.props.network} is {this.props.gwei} gwei.
            </div>
            <div>
              mainnetweb3 is on block {this.state.mainnetBlockNumber} and version {this.props.mainnetweb3.version}
            </div>
            <div>
              xdaiweb3 is on block {this.state.xdaiBlockNumber} and version {this.props.xdaiweb3.version}
            </div>
            <div>
              The current price of ETH is {this.props.dollarDisplay(this.props.ethprice)}.
            </div>

            <div>
              # of messages: {this.state.messageCount}.
            </div>

            <div>
            <ul>
              {this.state.chat.map((item, index) => (
                <li>{item}</li>
              ))}
              Chat Is: {this.state.chat}
            </ul>
            </div>
            <Ruler/>

            <button className="btn btn-large w-50" style={this.props.buttonStyle.secondary} onClick={async ()=>{

              let hashSigned = this.props.web3.utils.sha3("jabronie pie"+Math.random())
              let sig
              //sign the hash using either the meta account OR the etherless account
              if(this.props.privateKey){
                sig = this.props.web3.eth.accounts.sign(hashSigned, this.props.privateKey);
                sig = sig.signature
              }else{
                sig = await this.props.web3.eth.personal.sign(""+hashSigned,this.props.address)
              }

              this.props.tx(this.state.YourContract.sign(hashSigned,sig),50000,0,0,(result)=>{
                console.log("RESULTsssss@&&&#&#&#&# ",result)
              })

            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-pen"></i> {"sign a random hash"}
              </Scaler>
            </button>

          </div>

          <Events
            config={{hide:false}}
            contract={this.state.YourContract}
            eventName={"Sign"}
            block={this.props.block}
            onUpdate={(eventData,allEvents)=>{
              console.log("EVENT DATA:",eventData)
              this.setState({signEvents:allEvents})
            }}
          />

          <Ruler/>

          <button className="btn btn-large w-100" style={this.props.buttonStyle.primary} onClick={this.deployYourContract.bind(this)}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-rocket"></i> {"deploy"}
            </Scaler>
          </button>


          <div className="content bridge row">
            <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                let toAddress = this.state.YourContract._address
                let amount = "0.1"
                this.props.send(toAddress, amount, 120000,"0x00", (result) => {
                  if(result && result.transactionHash){
                    console.log("RESULT&&&#&#&#&# ",result)
                  }
                })
              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-arrow-circle-down"></i> {"deposit"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
            <div style={{padding:20,textAlign:'center'}}>
              Your contract is
              <Blockie
                address={this.state.YourContract._address}
                config={{size:3}}
              />
              {this.state.YourContract._address.substring(0,8)}

              <div style={{padding:5}}>
                it has {this.props.dollarDisplay(this.state.yourContractBalance)}
              </div>


            </div>
            </div>
            <div className="col-4 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
              let amount = this.props.web3.utils.toWei("0.1",'ether')
              this.props.tx(this.state.YourContract.withdraw(amount),40000,0,0,(result)=>{
                console.log("RESULT@@@@@@@@@@@@@@@@@&&&#&#&#&# ",result)
              })
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-arrow-circle-up"></i> {"withdraw"}
              </Scaler>
            </button>
            </div>
          </div>

          <div className="content bridge row">
            <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                this.clicked("some")
              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-dog"></i> {"some"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                this.clicked("chat")
              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-bone"></i> {"Chat"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
              this.clicked("buttons")
            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-paw"></i> {"buttons"}
              </Scaler>
            </button>
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

          <div className="content bridge row">
            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                alert('secondary')}
              }>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-bell"></i> {"secondary"}
                </Scaler>
              </button>
            </div>
            <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
              alert('actions')}
            }>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-hand-holding-usd"></i> {"actions"}
              </Scaler>
            </button>
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
      </div>
    )

  }
}
