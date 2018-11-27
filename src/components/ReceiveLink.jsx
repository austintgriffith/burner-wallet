import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { Scaler, Button } from "dapparatus"

var QRCode = require('qrcode.react');

export default class ReceiveLink extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let url = window.location.protocol + "//" + window.location.hostname;

      if(window.location.hostname === "localhost")
        url = url + ":3000";

      let element = "";
      let qrValue = url + "/receive_request;" + this.props.receiveAmount + ";" + this.props.receiveAddress + ";" + encodeURIComponent(this.props.receiveMessage);
      let extraDisplay = "";

      console.log('QrValue: ' + qrValue);
      // http://localhost:3000/receive_request/1;0xa5f2cedb82c5473b6da03bdc32c7989a23a57296;Gimme%20Gimme%20Gimme

      if(this.props.copiedLink){
        extraDisplay="Copied Link!"
      }

      if(this.props.receiveAmount){

        element = (
            <div key={"receivelinkui"} style={{clear:'both', borderTop:"1px solid #cccccc", width:'100%', textAlign:'center', margin:'0 auto !important'}}>
              <CopyToClipboard text={qrValue}
               onCopy={() => {
                 this.props.setCopiedLink(true);
                 setTimeout(()=>{
                   this.props.setCopiedLink(false);
                 },3000)
               }}>
                <div style={{textAlign:"center", cursor:'pointer'}}>
                   <div>
                     Click to copy link:
                   </div>

                   <div style={{wordWrap:'break-word', fontSize:14, width:'80%', border:'1px solid #ededed', paddingLeft:"10%", paddingRight:"10%", paddingTop:"15", paddingBottom:"15", backgroundColor:"#dfdfdf", margin:'0 auto !important'}}>
                     {qrValue}
                   </div>
                   {extraDisplay}
                   <Scaler config={{startZoomAt:400}}>
                    <QRCode value={qrValue} size={300} />
                   </Scaler>
                 </div>
              </CopyToClipboard>

              <Button size="2" color={"blue"} onClick={() => {
                window.location = "/"
                }}>
                Done
              </Button>
            </div>
        )
      }

      return element;
    }
}
