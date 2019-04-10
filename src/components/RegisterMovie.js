// @format
import React from 'react';
import i18n from '../i18n';

export default class RegisterMovie extends React.Component {
  constructor(props) {
    super(props);
  }

  submit = async () => {};

  render() {
    return (
      <div>
        <div className="content row">
          <div className="form-group w-100">
            <div className="form-group w-100">
              <label htmlFor="amount_input">
                {i18n.t('send_to_address.to_address')}
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="0x..."
                  ref={input => {
                    this.addressInput = input;
                  }}
                />
                <div
                  className="input-group-append"
                  onClick={() => {
                    this.props.openScanner({view: 'send_to_address'});
                  }}>
                  <span
                    className="input-group-text"
                    id="basic-addon2"
                    style={this.props.buttonStyle.primary}>
                    <i style={{color: '#FFFFFF'}} className="fas fa-qrcode" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            name="theVeryBottom"
            className={`btn btn-lg w-100`}
            style={this.props.buttonStyle.primary}
            onClick={this.submit}>
            Send
          </button>
        </div>
      </div>
    );
  }
}
