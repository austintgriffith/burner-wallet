import React from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { Button } from "dapparatus";

export default class CopyDisplay extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let copyDisplay = "";

      if(this.props.metaAccount){
        console.log("this.state.metaAccount", this.props.metaAccount.privateKey)
        let copiedPrivateText = "Copy Private Key"
        if(this.props.copiedPrivate){
          copiedPrivateText = "Copied Private Key"
        }

        copyDisplay = (
          <div >
            <CopyToClipboard text={this.props.metaAccount.privateKey}
               onCopy={() => {
                 this.props.setCopiedPrivate(true);
                 setTimeout(()=>{
                   this.props.setCopiedPrivate(false);
                 },3000)
               }}>
               <Button size="2" color={"orange"} onClick={() => { }}>
                 {copiedPrivateText}
               </Button>
             </CopyToClipboard>
          </div>)
      }
    return copyDisplay;
  }
}
