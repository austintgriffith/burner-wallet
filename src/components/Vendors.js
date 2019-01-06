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
    this.state = {
      vendor: false
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
      let products = []//this.state.products
      if(!products){
        products = []
      }

      let found = true
      while(found){
        let nextProduct = await this.props.contracts.DenDai.products(this.state.vendor,id).call()
        if(nextProduct.exists){
          products[id++] = nextProduct
        }else{
          found=false
        }
      }
      this.setState({products})
    }
  }
  render(){
    let {mainStyle,contracts,tx,web3,vendors} = this.props

    let {vendor} = this.state

    let products = []
    let vendorDisplay = []
    if(vendor){
      for(let p in this.state.products){
        let prod = this.state.products[p]
        if(prod.exists){

          let available = (
            <i className="far fa-eye"></i>
          )
          if(!prod.isAvailable){
            available = (
              <i className="far fa-eye" style={{opacity:0.3}}></i>
            )
          }

          products.push(
            <div className="content bridge row">
              <div className="col-6 p-1">
                {web3.utils.hexToUtf8(prod.name)}
              </div>
              <div className="col-5 p-1">
                ${web3.utils.fromWei(prod.cost,'ether')}
              </div>
            </div>
          )
        }
      }
    }else{
      for(let v in vendors){
        if(vendors[v].isAllowed){

          let vendorButton = (
            <button disabled={!vendors[v].isActive} className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"}}>
              <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
                {vendors[v].name}
              </Scaler>
            </button>
          )
          vendorDisplay.push(
            <div key={v} className="content bridge row">
              <div className="col-2 p-1" style={{textAlign:'center'}}>
                <Blockies seed={vendors[v].wallet.toLowerCase()} scale={5}/>
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
      <div className="main-card card w-100">
        {vendorDisplay}
        {products}
      </div>
    )
  }
}
