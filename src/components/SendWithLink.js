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
    this.state = {
      amount: props.amount,
      canSend: false,
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: (this.state.amount > 0) })
    });

  };

  send = () => {
    let { amount } = this.state;
    if(this.state.canSend){
      this.props.changeView('loader')
      this.props.sendWithLink(amount, (result) => {
        if(result && result.transactionHash){
          this.props.changeView('share-link')
          this.props.changeAlert({
            type: 'success',
            message: 'Sent! '+result.transactionHash,
          });
        }else{
          this.props.changeAlert({
            type: 'danger',
            message: 'Error Sending!',
          });
        }
      })
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid amount'})
    }
  };

  render() {
    let { canSend } = this.state;
    return (
      <div>
        <div className="send-to-address card w-100">
          <Balance amount={this.props.balance} address={this.props.address}/>
          <Ruler/>
          <div className="content row">
            <div className="form-group w-100">
              <label htmlFor="amount_input">Amount</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00"
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
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
