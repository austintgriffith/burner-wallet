import React, { Component }  from 'react';
import ReactLoading from 'react-loading';
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


/*

.glow {
  color: #fff;
  text-align: center;
  text-shadow: 0 0 20px #fff, 0 0 30px #ffffff, 0 0 40px #ffffff, 0 0 50px #ffffff, 0 0 60px #ffffff, 0 0 70px #ffffff, 0 0 80px #ffffff;
}

<img src ={burnerloader} style={{width:"75%",height:"75%",maringTop:"40%",opacity:0.16}}/>
<div style={{position:"relative",width:"100%",hegiht:"100%",margin:'auto',marginTop:"-50%",opacity:0.07}}>
  <ReactLoading type="cylon" color={"#FFFFFF"} width={"100%"} />
  <div style={{position:"absolute",left:0,top:"200%",width:this.state.percent+"%",height:"300%",backgroundColor:"#FFFFFF",opacity:0.3}}>
  </div>
</div>
*/
