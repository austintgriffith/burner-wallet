import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';


export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
      amount: props.amount,
      message: props.message,
      canSend: false,
    }
    if(props.balance<=0){
      this.props.goBack();
      window.history.pushState({},"", "/");
    }
    let startingAmount = 0.15
    if(props.amount){
      startingAmount = props.amount
    }
    if(window.location.pathname){
      if(window.location.pathname.length==43){
        initialState.toAddress = window.location.pathname.substring(1)
      }else{
        let parts = window.location.pathname.split(";")
        console.log("PARTS",parts)
        if(parts.length>2){
          initialState.toAddress = parts[0].replace("/","")
          initialState.amount = parts[1]
          initialState.message = parts[2]
        }
      }
    }
    this.state = initialState
    console.log("SendToAddress constructor",this.state)
    window.history.pushState({},"", "/");
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: this.canSend() })
    });

  };

  componentDidMount(){
    this.setState({ canSend: this.canSend() })
  }

  canSend() {
    return (this.state.toAddress && this.state.toAddress.length === 42 && this.state.amount > 0)
  }

  send = () => {
    let { toAddress, amount } = this.state;
    if(this.state.canSend){
      if(this.props.balance<=amount){
        this.props.changeAlert({type: 'warning', message: 'You can only send $'+Math.floor((this.props.balance-0.0001)*100)/100+' (gas costs)'})
      }else{
        console.log("SWITCH TO LOADER VIEW...",amount)
        this.props.changeView('loader')
        setTimeout(()=>{window.scrollTo(0,0)},60)
        this.props.send(toAddress, amount, (result) => {
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
    let { canSend, toAddress } = this.state;

    let sendMessage = ""
    if(this.state.message){
      sendMessage = (
        <div className="form-group w-100">
          <label htmlFor="amount_input">For</label>
          <div>
            {decodeURI(this.state.message)}
          </div>
        </div>
      )
    }


    return (
      <div>
        <div className="send-to-address card w-100">
          <Balance amount={this.props.balance} address={this.props.address} dollarDisplay={this.props.dollarDisplay}/>
          <Ruler/>
          <div className="content row">
            <div className="form-group w-100">
              <div className="form-group w-100">
                <label htmlFor="amount_input">To Address</label>
                <input type="text" className="form-control" placeholder="0x..." value={this.state.toAddress}
                       onChange={event => this.updateState('toAddress', event.target.value)} />
              </div>
              <div>  { this.state.toAddress && this.state.toAddress.length==42 && <Blockies seed={toAddress.toLowerCase()} scale={10} /> }</div>
              <label htmlFor="amount_input">Send Amount</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            {sendMessage}
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
