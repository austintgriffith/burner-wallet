import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';


export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    let startingAmount = 0.15
    if(props.amount){
      startingAmount = props.amount
    }
    let toAddress = ""
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        toAddress = window.location.pathname.substring(1)
      }
    }
    this.state = {
      address: toAddress,
      amount: props.amount,
      canSend: false,
    }
    console.log("SendToAddress constructor",this.state)
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: (this.state.address && this.state.address.length === 42 && this.state.amount > 0) })
    });

  };

  send = () => {
    let { address, amount } = this.state;
    if(this.state.canSend){
      if(this.props.balance<=amount){
        this.props.changeAlert({type: 'warning', message: 'You can only send $'+Math.floor(this.props.balance*100)/100+' (gas costs)'})
      }else{
        console.log("SWITCH TO LOADER VIEW...")
        this.props.changeView('loader')
        this.props.send(address, amount, (result) => {
          if(result && result.transactionHash){
            this.props.goBack();
            window.history.pushState({},"", "/");
            this.props.changeAlert({
              type: 'success',
              message: 'Sent! '+result.transactionHash,
            });
          }
        })
      }
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid address and amount'})
    }
  };

  render() {
    let { canSend, address } = this.state;
    return (
      <div>
        <div className="send-to-address card w-100">
          <Balance amount={this.props.balance} address={this.props.address}/>
          <Ruler/>
          <div className="content row">
            <div className="form-group w-100">
              <label htmlFor="amount_input">Send Amount</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00"
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <div className="form-group w-100">
              { this.state.address && this.state.address.length==42 && <Blockies seed={address} scale={10} /> }
              <label htmlFor="amount_input">To Address</label>
              <input type="text" className="form-control" placeholder="0x..." value={this.state.address}
                     onChange={event => this.updateState('address', event.target.value)} />
            </div>
            <button className={`btn btn-success btn-lg w-100 ${canSend ? '' : 'disabled'}`}
                    onClick={this.send}>
              Send
            </button>
          </div>
        </div>
        <div className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> cancel
            </a>
          </span>
        </div>
      </div>
    )
  }
}
