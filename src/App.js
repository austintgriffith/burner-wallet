import React, { Component } from 'react';
import './App.css';
import { Dapparatus, Metamask, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button } from "dapparatus"
import Web3 from 'web3';
import QRCodeScanner from "./QRCodeScanner.js"
import {CopyToClipboard} from 'react-copy-to-clipboard';
import ReactLoading from 'react-loading';
import axios from 'axios';

import eth from './ethereum.png';

var QRCode = require('qrcode.react');
let WEB3_PROVIDER = 'http://0.0.0.0:8545'

let CLAIM_RELAY = 'http://0.0.0.0:9999'

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
      sendWithLink: false,
      copied:false,
      amount:0.01,
      copiedPrivate:false,
    }
  }
  handleInput(e){
    let update = {}
    if(e.target.name=="sendToInput"){
      if(e.target.value.length==42){
        window.location = "/"+e.target.value
      }
    }
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
  onQRCodeScan(location){
    //THIS DOESN:T SEEM TO EVER GET CALLED
    //BUT I HAVE IT HERE JUST IN CASE ? IDK
    console.log("onQRCodeScan",location)
    if(location.indexOf("http")>=0){
      //we are good this is already an http address
      window.location = location
    } else {
      //maybe they just scanned an address?
      window.location = "/"+location.replace("Ethereum:","")
    }

  }
  toggleQRCodeScanner(){
    console.log("toggleQRCodeScanner")
    this.setState({scanning:!this.state.scanning})
  }
  componentDidMount(){
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        let account = window.location.pathname.substring(1)
        this.setState({sendTo:account})
      }else if(window.location.pathname.length==200){
        let parts = window.location.pathname.split("/")

        let claimId = parts[1]
        let claimSig = parts[2]
        //alert("DO CLAIM"+claimId+claimSig)

        this.setState({claimId,claimSig})
      }
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

    let moneytype = (
      <img style={{maxHeight:30,verticalAlign:"middle"}} src={eth}/>
    )
    if(window.location.hostname.indexOf("xdai")>=0 || window.location.hostname.indexOf("localhost")>=0){
      moneytype="$"
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
         config={{gasBoostPrice:0.15}}
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

        let alertStyle = {border:"1px solid #cccccc",padding:20,background:"#666666",color:"#bbbbbb",clear: "both",width:'100%',textAlign:'center',margin:'100 auto !important'}

        if(this.state.claimed){
          connectedDisplay.push(
            <div key={"claimedui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
              Claimed!!!
            </div>
          )
        }else if(this.state.claimId){
          connectedDisplay.push(
            <div key={"claimui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
              Claiming {this.state.claimId}...
            </div>
          )
        }else if(this.state.sendLink){
          let qrValue = url+"/"+this.state.sendLink+"/"+this.state.sendSig

          let qrDisplay = qrValue
          if(this.state.copied){
            qrDisplay="Copied Link!"
          }

          connectedDisplay.push(
            <div key={"sendwithlinkui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
              <div>
                Click anywhere to copy link:
              </div>
              <div style={{fontSize:14}}>
                {qrDisplay}
              </div>
            </div>
          )
        }else if(this.state.sendWithLink){

          if(this.state.balance<=0){
            connectedDisplay.push(
              <div style={alertStyle}>
                Not enough funds to send.
              </div>
            )
            setTimeout(()=>{
              window.location = "/"
            },1000)
          }

          connectedDisplay.push(
            <div key={"sendwithlinkui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
              {loaderBar}
             <div style={{padding:10,opacity:uiopacity}}>

             <div>send</div>
                <div>

                {moneytype}<input
              style={{fontSize:30,verticalAlign:"middle",width:90,margin:6,padding:5,border:'2px solid #ccc',borderRadius:5}}
              type="text" name="amount" value={this.state.amount} onChange={this.handleInput.bind(this)}
          /></div>

               <Button size="2" color={"green"} onClick={()=>{
                  this.setState({sending:true})
                  let randomHash = this.state.web3.utils.sha3(""+Math.random())
                  //try hardcoding one to make sure you can only post it once:
                  //let randomHash = "0x92e3f323940c7bc4b0bd4ed93636f25aad612d83a6f368371d22143a1241adbb"
                  console.log("~~~ RAND:",randomHash,randomHash.length)
                  tx(contracts.Links.send(randomHash),300000,false,this.state.amount*10**18,()=>{
                    let sig = this.state.web3.eth.accounts.sign(randomHash, this.state.metaAccount.privateKey);
                    sig = sig.signature
                    this.setState({sending:false,sendLink:randomHash,sendSig:sig})

                  })
                 }}>
                 Send
               </Button>
               <div style={{marginTop:60}}>
                 <Button size="2" color={"orange"} onClick={()=>{
                    window.location = "/"
                   }}>
                   Cancel
                 </Button>
               </div>
             </div>
            </div>
          )


        }else if(this.state.sendTo){

          if(this.state.balance<=0){
            connectedDisplay.push(
              <div style={alertStyle}>
                Not enough funds to send.
              </div>
            )
            setTimeout(()=>{
              window.location = "/"
            },1000)
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
                   //alert("Sending "+this.state.amount+" to "+this.state.sendTo)
                   this.state.send(this.state.sendTo,this.state.amount,(result,e)=>{
                     if(result){
                       this.setState({sending:false},()=>{
                         //alert("DONE")
                         window.location = "/"
                       })
                     }
                   })
                 }}>
                 Send
               </Button>
               <div style={{marginTop:60}}>
                 <Button size="2" color={"orange"} onClick={()=>{
                    window.location = "/"
                   }}>
                   Cancel
                 </Button>
               </div>
             </div>
            </div>
          )

        }else{

          let qrValue = url+"/"+this.state.account

          let qrDisplay = this.state.account
          if(this.state.copied){
            qrDisplay="Copied Address!"
          }

          let sentToDisplay = (
            <div style={{marginTop:60}}>
              <div>or send to address:</div>
              <input
                  style={{verticalAlign:"middle",width:400,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
                  type="text" name="sendToInput" value={this.state.sendToInput} onChange={this.handleInput.bind(this)}
              />
            </div>
          )

          let bridgeButton = ""

          if(window.location.hostname.indexOf("xdai")>=0){
            bridgeButton = (
              <div style={{marginTop:60,marginBottom:60}}>
              <Button size="2" color={"blue"} onClick={()=>{
                window.location = "https://dai-bridge.poa.network"
                }}>
                xDai Bridge
              </Button>
              </div>
            )
          }

          let bottomDisplay = ""
          if(this.state.metaAccount){
            console.log("this.state.metaAccount",this.state.metaAccount.privateKey)

            let copiedPrivateText = "Copy Private Key"
            if(this.state.copiedPrivate){
              copiedPrivateText = "Copied Private Key"
            }

            bottomDisplay = (
              <div style={{marginTop:100}}>
              <CopyToClipboard text={this.state.metaAccount.privateKey}
                 onCopy={() => {
                   this.setState({copiedPrivate: true})
                   setTimeout(()=>{
                     this.setState({copiedPrivate: false})
                   },3000)
                 }}>
                 <Button size="2" color={"orange"} onClick={()=>{
                   }}>
                   {copiedPrivateText}
                 </Button>
               </CopyToClipboard>


               <div style={{marginTop:200,marginBottom:100}}>
                 <Button size="2" color={"red"} onClick={()=>{
                   if(this.state.balance>0.1){
                     alert("Can't burn a key that holds $0.10")
                   }else{
                     this.state.burnMetaAccount()
                   }
                   }}>
                   Burn Private Key
                 </Button>
               </div>
              </div>
            )
          }

          let dividerStyle = {padding:40,borderTop:"1px solid #dddddd"}

          connectedDisplay.push(
            <div key={"mainui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
            <div style={dividerStyle}>
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
             </div>
             <div style={dividerStyle}>

                 <Button color={"green"} size="2" onClick={()=>{
                     this.setState({sendWithLink:true})
                   }}>
                   Send with Link
                 </Button>

             </div>
             <div style={dividerStyle}>

                 <Button color={"green"} size="2" onClick={()=>{
                     this.setState({scanning:true})
                   }}>
                   Send with Scan
                 </Button>

             </div>

             <div style={dividerStyle}>
              {sentToDisplay}
             </div>

             <div style={dividerStyle}>
              {bridgeButton}
             </div>

             <div style={dividerStyle}>
              {bottomDisplay}
             </div>
            </div>
          )
        }
      }


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
             //check if we are trying to claim
             if(this.state.claimId&&this.state.claimSig){
               if(this.state.balance>0.005){
                 console.log("DOING CLAIM ONCHAIN",this.state.claimId,this.state.claimSig,this.state.account)
                 this.setState({sending:true})
                 tx(contracts.Links.claim(this.state.claimId,this.state.claimSig,this.state.account),300000,false,0,(result)=>{
                   if(result){
                     console.log("CLAIMED!!!",result)
                     this.setState({claimed:true})
                     setTimeout(()=>{
                       this.setState({sending:false},()=>{
                         //alert("DONE")
                         window.location = "/"
                       })
                     },2000)
                   }
                 })
               }else{
                 console.log("DOING CLAIM THROUGH RELAY",this.state.claimId,this.state.claimSig,this.state.account)
                 this.setState({sending:true})
                 let postData = {
                   id:this.state.claimId,
                   sig:this.state.claimSig,
                   dest:this.state.account
                 }
                 console.log("CLAIM_RELAY:",CLAIM_RELAY)
                 axios.post(CLAIM_RELAY+"/link", postData, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                  }).then((response)=>{
                    console.log("TX RESULT",response.data.transactionHash)
                    this.setState({claimed:true})
                    setTimeout(()=>{
                      this.setState({sending:false},()=>{
                        //alert("DONE")
                        window.location = "/"
                      })
                    },2000)
                  })
                  .catch((error)=>{
                    console.log(error);
                  });
               }

             }

           })
         }}
        />
      )
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


    let balanceDisplay  = this.state.balance //Math.round(this.state.balance*100,2)/100
    if(balanceDisplay){
      balanceDisplay = balanceDisplay.toFixed(2)
    }
    //console.log("balanceDisplay",balanceDisplay)
  //  if(!balanceDisplay) balanceDisplay="0"

    return (
      <div className="App">
        <Dapparatus
          config={{
            DEBUG:false,
            requiredNetwork:['Unknown','Rinkeby',"Mainnet"],
            metatxAccountGenerator: false, /*generate locally*/
          }}
          customContent = {()=>{
            return (
              <div style={{fontSize:50,marginBottom:5,marginBottom:5}}>
                {moneytype}{balanceDisplay}
              </div>
            )
          }}
          fallbackWeb3Provider={WEB3_PROVIDER}
          onUpdate={(state)=>{
           console.log("Dapparatus state update:",state)
           if(state.web3Provider) {
             state.web3 = new Web3(state.web3Provider)
             this.setState(state)
           }
         }}
        />
        <div style={{cursor:"pointer",position:'absolute',left:5,top:0,letterSpacing:-0.8,fontSize:50}}
          onClick={()=>{window.location = "/"}}
        >
          {window.location.hostname}
        </div>
        {connectedDisplay}
        {contractsDisplay}
      </div>
    );
  }
}

export default App;
