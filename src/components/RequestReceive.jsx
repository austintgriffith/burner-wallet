import React from 'react';
import { Button, Blockie } from "dapparatus";
import LoaderBar from './LoaderBar';

export default class RequestReceive extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: '0'};
      this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
      this.setState({value: event.target.value});
    }

    sendingClick(event){
      console.log("CLICK")
    }

    render() {
      let element = [];

      let uiopacity = 1.0

      if(this.props.requestReceive){

        element.push(
          <div key={"reuestPaymentUi"} style={{clear:'both',borderTop:"1px solid #cccccc",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
            <div style={{padding:10, opacity:uiopacity}}>
              <div>REQUEST SOME {this.props.moneytype}</div>
              <div style={{marginTop:20}}>
                Amount ({this.props.moneytype}):<input
                style={{fontSize:30, verticalAlign:"middle", width:90, margin:6, padding:5, border:'2px solid #ccc', borderRadius:5}}
                type="text" name="amount" value={this.state.value} onChange={this.handleChange}
                />
              </div>
              <div style={{marginTop:20}}>
                To Account:
                <Blockie config={{size:4}} address={this.props.account}/>
                 {this.props.account}
              </div>
              <Button size="2" color={"green"} onClick={this.sendingClick.bind(this)}>Request</Button>
              <div style={{marginTop:60}}>
                <Button size="2" color={"orange"} onClick={() => {window.location = "/"}}>
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
