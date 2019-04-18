import React, { Component } from "react";
import QrReader from "react-qr-reader";
import FileReaderInput from 'react-file-reader-input';
import QrCode from 'qrcode-reader';
import qrimage from '../qrcode.png';
import RNMessageChannel from 'react-native-webview-messaging';
import i18n from "../i18n";
var Jimp = require("jimp");
let interval
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
      isLoading: false,
      percent: 5,
    };
    this.handleScan = this.handleScan.bind(this)

    if(RNMessageChannel&&typeof RNMessageChannel.send == "function"){
      try{
        RNMessageChannel.send("qr")
      }catch(e){}
    }
  }
  stopRecording = () => this.setState({ delay: false });
  onImageLoad = data => {
    console.log("IMAGE LOAD",data)
    console.log(data)
  }
  handleScan = data => {
    console.log("DATA")
    console.log(data)

    //detect and respect status deep links...
    if(data && data.indexOf("get.status.im")>=0){
      let paymentLocation = data.indexOf("payment/")
      let paymentParts = data.substring(paymentLocation)
      let paymentPartsArray = paymentParts.split("/")
      console.log("Status Deep Link paymentParts",paymentParts,paymentPartsArray)

      if(paymentPartsArray.length>=4){
        let toAddress = paymentPartsArray[1]
        let amount = paymentPartsArray[2]
        let orderId = paymentPartsArray[3]
        this.props.returnToState({toAddress,amount,daiposOrderId:orderId,message:"Ching Order: "+orderId})
      }
    }else{
      let dataAfterColon
      if(data){
        dataAfterColon = data
        let colonAt = dataAfterColon.lastIndexOf(":")
        if(colonAt>=0) dataAfterColon = dataAfterColon.substring(colonAt+1)
        if(!dataAfterColon){
          dataAfterColon = data
        }
        let slashAt = dataAfterColon.lastIndexOf("/")
        if(slashAt>=0) dataAfterColon = dataAfterColon.substring(slashAt+1)
        if(!dataAfterColon){
          dataAfterColon = data
        }
        console.log("SCAN",data)
        if(data.indexOf("/pk")>=0){
          //don't mess with it
        }else{
          dataAfterColon=dataAfterColon.replace("#","")//had to pull this to get PKs to load in right
        }

      }
      console.log("dataAfterColon:",dataAfterColon)
      if (dataAfterColon) {
        this.stopRecording();
        console.log("RETURN STATE:",this.props.returnState)
        if(this.props.returnState && this.props.returnState.view!="send_to_address"){
          let returnState = this.props.parseAndCleanPath(dataAfterColon)
          this.props.returnToState(returnState)
          console.log("return state",returnState)
        }else{
          this.props.changeView('reader')
          setTimeout(()=>{
            //maybe they just scanned an address?
            window.location = "/"+dataAfterColon
          },100)
        }
      }
    }
  };
  chooseDeviceId = (a,b) => {
    console.log("chooseDeviceId ",a,b)
    console.log("choose",a,b)
  }
  handleError = error => {
    console.log("SCAN ERROR")
    console.error(error);
    this.setState({legacyMode:true})
    this.props.onError(error);
  };
  onClose = () => {
    console.log("SCAN CLOSE")
    this.stopRecording();
    this.props.goBack();
  };
  componentDidMount(){
    interval = setInterval(this.loadMore.bind(this),750)
  }
  componentWillUnmount() {
    clearInterval(interval)
    this.stopRecording();
  }
  loadMore(){
    let newPercent = this.state.percent+3
    if(newPercent>100) newPercent=5
    this.setState({percent:newPercent})
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

    let loaderDisplay = ""
    if(this.state.isLoading){
      let shadowAmount = 100
      let shadowColor = this.props.mainStyle.mainColor
      loaderDisplay = (
          <div style={{textAlign:'center'}}>
            <div style={{width:"100%"}}>
              <img src ={this.props.loaderImage} style={{maxWidth:"25%"}}/>
            </div>
            <div style={{width:"80%",height:1,backgroundColor:"#444444",marginLeft:"10%"}}>
              <div style={{width:this.state.percent+"%",height:1,backgroundColor:this.props.mainStyle.mainColorAlt,boxShadow:"0 0 "+shadowAmount/40+"px "+shadowColor+", 0 0 "+shadowAmount/30+"px "+shadowColor+", 0 0 "+shadowAmount/20+"px "+shadowColor+", 0 0 "+shadowAmount/10+"px #ffffff, 0 0 "+shadowAmount/5+"px "+shadowColor+", 0 0 "+shadowAmount/3+"px "+shadowColor+", 0 0 "+shadowAmount/1+"px "+shadowColor+""}}>
              </div>
            </div>
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
            <div>{i18n.t('send_by_scan.try_again')}</div>

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
          {loaderDisplay}
          <div style={{textAlign:"center",paddingTop:"15%"}}>
            <div style={{marginBottom:20}}><i className="fas fa-camera"></i></div>
            <img src={qrimage} style={{position:"absolute",left:"36%",top:"25%",padding:4,border:"1px solid #888888",opacity:0.25,maxWidth:"30%",maxHight:"30%"}} />
          </div>
          <div style={{textAlign:"center",paddingTop:"35%"}}>

            <div>{i18n.t('send_by_scan.capture')}</div>
              <div className="main-card card w-100" style={{backgroundColor:"#000000"}}>
                <div className="content ops row" style={{paddingLeft:"12%",paddingRight:"12%",paddingTop:10}}>
                    <button className="btn btn-large w-100" style={{backgroundColor:this.props.mainStyle.mainColor}}>
                        <i className="fas fa-camera"  /> {i18n.t('send_by_scan.take_photo')}
                    </button>
                </div>
              </div>
            </div>
            <div style={{textAlign:"center",paddingTop:"5%"}}>
              Lay QR flat and take a picture of it from a distance.
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
      </div>
    );
  }
}

export default SendByScan;
