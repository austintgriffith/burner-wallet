import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { Scaler, Button } from "dapparatus";
import SentToDisplay from './SentToDisplay';
import BridgeButton from './BridgeButton';
import CopyDisplay from './CopyDisplay';
import BurnDisplay from './BurnDisplay';

var QRCode = require('qrcode.react');

export default class ClaimId extends React.Component {
    constructor(props) {
      super(props);
    }

    account
    copied

    render() {
      let url = window.location.protocol + "//" + window.location.hostname;

      if(window.location.port && window.location.port !== 80 && window.location.port !== 443){
        url = url+":"+window.location.port
      }

      let qrValue = url + "/" + this.props.account;
      let qrDisplay = this.props.account;

      if(this.props.copied){
        qrDisplay = "Copied Address!"
      }

      let dividerStyle = {padding:40,borderTop:"1px solid #dddddd"};

      let sendToInput = this.props.sendToInput;

      return (
        <div key={"mainui"} style={{clear: "both",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
          <div style={dividerStyle}>
            <CopyToClipboard text={this.props.account}
               onCopy={() => {
                 this.props.setCopied(true);
                 setTimeout(()=>{
                   this.props.setCopied(false);
                 },3000)
               }}>
               <div style={{cursor:"pointer"}}>
                 <Scaler config={{startZoomAt:400}}>
                   <QRCode value={qrValue} size={300} />
                 </Scaler>
                 <div style={{fontSize:13}}>
                   {qrDisplay}
                 </div>
               </div>
             </CopyToClipboard>
           </div>

           <div style={dividerStyle}>
             <Button color={"green"} size="2" onClick={() => this.props.setScanning(true)}>
               Send with Scan
             </Button>
           </div>

           <div style={dividerStyle}>
             <Button color={"green"} size="2" onClick={() => this.props.setSendWithLink(true)}>
               Send with Link
             </Button>
           </div>

           <div style={dividerStyle}>
            <SentToDisplay sendToInput={sendToInput} handleInput={this.props.handleInput}/>
           </div>

           <div style={dividerStyle}>
            <BridgeButton />
           </div>

           <div style={dividerStyle}>
            <CopyDisplay />
           </div>

           <div style={dividerStyle}>
            <BurnDisplay />
           </div>

           <div style={dividerStyle}>
             <div style={{marginTop:200,marginBottom:100}}>
               <Button size="2" color={"yellow"} onClick={() => {
                 window.location = "https://github.com/austintgriffith/burner-wallet"
                 }}>
                 Learn More
               </Button>
             </div>
           </div>
        </div>
      );
    }
}
