import React, { Component } from 'react';
import Dapparatus from "./newComponents/Dapparatus.js"
import Web3 from 'web3';

document.domain = 'galleass.io';

let WEB3_PROVIDER = "http://localhost:8545";

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      web3: false,
      account: false,
      gwei: 1.1,
      balance: 0.00,
      hasUpdateOnce: false,
    };
  }
  componentDidMount(){
    let myIframe = document.getElementById("myIframe")
    console.log("MOUNT",myIframe.contentWindow)
  }
  render(){
    return (
      <div>
        Testing
        <Dapparatus
          config={{
            DEBUG: false,
            hide: true,
            requiredNetwork: ['Unknown', 'xDai'],
            metatxAccountGenerator: false,
          }}
          //used to pass a private key into Dapparatus
          newPrivateKey={this.state.newPrivateKey}
          fallbackWeb3Provider={WEB3_PROVIDER}
          onUpdate={async (state) => {
            if (state.web3Provider) {
              state.web3 = new Web3(state.web3Provider)
              this.setState(state,()=>{
                console.log("state set:",this.state)
                console.log(state.web3.version)
                if(state.web3.version && typeof(state.web3.version.getNetwork)=="function"){
                  document.getElementById("myIframe").contentWindow.web3 = state.web3
                }else{
                  state.web3.version = {}
                  state.web3.version.getNetwork = (cb)=>{
                    cb(0,"Rinkeby")
                  }
                  document.getElementById("myIframe").contentWindow.web3 = state.web3
                }
              })
            }
          }}
        />
        <iframe id="myIframe" style={{width:"100%",height:800}} src="http://stage.galleass.io:8000/">
        </iframe>
      </div>
    )
  }
}

export default App;
