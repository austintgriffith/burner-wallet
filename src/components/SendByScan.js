import React, { Component } from "react";
import QrScanner from "react-qr-scanner";
import QrReader from "react-qr-reader";
import { Scaler } from "dapparatus";
import qrimage from '../qrcode.png';
class SendByScan extends Component {
  constructor(props){
    super(props)
    this.state = {
      delay: 100,
      browser: "",
      legacyMode: false,
    };
    this.handleScan = this.handleScan.bind(this)
    this.openImageDialog = this.openImageDialog.bind(this)
  }
  stopRecording = () => this.setState({ delay: false });
  onImageLoad = data => {
    console.log(data)
    setTimeout(()=>{
      alert("Please Try Again. Maybe farther away? QRCode should be ~20% of the image.")
    },4500)
  }
  handleScan = data => {
    if (data) {
      this.stopRecording();
      this.props.changeView('reader')
      if(data.indexOf("http")>=0){
        setTimeout(()=>{
          //we are good this is already an http address
          window.location = data
        },100)
      } else {
        setTimeout(()=>{
          //maybe they just scanned an address?
          window.location = "/"+data
        },100)
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
            <div>Capture QR Code:</div>
              <div className="main-card card w-100" style={{backgroundColor:"#000000"}}>
                <div className="content ops row">
                    <button className="btn btn-large w-100">
                        <i className="fas fa-camera"  /> Take Picture
                    </button>
                </div>
              </div>
            </div>
        </div>
      )
    }

    let readerVersion = ""

    //{readerVersion}
    //for some messed up reason the other scanner always uses the front facing camera even when you set it to rear
    //so for specific phones we'll use the old version that actually uses the rear camera
    if(!this.state.legacyMode && !window.navigator.standalone && navigator.userAgent.indexOf("iPhone OS 12")>=0){
      readerVersion = (
        <QrReader
          delay={this.state.delay}
          onError={this.handleError}
          onScan={this.handleScan}
          onImageLoad={this.onImageLoad}
          style={{ width: "140%",marginLeft:"-20%" }}
        />
      )
    }else{
      readerVersion = (
        <QrScanner
          ref="qrReader1"
          delay={this.state.delay}
          onError={this.handleError}
          onScan={this.handleScan}
          onImageLoad={this.onImageLoad}
          legacyMode={this.state.legacyMode}
          style={{ width: "140%",marginLeft:"-20%" }}
        />
      )
    }



    return (
      <div style={{  position: "fixed",top:0,left:0,right:0,bottom:0,zIndex:5,margin:'0 auto !important',background:"#000000"}}>
        <div style={{ position: 'absolute',zIndex: 12,top:20,right:20,fontSize:80,paddingRight:20,color:"#FFFFFF",cursor:'pointer'}} onClick={this.onClose} >
          <i className="fa fa-times" aria-hidden="true"></i>
        </div>
        {legacyOverlay}
        {readerVersion}
        <div style={{position: 'absolute',zIndex:11,bottom:20,fontSize:12,left:20,color:"#FFFFFF"}}>
          {this.state.browser}
        </div>
      </div>
    );
  }
}

export default SendByScan;
