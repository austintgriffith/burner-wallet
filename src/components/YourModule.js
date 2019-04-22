import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"
import { getConnextClient } from "connext/dist/Connext.js";

export default class YourModule extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      yourVar: "",
      connext: false,
      YourContract: false,
      yourContractBalance: 0,
      toAddress: (props.scannerState ? props.scannerState.toAddress : ""),
    }

  }

  async initConnext(){
    // set the client options

    let hubUrl="https://hub.connext.network/api/hub"
    let ethUrl="https://hub.connext.network/api/eth"

    let connextOptions = {
      hubUrl,
      ethUrl,
      user: this.props.address,
      origin: "localhost" // the host url of your app
    }

    if(this.props.privateKey){
      connextOptions.privateKey = this.props.privateKey
      //connextOptions.ethUrl = this.props.mainnetweb3._provider.connection.url
      //connextOptions.ethUrl = "http"
      //console.log("this.props.mainnetweb3._provider.connection.url",this.props.mainnetweb3._provider.connection.url)
    }else{
      connextOptions.web3 = this.props.web3
    }

    // instantiate a new instance of the client
    console.log("GET CONNEXT CLIENT: ",connextOptions)
    const connext = await getConnextClient(connextOptions)
    console.log("CONNEXT LOADED:",connext)

    // the connext client is an event emitter
    // start the app, and register a listener
    connext.on('onStateChange', connext => {
      console.log('Connext STATE CHANGE:', connext)
      this.setState({connextInfo:connext})
    })

    console.log("Starting Connext...")
    // start connext
    await connext.start()
    console.log("STARTED CONNEXT!")
    this.setState({connext:connext},()=>{
      console.log("connext set:",this.state)
    })
  }
  componentDidMount(){
    console.log("YOUR MODULE MOUNTED, PROPS:",this.props)
     this.initConnext()

    /*
        -- LOAD YOUR CONTRACT --
        Contract files loaded from:
        src/contracts/YourContract.abi
        src/contracts/YourContract.address
        src/contracts/YourContract.blocknumber.js // the block number it was deployed at (for efficient event loading)
        src/contracts/YourContract.bytecode.js // if you want to deploy the contract from the module (see deployYourContract())
    */

  }
  clicked(name){
    console.log("secondary button "+name+" was clicked")
    /*
    Time to make a transaction with YourContract!
    */
    //this.props.tx(this.state.YourContract.updateVar(name),120000,0,0,(result)=>{
    //  console.log(result)
    // })

  }
  /*deployYourContract() {
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
  }*/
  render(){

    let connextState = "loading connext..."
    console.log("this.state.connext",this.state.connext)
    if(this.state.connext&& this.state.connextInfo.persistent){
      connextState = (
        <pre>
          {JSON.stringify(this.state.connextInfo.persistent,null, 2)}
        </pre>
      )
    }

    return (
      <div>
        <div className="form-group w-100">
          let's get connext integrated into the burner!
          <div style={{width:"100%",textAlign:"center"}}>
            <Ruler/>
            <div style={{padding:20}}>
              <Blockie
                address={this.props.address}
                config={{size:6}}
              />
              {this.props.address.substring(0,8)}
              <div>
                {this.props.dollarDisplay(this.props.ethBalance*this.props.ethprice)}<img src={this.props.eth} style={{maxWidth:22,maxHeight:22}}/>
              </div>
            </div>

            <Ruler/>

            <div>
              Network {this.props.network} is selected and on block #{this.props.block}.
            </div>
            connextState:
            {connextState}
            <div>
              Gas price on {this.props.network} is {this.props.gwei} gwei.
            </div>
            <div>
              mainnetweb3 is on block {this.state.mainnetBlockNumber} and version {this.props.mainnetweb3.version}
            </div>
            <div>
              The current price of ETH is {this.props.dollarDisplay(this.props.ethprice)}.
            </div>

            <Ruler/>

          </div>


          <Ruler/>

          <div className="content bridge row">
            <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={async ()=>{

                await this.state.connext.deposit({
                  amountWei: this.props.web3.utils.toWei("0.01",'ether'),
                  amountToken: "0", // assumed to be in wei units
                })


              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-arrow-circle-down"></i> {"deposit"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={async ()=>{

                // exchange wei for dai
                await this.state.connext.exchange("10000000000000000", "wei");

              }}>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-exchange"></i> {"exchange"}
                </Scaler>
              </button>
            </div>
            <div className="col-4 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={async ()=>{
              //let amount = this.props.web3.utils.toWei("0.1",'ether')
              /*
              this.props.tx(this.state.YourContract.withdraw(amount),40000,0,0,(result)=>{
                console.log("RESULT@@@@@@@@@@@@@@@@@&&&#&#&#&# ",result)
              })*/



              let withdrawObject = {
                // address to receive withdrawal funds
                // does not need to have a channel with connext to receive funds
                recipient: this.props.address,
                // USD price if using dai
                exchangeRate: this.state.connextInfo.runtime.exchangeRate.rates.USD,
                // wei to transfer from the user's balance to 'recipient'
                withdrawalWeiUser: this.state.connextInfo.persistent.channel.balanceWeiUser,
                // tokens from channel balance to sell back to hub
                tokensToSell: this.state.connextInfo.persistent.channel.balanceTokenUser,
              }
              console.log("WITHDRAWING",withdrawObject)

              await this.state.connext.withdraw(withdrawObject)

            }}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-arrow-circle-up"></i> {"withdraw"}
              </Scaler>
            </button>
            </div>
          </div>

          <Ruler/>

          <div className="content row">
            <label htmlFor="amount_input">{"EXAMPLE ADDRESS INPUT:"}</label>
            <div className="input-group">
              <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                ref={(input) => { this.addressInput = input; }}
                onChange={event => this.updateState('toAddress', event.target.value)}
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
                  onClick={async ()=>{

                    const purchaseId = await this.state.connext.buy({
                      meta: {

                      },
                      payments: [
                        {
                          recipient: "0xf22c19717c5cd8226b5fd1c59af48c9982c5815a", // payee  address
                          amount: {
                            amountToken: "1722900000000000000",//this.props.web3.utils.toWei("1",'ether'),
                            amountWei: "0" // only token payments are facilitated
                          },
                          type: "PT_CHANNEL", // the payment type, see the client docs for more
                        },
                      ]
                    })

                  }}>
            Buy
          </button>

        </div>
      </div>
    )

  }
}
