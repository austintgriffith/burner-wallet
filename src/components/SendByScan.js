import React, { Component } from "react";
import QrReader from "react-qr-reader";
import ReactLoading from 'react-loading';
import FileReaderInput from 'react-file-reader-input';
import QrCode from 'qrcode-reader';
import qrimage from '../qrcode.png';
var Jimp = require("jimp");

class SendByScan extends Component {
  constructor(props){
    super(props)
    let defaultToLegacyMode = false
    if(!navigator||!navigator.mediaDevices){
      defaultToLegacyMode = true
    }
    this.state = {
      delay: 400,
      browser: "",
      legacyMode: defaultToLegacyMode,
      scanFail: false,
      isLoading: false
    };
    this.handleScan = this.handleScan.bind(this)
  }
  stopRecording = () => this.setState({ delay: false });
  onImageLoad = data => {
    console.log(data)
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
  handleError = error => {
    console.error(error);
    this.setState({legacyMode:true})
    this.props.onError(error);
  };
  onClose = () => {
    this.stopRecording();
    this.props.goBack();
  };
  //componentDidMount(){
  //  this.setState({scanFail:"TEST"})
  //}
  componentWillUnmount() {
    this.stopRecording();
  }
  legacyHandleChange(e, results){
    //this.props.changeView('reader')
    results.forEach(result => {
      const [e, file] = result;
      let reader = new FileReader();
      reader.onload = (e) => {
      //  this.props.changeView('send_by_scan',()=>{
          console.log("")
          this.setState({imageData:e.target.result})
          Jimp.read(Buffer.from(e.target.result.replace(/^data:image\/png;base64,/, "").replace(/^data:image\/jpeg;base64,/, ""), 'base64'),(err, image) => {
              if (err) {
                  alert("ERR1")
                  console.error("ERR1",err);
                  this.setState({scanFail:err.toString()})
              }
              var qr = new QrCode();
              qr.callback = (err, value) => {
                  this.setState({isLoading:false})
                  if (err) {
                    setTimeout(()=>{
                      console.log("FAILED TO SCAN!!!")
                      this.setState({scanFail:err.toString()})
                      setTimeout(()=>{
                        this.setState({imageData:false})
                      },1500)
                      setTimeout(()=>{
                        this.setState({scanFail:false})
                      },3500)
                    },1500)
                  }else if(value&&value.result){
                    this.handleScan(value.result)
                  }
              };
              if(!image||!image.bitmap){
                //this.setState({extraFail:JSON.stringify(e.target.result)})
              }else{
                qr.decode(image.bitmap);
              }

          })
      //  })
      };
      reader.readAsDataURL(file);
    })
  }
  render() {

    let displayedImage = ""
    if(this.state.imageData){
      displayedImage = (
        <img style={{position:"absolute",left:0,top:0,maxWidth:"100%",opacity:0.7}} src={this.state.imageData} />
      )
    }

    let loader = ""
    if(this.state.isLoading){
      loader = (
        <div style={{position:'absolute',left:0,top:"-25%",zIndex:98,fontSize:24,color:"#FF0000",backgroundColor:"#333333",opacity:0.9,width:"100%",height:1,fontWeight:'bold'}}>
          <ReactLoading type="cylon" color={"#FFFFFF"} width={"100%"}  />
        </div>
      )
    }

    let failMessage = ""
    if(this.state.scanFail){
      failMessage = (
        <div style={{position:'absolute',left:0,top:0,zIndex:99,fontSize:24,color:"#FF0000",backgroundColor:"#333333",opacity:0.9,width:"100%",height:"100%",fontWeight:'bold'}}>
          <div style={{textAlign:"center",paddingTop:"15%"}}>
            <div style={{marginBottom:20}}><i className="fas fa-ban"></i></div>
          </div>
          <div style={{textAlign:"center",paddingTop:"25%"}}>
            <div>Please Try Again</div>

          </div>
          <div style={{textAlign:"center",padding:"10%",paddingTop:"15%",fontSize:16}}>
            <div>{this.state.scanFail}</div>
          </div>
        </div>
      )
    }

    let displayedReader = (
      <QrReader
        delay={this.state.delay}
        onError={this.handleError}
        onScan={this.handleScan}
        onImageLoad={this.onImageLoad}
        style={{ width: "100%" }}
      />
    )
    if(this.state.legacyMode){
      displayedReader = (
        <div onClick={()=>{
          console.log("LOADING...")
          this.setState({isLoading:true})
        }}>
        <FileReaderInput as="binary" id="my-file-input" onChange={this.legacyHandleChange.bind(this)}>
        <div style={{position: 'absolute',zIndex:11,top:0,left:0,width:"100%",height:"100%",color:"#FFFFFF",cursor:"pointer"}}>
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
        </FileReaderInput>
        </div>
      )
    }


    return (
      <div style={{  position: "fixed",top:0,left:0,right:0,bottom:0,zIndex:5,margin:'0 auto !important',background:"#000000"}}>
        <div style={{ position: 'absolute',zIndex: 256,top:20,right:20,fontSize:80,paddingRight:20,color:"#FFFFFF",cursor:'pointer'}} onClick={this.onClose} >
          <i className="fa fa-times" aria-hidden="true"></i>
        </div>
        {displayedReader}
        <div style={{position: 'absolute',zIndex:11,bottom:20,fontSize:12,left:20,color:"#FFFFFF",opacity:0.333}}>
          {navigator.userAgent} - {JSON.stringify(navigator.mediaDevices)}
        </div>
        {displayedImage}
        {failMessage}
        {loader}
      </div>
    );
  }
}

export default SendByScan;
