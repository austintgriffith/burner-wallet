import React, { Component } from "react";
import QrReader from "react-qr-scanner";
import { Scaler } from "dapparatus";
import qrimage from '../qrcode.png';
class SendByScan extends Component {
  constructor(props){
    super(props)
    this.state = {
      delay: 100,
      legacyMode: true,
    };
    this.handleScan = this.handleScan.bind(this)
    this.openImageDialog = this.openImageDialog.bind(this)
  }
  stopRecording = () => this.setState({ delay: false });
  onImageLoad = data => {
    console.log(data)
    setTimeout(()=>{
      alert("Please Try Again. Maybe farther away? QRCode should be ~20% of the image.")
    },4000)
  }
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
  chooseDeviceId = (a,b) => {
    console.log("choose",a,b)
  }
  openImageDialog() {
    this.refs.qrReader1.openImageDialog()
  }
  handleError = error => {
    console.error(error);
    this.setState({legacyMode:true})
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

    let legacyOverlay = ""
    if(this.state.legacyMode){
      legacyOverlay = (
        <div style={{position: 'absolute',zIndex:11,top:0,left:0,width:"100%",height:"100%",color:"#FFFFFF",cursor:"pointer"}} onClick={this.openImageDialog}>
          <div style={{textAlign:"center",paddingTop:"15%"}}>
            <div style={{marginBottom:20}}><i className="fas fa-camera"></i></div>

            <img src={qrimage} style={{position:"absolute",left:"36%",top:"25%",padding:4,border:"1px solid #888888",opacity:0.25,maxWidth:"30%",maxHight:"30%"}} />
          </div>
          <div style={{textAlign:"center",paddingTop:"45%"}}>
            <div>Take a picture of a QR Code:</div>

            <div style={{marginTop:20}}>
              <button className="btn btn-large w-50">
                <i className="fas fa-camera"  /> Take Picture
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{  position: "fixed",top:0,left:0,right:0,bottom:0,zIndex:5,margin:'0 auto !important',background:"#000000"}}>
        <div style={{ position: 'absolute',zIndex: 12,top:20,right:20,fontSize:80,paddingRight:20,color:"#FFFFFF",cursor:'pointer'}} onClick={this.onClose} >
          <i className="fa fa-times" aria-hidden="true"></i>
        </div>
        {legacyOverlay}
        <QrReader
          ref="qrReader1"
          delay={this.state.delay}
          onError={this.handleError}
          onScan={this.handleScan}
          onImageLoad={this.onImageLoad}
          /*facingMode="rear"*/
          /*maxImageSize={this.state.maxImageSize}*/cd
          legacyMode={this.state.legacyMode}
          /*chooseDeviceId={this.chooseDeviceId}*/
          style={{ width: "100%" }}
        />
      </div>
    );
  }
}

export default SendByScan;
