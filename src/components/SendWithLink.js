import React from 'react';
import { CopyToClipboard } from "react-copy-to-clipboard";
const QRCode = require('qrcode.react');

export default class SendWithLink extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      amount: null,
      link: null
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value });
  };

  send = () => {

    let { amount } = this.state;
    let randomHash = this.props.web3.utils.sha3(Math.random().toString());
    let randomWallet = this.props.web3.eth.accounts.create();
    let sig = this.props.web3.eth.accounts.sign(randomHash, randomWallet.privateKey);

    this.props.tx(this.props.contracts.Links.send(randomHash, sig.signature),
      140000,
      false,
      amount * 1e18,
      async () => this.setState({
        link: `${window.location.href}/${randomHash};${randomWallet.privateKey}`
      })
    )
  };

  render() {
    let { link } = this.state;
    return (
      <div className="send-to-address card w-100">
        { this.props.children }
        {link
          ?
          <div className="content qr row">
            <QRCode value={link} size={256}/>
            <div className="input-group">
              <input type="text" className="form-control" placeholder={link} disabled/>
              <CopyToClipboard text={link}>
                <div className="input-group-append"
                     onClick={() => this.props.changeAlert({type: 'success', message: 'Link copied to clipboard'})}>
                  <span className="input-group-text"><i className="fas fa-copy"/></span>
                </div>
              </CopyToClipboard>
            </div>
          </div>
          :
          <div className="content row">
            <div className="form-group w-100">
              <label htmlFor="amount_input">Amount</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00"
                       onChange={event => this.updateState("amount", event.target.value)}/>
              </div>
            </div>
            <button className="btn btn-success btn-lg w-100"
                    onClick={this.send}>
              Send
            </button>
          </div>
        }
      </div>
    )
  }
}
