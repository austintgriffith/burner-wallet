import React from 'react';
import { Button } from "dapparatus";
import LoaderBar from './LoaderBar';

export default class SendWithLink extends React.Component {
    constructor(props) {
      super(props);
    }

    sendingClick(event){
      this.props.setSending(true);

      let randomHash = this.props.web3.utils.sha3(""+Math.random())
      let randomWallet = this.props.web3.eth.accounts.create()
      let sig = this.props.web3.eth.accounts.sign(randomHash, randomWallet.privateKey);

      console.log("randomHash",randomHash)
      console.log("randomWallet",randomWallet)
      console.log("sig",sig.signature)
      console.log("~~~ RAND:",randomHash,randomHash.length)

      this.props.tx(this.props.contracts.Links.send(randomHash, sig.signature), 140000, false, this.props.amount*10**18, async ()=>{
        this.props.setSending(true);
        this.props.setSendInfo(randomHash, randomWallet.privateKey);
      });
    }

    render() {
      let element = [];

      let uiopacity = 1.0
      if(this.props.sending){
        uiopacity=0.5
      }

      if(this.props.sendWithLink){
        if(this.state.balance<=0){
          element.push(
            <div style={this.props.alertStyle}>No Funds.</div>
          )
          setTimeout(()=>{
            window.location = "/"
          },1000)
        }

        element.push(
          <div key={"sendwithlinkui"} style={{clear:'both',borderTop:"1px solid #cccccc",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
            <LoaderBar sending={this.props.sending}/>
            <div style={{padding:10,opacity:uiopacity}}>
              <div>send</div>
              <div>
                {this.props.moneytype}<input
                style={{fontSize:30,verticalAlign:"middle",width:90,margin:6,padding:5,border:'2px solid #ccc',borderRadius:5}}
                type="text" name="amount" value={this.props.amount} onChange={this.props.handleInput.bind(this)}
                />
              </div>
              <Button size="2" color={"green"} onClick={this.sendingClick.bind(this)}>Send</Button>
              <div style={{marginTop:60}}>
                <Button size="2" color={"orange"} onClick={()=>{window.location = "/"}}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )
      }

      return element;
    }
}
