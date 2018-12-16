import React, { Component } from "react";
import QrReader from "react-qr-reader";

class SendByScan extends Component {
  state = {
    delay: 500
  };
  stopRecording = () => this.setState({ delay: false });
  handleScan = data => {
    if (data) {
      this.stopRecording();
      if(data.indexOf("http")>=0){
        //we are good this is already an http address
        window.location = data
      } else {
        //maybe they just scanned an address?
        window.location = "/"+data
      }

    }
  };
  handleError = error => {
    console.error(error);
    this.props.onError(error);
  };
  onClose = () => {
    this.stopRecording();
    this.props.goBack();
  };
  componentWillUnmount() {
    this.stopRecording();
  }
  render() {
    return (
      <div style={{  position: "fixed",top:0,left:0,right:0,bottom:0,zIndex:5,margin:'0 auto !important',background:"#000000"}}>
        <div style={{ position: 'absolute',zIndex: 10,top:20,right:20,fontSize:80,color:"#FFFFFF",cursor:'pointer'}} onClick={this.onClose} >
          X
        </div>
        <QrReader
          delay={this.state.delay}
          onError={this.handleError}
          onScan={this.handleScan}
          style={{ width: "100%" }}
        />
      </div>
    );
  }
}

export default SendByScan;
