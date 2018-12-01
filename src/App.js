import React, { Component } from 'react';
import './App.css';
import { Dapparatus, Gas, ContractLoader, Transactions } from "dapparatus";
import Web3 from 'web3';
import axios from 'axios';

import HostName from './components/HostName';
import Scanner from './components/Scanner';
import BalanceDisplay from './components/BalanceDisplay';
import Claimed from './components/Claimed';
import ClaimId from './components/ClaimId';
import SendLink from './components/SendLink';
import SendWithLink from './components/SendWithLink';
import SendTo from './components/SendTo';
import Main from './components/Main';
import RequestReceive from './components/RequestReceive';
import ReceiveLink from './components/ReceiveLink'

import eth from './ethereum.png';

// JOHNS BRANCH TEST

let WEB3_PROVIDER = 'http://0.0.0.0:8545';

let CLAIM_RELAY = 'http://0.0.0.0:18462'

//WEB3_PROVIDER = new Web3("https://dai.poa.network")
//WEB3_PROVIDER = new Web3("wss://dai.infura.io/ws")
//https://core.poa.network'

if(window.location.hostname.indexOf("qreth")>=0){
  WEB3_PROVIDER = "https://mainnet.infura.io/v3/e59c464c322f47e2963f5f00638be2f8"
}else if(window.location.hostname.indexOf("xdai")>=0){
  WEB3_PROVIDER = "https://dai.poa.network"
  CLAIM_RELAY = 'https://x.xdai.io'
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 1.1,
      doingTransaction: false,
      scanning: false,
      sendTo: false,
      sendWithLink: false,
      copied:false,
      amount:0.01,
      copiedPrivate:false,
      copiedLink:false,
      requestMessage: false
    }
  }

  handleInput = (e) => {
    console.log("HAndle inout test" + e.target.name)
    let update = {}
    if(e.target.name === "sendToInput"){
      if(e.target.value.length === 42){
        window.location = "/" + e.target.value
      }
    }
    update[e.target.name] = e.target.value
    this.setState(update)
  }

  setCopiedLink = (isCopied) => {
    this.setState({copiedLink: isCopied});
  }

  setSending = (isSending) => {
    this.setState({sending: isSending});
  }

  setSendInfo = (randomHash, privateKey) => {
    this.setState({
      sendLink: randomHash,
      sendKey: privateKey
    })
  }

  setCopied = (isCopied) => {
    this.setState({copied: isCopied});
  }

  setScanning = (isScanning) => {
    console.log('Set scanning: ' + isScanning);
    this.setState({scanning: isScanning});
  }

  setSendWithLink = (sendWithLink) => {
    this.setState({sendWithLink: sendWithLink});
  }

  setCopiedPrivate = (isCopiedPrivate) => {
    this.setState({copiedPrivate: isCopiedPrivate});
  }

  setRequestReceive = (requestReceive) => {
    this.setState({requestReceive: requestReceive});
  }

  setReceiveInfo = (amount, address, message) => {
    console.log('Setting Receive')
    this.setState({
      receiveAmount: amount,
      receiveAddress: address,
      receiveMessage: message
    });
  }

  componentDidMount(){
    if(window.location.pathname){

      if(window.location.pathname.indexOf('/receive_request;') !== -1){
        let parts = window.location.pathname.replace('/receive_request;','').split(";")               // Used when a request payment link is received
        let amount = parts[0];
        let address = parts[1];

        let message = "";

        try{
          message = decodeURI(parts[2]);
        }catch(e){}


        this.setState({
          amount: amount,                                                                             // So the requested amount is displayed in SendTo component
          sendTo: address,                                                                            // Once this is set it triggers the SendTo component to display
          requestMessage: message
        });
      }
      else if(window.location.pathname.length === 43){
        let account = window.location.pathname.substring(1);                                          // Used when 'send to address' input is populate with address
        this.setState({sendTo:account});
      }else if(window.location.pathname.length === 134){
        let parts = window.location.pathname.split(";")                                                 // Used when a link to claim eth is used

        let claimId = parts[0].replace("/","")
        let claimKey = parts[1]
        console.log("DO CLAIM",claimId,claimKey)

        this.setState({claimId,claimKey})
      }
    }
  }

  checkClaim(tx, contracts){
   //check if we are trying to claim
   if(this.state.claimId && this.state.claimKey){
     if(this.state.balance > 0.005){
       this.chainClaim(tx, contracts);
     }else{
       this.relayClaim();
     }
   }
  }

  chainClaim(tx, contracts){
    console.log("DOING CLAIM ONCHAIN", this.state.claimId, this.state.claimKey, this.state.account);
    this.setState({sending:true})

    contracts.Links.funds(this.state.claimId).call().then((fund) => {
     if(fund){
       this.setState({fund: fund})
       console.log("FUND: ",fund)

       let hashOfDestination = this.state.web3.utils.soliditySha3(
         {type: 'bytes32', value: this.state.claimId}, // fund id
         {type: 'address', value: this.state.account}, // destination address
         {type: 'uint256', value: fund[3]}, // nonce
         {type: 'address', value: contracts.Links._address} // contract address
         )
       console.log("hashOfDestination",hashOfDestination)
       console.log("this.state.claimKey",this.state.claimKey)
       let sig = this.state.web3.eth.accounts.sign(hashOfDestination, this.state.claimKey);
       sig = sig.signature;
       console.log("CLAIM TX:",this.state.claimId, sig, this.state.account)
       tx(contracts.Links.claim(this.state.claimId, sig, this.state.account), 150000, false, 0, (result) => {
         if(result){
           console.log("CLAIMED!!!", result)
           this.setState({claimed: true})
           setTimeout(() => {
             this.setState({sending: false}, () => {
               //alert("DONE")
               window.location = "/"
             })
           }, 2000)
         }
       })
     }
   })
 }

 relayClaim(){
    console.log("DOING CLAIM THROUGH RELAY")
    this.state.contracts.Links.funds(this.state.claimId).call().then((fund) => {
       if(fund){
         this.setState({fund: fund})
         console.log("FUND: ",fund)

     let hashOfDestination = this.state.web3.utils.soliditySha3(
       {type: 'bytes32', value: this.state.claimId}, // fund id
       {type: 'address', value: this.state.account}, // destination address
       {type: 'uint256', value: fund[3]}, // nonce
       {type: 'address', value: this.state.contracts.Links._address} // contract address
       )
     console.log("hashOfDestination", hashOfDestination)
     console.log("this.state.claimKey", this.state.claimKey)
     let sig = this.state.web3.eth.accounts.sign(hashOfDestination, this.state.claimKey);
     sig = sig.signature
     console.log("CLAIM TX:", this.state.claimId,sig, this.state.account)

     this.setState({sending:true})
     let postData = {
       id:this.state.claimId,
       sig:sig,
       dest:this.state.account
     }
     console.log("CLAIM_RELAY:", CLAIM_RELAY)
     axios.post(CLAIM_RELAY + "/link", postData, {
         headers: {
           'Content-Type': 'application/json',
         }
       }).then((response)=>{
         console.log("TX RESULT", response.data.transactionHash)
         this.setState({claimed: true})
         setTimeout(()=>{
           this.setState({sending: false}, () => {
             //alert("DONE")
             window.location = "/"
           })
         }, 2000)
       })
       .catch((error)=>{
         console.log(error);
       });
     }
   })
 }

  render() {
    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan} = this.state;
    let connectedDisplay = [];

    let moneytype = (
      <img style={{maxHeight:30,verticalAlign:"middle"}} src={eth}/>
    )
    if(window.location.hostname.indexOf("xdai")>=0 || window.location.hostname.indexOf("localhost")>=0){
      moneytype="$"
    }

    if(web3){

      /*connectedDisplay.push(
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
     )*/

      let sending = this.state.sending;
      let scanning = this.state.scanning;
      let balance = this.state.balance;
      let network = this.state.network;
      let claimed = this.state.claimed;
      let claimId = this.state.claimId;
      let sendLink = this.state.sendLink;
      let sendKey = this.state.sendKey;
      let copiedLink = this.state.copiedLink;
      let sendWithLink = this.state.sendWithLink;
      let amount = this.state.amount;
      let sendTo = this.state.sendTo;
      let send = this.state.send;
      let copied = this.state.copied;
      let sendToInput = this.state.sendToInput;
      let metaAccount = this.state.metaAccount;
      let copiedPrivate = this.state.copiedPrivate;
      let burnMetaAccount = this.state.burnMetaAccount;
      let requestReceive = this.state.requestReceive;
      let account = this.state.account;
      let receiveAmount = this.state.receiveAmount;
      let receiveAddress = this.state.receiveAddress;
      let receiveMessage = this.state.receiveMessage;
      let requestMessage = this.state.requestMessage;

      if(this.state.scanning){
        connectedDisplay.push(<Scanner setQrIsScanning={this.setScanning} scanning={scanning} web3={web3}/>);
      }
      else{
        let alertStyle = {border:"1px solid #cccccc",padding:20,background:"#666666",color:"#bbbbbb",clear: "both",width:'100%',textAlign:'center',margin:'100 auto !important'}

        connectedDisplay.push(<BalanceDisplay web3={web3} balance={balance} network={network} moneytype={moneytype}/>);
        if(this.state.claimed){
          connectedDisplay.push(<Claimed claimed={claimed}/>);
        }else if(this.state.claimId){
          connectedDisplay.push(<ClaimId claimId={claimId}/>);
        }else if(this.state.sendLink){
          connectedDisplay.push(<SendLink sendLink={sendLink} sendKey={sendKey} copiedLink={copiedLink} setCopiedLink={this.setCopiedLink}/>);
        }else if(this.state.sendWithLink){
          connectedDisplay.push(<SendWithLink sendWithLink={sendWithLink} alertStyle={alertStyle} sending={sending} moneytype={moneytype} setSending={this.setSending} web3={web3} tx={tx} contracts={contracts} amount={amount} setSendInfo={this.setSendInfo} handleInput={this.handleInput} balance={balance}/>);
        }else if(this.state.sendTo){
          connectedDisplay.push(<SendTo sendTo={sendTo} alertStyle={alertStyle} sending={sending} moneytype={moneytype} amount={amount} handleInput={this.handleInput} send={send} balance={balance} setSending={this.setSending} requestMessage={requestMessage}/>);
        }else if(this.state.receiveAmount){
          connectedDisplay.push(<ReceiveLink sendLink={sendLink} sendKey={sendKey} copiedLink={copiedLink} setCopiedLink={this.setCopiedLink} receiveAmount={receiveAmount} receiveAddress={receiveAddress} receiveMessage={receiveMessage}/>);
        }else if(this.state.requestReceive){
          connectedDisplay.push(<RequestReceive requestReceive={requestReceive} moneytype={moneytype} amount={amount} setSendInfo={this.setSendInfo} handleInput={this.handleInput} balance={balance} account={account} setReceiveInfo={this.setReceiveInfo}/>);
        }else{
          connectedDisplay.push(<Main setCopied={this.setCopied} setScanning={this.setScanning} setSendWithLink={this.setSendWithLink} account={account} copied={copied} sendToInput={sendToInput} handleInput={this.handleInput} metaAccount={metaAccount} setCopiedPrivate={this.setCopiedPrivate} copiedPrivate={this.copiedPrivate} balance={balance} burnMetaAccount={burnMetaAccount} setRequestReceive={this.setRequestReceive}/>);
        }
      }

      connectedDisplay.push(
        <ContractLoader
         key="ContractLoader"
         config={{DEBUG:true}}
         web3={web3}
         require={path => {return require(`${__dirname}/${path}`)}}
         onReady={(contracts,customLoader)=>{
           console.log("contracts loaded", contracts)
           this.setState({contracts: contracts}, async() => {
             console.log("Contracts Are Ready:", this.state.contracts)
             this.checkClaim(tx, contracts);
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
            console.log("Transactions component is ready:", state)
            this.setState(state)

          }}
          onReceipt={(transaction,receipt)=>{
            // this is one way to get the deployed contract address, but instead I'll switch
            //  to a more straight forward callback system above
            console.log("Transaction Receipt",transaction,receipt)
          }}
        />
      )
    }

    return (
      <div className="App">
        <Dapparatus
          config={{
            DEBUG:false,
            requiredNetwork:['Unknown','xDai'],
            metatxAccountGenerator: false, /*generate locally*/
            onlyShowBlockie: true,
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
        <HostName/>

        {connectedDisplay}

      </div>
    );
  }
}

export default App;
