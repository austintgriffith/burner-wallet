import React from 'react';
import { Button } from "dapparatus";
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css' // Import css

export default class BurnDisplay extends React.Component {
    constructor(props) {
      super(props);
    }

    submit = () => {
      confirmAlert({
        title: 'Confirm to submit',
        message: 'Burn Baby Burn?',
        buttons: [
          {
            label: 'Yes',
            onClick: () => { this.props.burnMetaAccount(); }

          },
          {
            label: 'No'
          }
        ]
      })
    };

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
                 this.submit();
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
