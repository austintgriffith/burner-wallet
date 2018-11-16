import React from 'react';
import { Button } from "dapparatus";

export default class BurnDisplay extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let burnDisplay = "";

      if(this.props.metaAccount){
        console.log("this.state.metaAccount", this.props.metaAccount.privateKey)
        let copiedPrivateText = "Copy Private Key"
        if(this.props.copiedPrivate){
          copiedPrivateText = "Copied Private Key"
        }

        burnDisplay = (
          <div>
           <div>
             <Button size="2" color={"red"} onClick={ () => {
               if(this.props.balance > 0.1){
                 alert("Can't burn a key that holds $0.10")
               }else{
                 this.props.burnMetaAccount()
               }
               }}>
               Burn Private Key
             </Button>
           </div>
          </div>
        )
      }

      return burnDisplay;
  }
}
