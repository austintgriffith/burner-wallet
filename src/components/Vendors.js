import React from 'react';
import { Scaler, Events } from "dapparatus";
import Blockies from 'react-blockies';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
const QRCode = require('qrcode.react');

let interval

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    let vendor = false
    if(window.location.pathname.indexOf("/vendors;")==0){
      vendor = window.location.pathname.replace("/vendors;","")
      window.history.pushState({},"", "/");
    }
    this.state = {
      vendor: vendor,
      vendorObject: false,
      loading: false,
      showQR: {}
    }
  }
  componentDidMount(){
    interval = setInterval(this.poll.bind(this),3000)
    setTimeout(this.poll.bind(this),444)
  }
  componentWillUnmount(){
    clearInterval(interval)
  }
  async poll(){
    let id = 0
    if(this.state.vendor){
     if(!this.state.vendorObject){
       let vendorData = await this.props.contracts[this.props.ERC20VENDOR].vendors(this.state.vendor).call()
       console.log("vendorData",vendorData)
       vendorData.name = this.props.web3.utils.hexToUtf8(vendorData.name)
       this.setState({vendorObject:vendorData})
     }
     console.log("Looking up products for vendor ",this.state.vendor)
     let products = []//this.state.products
     if(!products){
       products = []
     }
     let found = true
     while(found){
       let nextProduct = await this.props.contracts[this.props.ERC20VENDOR].products(this.state.vendor,id).call()
       if(nextProduct.exists){
         products[id++] = nextProduct
       }else{
         found=false
       }
     }
     this.setState({products,loading:false})
    }else{

     this.setState({loading:false})
    }
  }
  render(){
    let {mainStyle,contracts,tx,web3,vendors,dollarDisplay,vendorObject} = this.props

    let {vendor} = this.state

    let url = window.location.protocol+"//"+window.location.hostname
    if(window.location.port&&window.location.port!=80&&window.location.port!=443){
      url = url+":"+window.location.port
    }

    let correctVendorObject = this.state.vendorObject
    if(!correctVendorObject) correctVendorObject = vendorObject

    let products = []
    let vendorDisplay = []
    if(vendor){
      if(correctVendorObject){
        products.push(
          <div className="nav-card card">
            <div className="row">

              <div style={{position:'absolute',left:10,fontSize:42,top:0,cursor:'pointer',zIndex:1,padding:3}} onClick={()=>{this.setState({vendor:false})}}>
                <i className="fas fa-arrow-left" />
              </div>

              <div style={{textAlign:"center",width:"100%",fontSize:22}}>
                <Scaler config={{startZoomAt:500,origin:"80% 50%",adjustedZoom:1}}>
                  {correctVendorObject.name}
                </Scaler>
              </div>

            </div>
          </div>
        )
      }

      let qrSize = Math.min(document.documentElement.clientWidth,512)-90

      let correctProducts = this.state.products
      if(!correctProducts) correctProducts=this.props.products

      for(let p in correctProducts){
        let prod = correctProducts[p]
        if(prod.exists&&prod.isAvailable){

          let extraQR = ""

          let theName = web3.utils.hexToUtf8(prod.name)
          let theAmount = web3.utils.fromWei(prod.cost,'ether')

          let productLocation = "/"+vendor+";"+theAmount+";"+theName.replaceAll("#","%23").replaceAll(";","%3B").replaceAll(":","%3A").replaceAll("/","%2F")+";"+correctVendorObject.name+":"

          productLocation = encodeURI(productLocation)

          let qrValue = url+productLocation

          let toggleQR = () =>{
            let {showQR} = this.state
            showQR[p] = !showQR[p]
            this.setState({showQR})
          }

          if(this.state.showQR[p]){
            extraQR = (
              <div className="main-card card w-100" style={{paddingTop:40}} onClick={toggleQR}>
                <div className="content qr row">
                    <QRCode value={qrValue} size={qrSize}/>
                    <div style={{width:'100%',textAlign:'center'}}><div>{correctVendorObject.name}</div>  {theName}:   ${dollarDisplay(theAmount)}</div>
                </div>
              </div>
            )
          }


          let available = (
            <i className="far fa-eye"></i>
          )
          if(!prod.isAvailable){
            available = (
              <i className="far fa-eye" style={{opacity:0.3}}></i>
            )
          }

          products.push(
            <div className="content bridge row" style={{borderBottom:"1px solid #dddddd",paddingTop:15,paddingBottom:10}}>
              <div className="col-1 p-1" onClick={toggleQR}>
                <i className="fas fa-qrcode"></i>
              </div>
              <div className="col-4 p-1">
                {theName}
              </div>
              <div className="col-3 p-1">
                ${dollarDisplay(theAmount)}
              </div>
              <div className="col-4 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap",marginTop:-8}} onClick={()=>{
                this.setState({loading:true,products:false,vendor:false},()=>{
                  window.location = productLocation
                })

              }}>
                <Scaler config={{startZoomAt:500,origin:"40% 50%"}}>
                  Purchase
                </Scaler>
              </button>
              </div>
              {extraQR}
            </div>
          )
        }
      }


      let qrValue = url+"/vendors;"+this.state.vendor
      if(vendorObject){
        products.push(
          <div className="main-card card w-100" style={{paddingTop:40}}>
            <div className="content qr row">
                <QRCode value={qrValue} size={qrSize}/>
                <div style={{width:'100%',textAlign:'center'}}>{vendorObject.name}</div>
            </div>
          </div>
        )
      }

    }else{
      for(let v in vendors){
        if(vendors[v].isAllowed&&vendors[v].isActive){

          let vendorButton = (
            <button disabled={!vendors[v].isActive} className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"}} onClick={()=>{
                this.setState({loading:true,vendor:vendors[v].vendor,vendorObject:vendors[v]},()=>{
                   this.poll()
                })
            }}>
              <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                {vendors[v].name}
              </Scaler>
            </button>
          )
          vendorDisplay.push(
            <div key={v} className="content bridge row">
              <div className="col-2 p-1" style={{textAlign:'center'}}>
                <Blockies seed={vendors[v].vendor.toLowerCase()} scale={5}/>
              </div>
              <div className="col-10 p-1" style={{textAlign:'center'}}>
                {vendorButton}
              </div>
            </div>
          )
        }
      }
    }



    return (
      <div>

          {vendorDisplay}
          {products}

      </div>
    )
  }
}
