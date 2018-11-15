import React from 'react';
import { Blockie, Button } from "dapparatus";
import LoaderBar from './LoaderBar';


export default class SendTo extends React.Component {
    constructor(props) {
      super(props);
    }

    sendingClick(event){
      this.props.setSending(true);

      //alert("Sending "+this.state.amount+" to "+this.state.sendTo)
      this.props.send(this.props.sendTo, this.props.amount,(result, e)=>{
        if(result){
          this.props.setSending(true);
          window.location = "/";
        }
      })
    }

    render() {
      let element = [];

      let uiopacity = 1.0
      if(this.props.sending){
        uiopacity=0.5
      }

      if(this.props.sendTo){
        if(this.state.balance <= 0){
          element.push(
            <div style={this.props.alertStyle}>No Funds.</div>
          )
          setTimeout(()=>{
            window.location = "/"
          },1000)
        }

        element.push(
          <div key={"mainui"} style={{clear:'both',borderTop:"1px solid #cccccc",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
            <LoaderBar sending={this.props.sending}/>
            <div style={{padding:10,opacity:uiopacity}}>
            <div>send</div>
            <div>
              {this.props.moneytype}<input
              style={{fontSize:30,verticalAlign:"middle",width:90,margin:6,padding:5,border:'2px solid #ccc',borderRadius:5}}
              type="text" name="amount" value={this.props.amount} onChange={this.props.handleInput.bind(this)}
              />
            </div>
            <div>to</div>
              <div style={{padding:10}}>
                <Blockie config={{size:20}} address={this.props.sendTo}/>
              </div>
              <Button size="2" color={"green"} onClick={this.sendingClick.bind(this)}>Send</Button>
              <div style={{marginTop:60}}>
                <Button size="2" color={"orange"} onClick={()=>{ window.location = "/"}}>
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
