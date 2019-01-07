import React from 'react';
import { Scaler } from "dapparatus";
import Blockies from 'react-blockies';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
const QRCode = require('qrcode.react');

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      changingAllowed: {},
    }
  }
  render(){
    let {mainStyle,contracts,tx,web3,vendors} = this.props

    let vendorBlockie = ""
    if(this.state.newVendor){
      vendorBlockie = (
        <Blockies seed={this.state.newVendor} scale={5}/>
      )
    }

    let adminBlockie = ""
    if(this.state.newAdmin){
      adminBlockie = (
        <Blockies seed={this.state.newAdmin} scale={5}/>
      )
    }

    let vendorDisplay = []
    for(let v in vendors){
      let vendorButton = (
        <button disabled={!vendors[v].isActive||!vendors[v].isAllowed} className="btn btn-large w-100"
          onClick={()=>{
            window.location = "/vendors;"+vendors[v].wallet
          }}
          style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"
        }}>
          <Scaler config={{startZoomAt:600,origin:"10% 50%"}}>
            {vendors[v].name}
          </Scaler>
        </button>
      )


      let vendorAllowedDisplay = ""
      if(this.state.changingAllowed[v]){
        vendorAllowedDisplay = (
          <i className="fas fa-cog fa-spin"></i>
        )
      }else if(vendors[v].isAllowed){
        vendorAllowedDisplay = (
          <i className="fas fa-lock-open"></i>
        )
      }else{
        vendorAllowedDisplay = (
          <i className="fas fa-lock"></i>
        )
      }

      let vendorIsAllowed = (
        <button className="btn btn-large w-100"
          onClick={()=>{
            let {changingAllowed} = this.state
            changingAllowed[v] = true
            this.setState({changingAllowed})
            //updateVendor(address wallet, bytes32 name, bool newAllowed)
            tx(contracts.DenDai.updateVendor(vendors[v].wallet,web3.utils.utf8ToHex(vendors[v].name),vendors[v].isActive,!vendors[v].isAllowed),120000,0,0,(result)=>{
              console.log("ACTIVE:",result)
              setTimeout(()=>{
                let {changingAllowed} = this.state
                changingAllowed[v] = false
                this.setState({changingAllowed})
              },1500)
            })
          }}
          style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"
        }}>
          <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
            {vendorAllowedDisplay}
          </Scaler>
        </button>
      )


      let vendorActiveDisplay = ""
      if(this.state.changingAllowed[v]){
        vendorActiveDisplay = (
          <i className="fas fa-cog fa-spin"></i>
        )
      }else if(vendors[v].isActive){
        vendorActiveDisplay = (
          <i className="fas fa-thumbs-up"></i>
        )
      }else{
        vendorActiveDisplay = (
          <i className="fas fa-window-close"></i>
        )
      }

      let vendorIsActive = (
        <button className="btn btn-large w-100"
          onClick={()=>{
            let {changingAllowed} = this.state
            changingAllowed[v] = true
            this.setState({changingAllowed})
            //updateVendor(address wallet, bytes32 name, bool newAllowed)
            tx(contracts.DenDai.updateVendor(vendors[v].wallet,web3.utils.utf8ToHex(vendors[v].name),!vendors[v].isActive,vendors[v].isAllowed),120000,0,0,(result)=>{
              console.log("ACTIVE:",result)
              setTimeout(()=>{
                let {changingAllowed} = this.state
                changingAllowed[v] = false
                this.setState({changingAllowed})
              },1500)
            })
          }}
          style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"
        }}>
          <Scaler config={{startZoomAt:500,origin:"50% 50%"}}>
            {vendorActiveDisplay}
          </Scaler>
        </button>
      )




      vendorDisplay.push(
        <div key={v} className="content bridge row">
          <div className="col-2 p-1" style={{textAlign:'center'}}>
            <Blockies seed={vendors[v].wallet.toLowerCase()} scale={5}/>
          </div>
          <div className="col-6 p-1" style={{textAlign:'center'}}>
            {vendorButton}
          </div>
          <div className="col-2 p-1" style={{textAlign:'center'}}>
            {vendorIsActive}
          </div>
          <div className="col-2 p-1" style={{textAlign:'center'}}>
            {vendorIsAllowed}
          </div>
        </div>
      )
    }


    return (
      <div className="main-card card w-100">

        {vendorDisplay}

        <div className="content bridge row">
          <div className="col-1 p-1">
            {vendorBlockie}
          </div>
          <div className="col-3 p-1">
            <input type="text" className="form-control" placeholder="0x..." value={this.state.newVendor}
                   onChange={event => this.setState({newVendor:event.target.value})} />
          </div>
          <div className="col-4 p-1">
            <input type="text" className="form-control" placeholder="Joe's Pizza" value={this.state.newVendorName}
                   onChange={event => this.setState({newVendorName:event.target.value})} />
          </div>
          <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"}} onClick={()=>{
            tx(contracts.DenDai.addVendor(this.state.newVendor,web3.utils.utf8ToHex(this.state.newVendorName)),(result)=>{
              console.log("VENDOR ADDED",result)
              this.setState({newVendor:"",newVendorName:""})
            })
          }}>
            <Scaler config={{startZoomAt:600,origin:"20% 50%"}}>
              <i className="fas fa-user"></i> Add Vendor
            </Scaler>
          </button>
          </div>
        </div>

        <div className="content bridge row">
          <div className="col-1 p-1">
            {adminBlockie}
          </div>
          <div className="col-7 p-1">
            <input type="text" className="form-control" placeholder="0x..." value={this.state.newAdmin}
                   onChange={event => this.setState({newAdmin:event.target.value})} />
          </div>
          <div className="col-4 p-1">
          <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor,whiteSpace:"nowrap"}} onClick={()=>{
            tx(contracts.DenDai.updateAdmin(this.state.newAdmin,true),(result)=>{
              console.log("ADMIN ADDED",result)
              this.setState({newAdmin:""})
            })
          }}>
            <Scaler config={{startZoomAt:600,origin:"20% 50%"}}>
              <i className="fas fa-user-astronaut"></i> Add Admin
            </Scaler>
          </button>
          </div>
        </div>

      </div>
    )
  }
}
