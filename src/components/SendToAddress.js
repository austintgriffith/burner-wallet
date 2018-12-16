import React from 'react';
import Blockies from 'react-blockies';


export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      address: null,
      amount: null,
      canSend: false,
    };
    this.addressRef = React.createRef();
    this.amountRef = React.createRef();
  }

  componentDidMount() {
    let { amount, address } = this.props.requestSend;
    if (address) {
      this.addressRef.current.value = address;
      this.updateState('address', address);
    }
    if (amount) {
      this.addressRef.current.value = amount;
      this.updateState('amount', amount);
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
    let { canSend, address } = this.state;
    return (
      <div className="send-to-address card w-100">
        { this.props.children }
        <div className="content row">
          <div className="form-group w-100">
            <label htmlFor="amount_input">Amount</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <div className="input-group-text">$</div>
              </div>
              <input type="text" className="form-control" placeholder="0.00"
                     onChange={event => this.updateState('amount', event.target.value)}
                     ref={this.amountRef} />
            </div>
          </div>
          <div className="form-group w-100">
            { canSend && <Blockies seed={address} scale={10} /> }
            <label htmlFor="amount_input">Address</label>
            <input type="text" className="form-control" placeholder="0x..."
                   onChange={event => this.updateState('address', event.target.value)}
                   ref={this.addressRef} />
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
