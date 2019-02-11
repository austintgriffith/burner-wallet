import React, { Component }  from 'react';
import { Scaler } from "dapparatus";
let interval

const OFFRAMPACCOUNT = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  updateState = (key, value) => {
    this.setState({ [key]: value });
  };

  render() {
    return (
      <div style={{textAlign:'left'}}>
        <div className="content row">

        <div style={{marginTop:20,width:"100%",height:20}}>
        </div>

        <label htmlFor="amount_input">{"Initiate Wyre Transfer"}</label>

        <div className="input-group">
          <div className="input-group-prepend">
            <div className="input-group-text">$</div>
          </div>
          <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
              ref={(input) => { this.amountInput = input; }}
                 onChange={event => this.updateState('amount', event.target.value)} />
        </div>
        <div style={{marginTop:20,width:"100%",height:20}}>
        </div>
        <button className="btn btn-large w-100" style={this.props.buttonStyle.primary}
                onClick={()=>{
                  this.props.changeView('loader')
                  setTimeout(()=>{
                    //maybe they just scanned an address?
                    window.location = "/"+OFFRAMPACCOUNT+";"+this.state.amount+";VENDOR%20CASH%20OUT"
                  },100)
                }}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-play"/> {'Start'}
          </Scaler>
        </button>

        </div>
      </div>
    )
  }
}
export default App;
