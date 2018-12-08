import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";


export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      address: null,
      amount: null,
      canSend: false,
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value });
    if (key === 'address' ) {
      this.setState({ canSend: value.length === 42 })
    }
  };

  send = () => {
    let { address, amount } = this.state;
    this.props.send(address, amount, (result, error) => {
      if (result) {
        this.props.goBack();
      }
    })
  };

  render() {
    let { canSend } = this.state;
    return (
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
          <div className="form-group w-100">
            <label htmlFor="amount_input">Address</label>
            <input type="text" className="form-control" placeholder="0x..."
                   onChange={event => this.updateState('address', event.target.value)} />
          </div>
          <button className={`btn btn-success btn-lg w-100 ${canSend ? '' : 'disabled'}`}
                  onClick={this.send}>
            Send
          </button>
        </div>
      </div>
    )
  }
}
