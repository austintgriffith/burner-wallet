import React, { Component } from "react";
import QrReader from "react-qr-reader";

class QRCodeScanner extends Component {
  state = {
    delay: 500
  };
  stopRecording = () => this.setState({ delay: false });
  handleScan = data => {
    if (data) {
      const validate = this.props.onValidate(data);
      if (validate.result) {
        this.stopRecording();
        this.props.onScan(validate.data);
      } else {
        validate.onError();
      }
    }
  };
  handleError = error => {
    console.error(error);
    this.props.onError(error);
  };
  onClose = () => {
    this.stopRecording();
    this.props.onClose();
  };
  componentWillUnmount() {
    this.stopRecording();
  }
  render() {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          margin: "0 auto !important",
          background: "#000000"
        }}
      >
        <div
          style={{
            float: "right",
            fontSize: 80,
            margin: "5% 5% 0% 0%",
            color: "#FFFFFF",
            cursor: "pointer"
          }}
          onClick={this.onClose}
        >
          X
        </div>
        <div style={{ margin: "auto" }}>
          <QrReader
            delay={this.state.delay}
            onError={this.handleError}
            onScan={this.handleScan}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }
}

export default QRCodeScanner;